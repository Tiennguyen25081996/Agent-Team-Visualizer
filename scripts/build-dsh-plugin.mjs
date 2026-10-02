import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { build } from 'vite'

// NOTE: outputs live OUTSIDE dist/ because the standalone app's `vite build`
// empties dist/ (emptyOutDir defaults to true) and would wipe the DSH package
// the web profile symlinks. dist-dsh/ is never touched by `npm run build`.
const outputDir = new URL('../dist-dsh/', import.meta.url)
const packageDir = new URL('../dist-dsh/agent-team-visualizer/', import.meta.url)
await mkdir(outputDir, { recursive: true })
await mkdir(packageDir, { recursive: true })

// The DSH web host serves exactly this specifier table to plugin factories
// (see `rM()` in @deepseek-ai/dsh-web-frontend dist/assets/index-*.js). Any
// specifier NOT listed here must be bundled into client.js, and any listed one
// that we bundle anyway ships a second React copy that cannot reach the host's
// internals -- that mismatch is what produced
// "undefined is not an object (evaluating 'Bo.S')" at boot.
const HOST_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

// The host runs React 18 (dsh-web-frontend depends on react/react-dom ^18.2.0).
// Bundling React 19 here breaks every hook and the reconciler, so fail the build
// loudly instead of shipping a bundle the host cannot activate.
const REACT_MAJOR = 18

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
for (const name of ['react', 'react-dom']) {
  const spec = pkg.dependencies?.[name] ?? ''
  const major = Number(/(\d+)/.exec(spec)?.[1])
  if (major !== REACT_MAJOR) {
    throw new Error(
      `${name} must stay on major ${REACT_MAJOR} to match the DSH host module table, got "${spec}"`,
    )
  }
}

// A bundled copy of React/ReactDOM reads a *different* internals object than the
// host's React, which is what produced "undefined is not an object (evaluating
// 'Bo.S')" at boot. Only these two must be shared with the host; `scheduler` and
// `react-is` are self-contained and safe to inline (react-dom ships its own
// scheduler copy in a normal install too).
const inlinedReactFiles = new Set()

await build({
  configFile: false,
  logLevel: 'warn',
  plugins: [
    {
      name: 'dsh-external-guard',
      // Only non-external ids reach load(), so anything matched here is bundled.
      load(id) {
        if (/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
          inlinedReactFiles.add(id.replace(`${process.cwd()}/`, ''))
        }
        return null
      },
    },
  ],
  build: {
    configFile: undefined,
    emptyOutDir: false,
    outDir: new URL('../dist-dsh/.bundle/', import.meta.url).pathname,
    lib: {
      entry: new URL('../src/dsh-live-plugin.tsx', import.meta.url).pathname,
      formats: ['cjs'],
      fileName: 'client',
    },
    rollupOptions: {
      // cjs output makes rolldown emit require() for externals and write named
      // exports onto the wrapper's module.exports (the official DSH pattern).
      // Everything else (three, react-three-fiber/drei, lucide) is bundled in.
      external: HOST_MODULES,
      output: {
        entryFileNames: 'client.js',
      },
    },
  },
})

if (inlinedReactFiles.size > 0) {
  throw new Error(
    `React must stay external to the DSH host module table, but these files were bundled:\n  ${[...inlinedReactFiles].join('\n  ')}`,
  )
}

const bundleDir = new URL('../dist-dsh/.bundle/', import.meta.url)
let client = await readFile(new URL('client.js', bundleDir), 'utf8')
client = client.replace(/\bprocess\.env\.NODE_ENV\b/g, '"production"')
if (/^import /m.test(client)) throw new Error('bundle still contains ESM imports; cjs build failed to inline externals')

// Every host-provided module this bundle actually uses must appear as a
// require() call, otherwise the factory would throw on a missing table entry.
for (const id of ['react', 'react-dom/client']) {
  if (!client.includes(`require("${id}")`)) {
    throw new Error(`bundle should require("${id}") from the DSH host module table`)
  }
}

// The host reads `exports.inject` through cordis's Inject.resolve(), which only
// understands an array or a plain object. A function (or anything else) silently
// resolves to zero injected services, so apply() runs with an empty ctx and the
// entry's fiber is disposed -- reported as "<id>: failed" by the web boot audit.
// The minifier may alias the export, so check the authored source, which is the
// contract we actually control.
const pluginSource = await readFile(new URL('../src/dsh-live-plugin.tsx', import.meta.url), 'utf8')
if (!/export\s+const\s+inject\s*=\s*\[/.test(pluginSource)) {
  throw new Error(
    'src/dsh-live-plugin.tsx must export `inject` as an array of service names, e.g. export const inject = ["slots"]',
  )
}

// Vite emits imported CSS as a sibling client.css that nothing ever loads, so
// inline it and register a <style> the way the official DSH plugins do.
let css = ''
try {
  css = await readFile(new URL('client.css', bundleDir), 'utf8')
} catch {
  // this entry emitted no stylesheet
}
const styleRegistration = css
  ? `    if (typeof document !== 'undefined' && !document.querySelector('style[data-dsh-atv-css]')) {
      var style = document.createElement('style');
      style.setAttribute('data-dsh-atv-css', '');
      style.textContent = ${JSON.stringify(css)};
      document.head.appendChild(style);
    }
`
  : ''

const clientOutput = `window.__ModuleLoader__.load({\n  id: "@local/agent-team-visualizer",\n  factory(require) {\n    var module = { exports: {} };\n    var exports = module.exports;\n    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n${styleRegistration}    ${client}\n    return module.exports;\n  },\n});\n`
await writeFile(new URL('client.js', outputDir), clientOutput)
await writeFile(new URL('client.js', packageDir), clientOutput)
const indexOutput = `/** Host loader entry for the browser-only Live Team plugin. */\n/** Provides no host-side behavior (client.js must not be imported here). */\nfunction apply() {}\nexport { apply };\n`
await writeFile(new URL('index.js', outputDir), indexOutput)
await writeFile(new URL('index.js', packageDir), indexOutput)
await writeFile(new URL('cordis.patch.yml', packageDir), await readFile(new URL('../cordis.patch.yml', import.meta.url)))
await writeFile(new URL('package.json', packageDir), await readFile(new URL('../package.json', import.meta.url)))
console.log('Built DSH plugin at dist-dsh/agent-team-visualizer')
