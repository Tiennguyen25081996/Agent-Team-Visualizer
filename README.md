# Agent Team Visualizer

A live 3D office view of an **Agent Team** for [DSH](https://www.npmjs.com/package/@deepseek-ai/dsh) Web, plus a standalone Vite prototype of the same dashboard.

The repo ships **two surfaces with two different data contracts**. This distinction is the whole point of the project and the most common source of confusion:

| Surface | Data source | Meaning |
| --- | --- | --- |
| **`Live Team`** — DSH Web client plugin (`conversation.view` slot) | The active Lead Session's `agentTeam` projection + DSH Session running status | **Real DSH runtime state.** This is the only truthful view. |
| **Standalone Overview** — `npm run dev` / `vite build` | Hardcoded `initialMembers`, `initialTasks`, `feed` in `src/App.tsx` | **Illustrative demo only.** Never present it as live operational state. |

## The Live Team plugin

`src/dsh-live-plugin.tsx` registers the view into the host's slot registry:

```tsx
export const inject = ['slots']            // must be an array — see below

export function apply(ctx: Context) {
  ctx.slots.inject('conversation.view', () => ctx.slots.register(
    { name: 'conversation.view', id: 'agent-team-visualizer', label: 'Live Team', order: 20 },
    LiveTeamView,
  ))
}
```

`src/dsh-live-entry.tsx` reads data through the host's standard props — nothing is fetched, polled, or simulated:

- `props.useSessions(state => …)` → `state.projectionsBySession[sessionId].values.agentTeam` (`TeamProjection.members` / `tasks` / `failure`)
- `props.useSessionStatus(state => …)` → `state.get(member.id)?.running`
- `props.useSession(snapshot => …)` → this session's own snapshot

### Status mapping (the single source of truth)

Every member's displayed status is derived, never authored:

| Condition | Status | Badge label | Task line | Progress |
| --- | --- | --- | --- | --- |
| `phase === 'failed'` | `Done` | `DSH lifecycle: failed` | `Agent failed to start` | 100 |
| `phase === 'provisioning'` | `Idle` | `DSH lifecycle: provisioning` | `Starting agent…` | 0 |
| `running === true` | `Working` | `DSH runtime: running` | `Agent session is running` | 55 |
| otherwise | `Idle` | `DSH runtime: inactive` | `Waiting / inactive` | 0 |

`phase` is `TeamMemberProjection.phase`: `'provisioning' | 'active' | 'failed'`.

There is **no invented activity feed, no per-tool events, no fabricated progress**. The Agent Team projection does not publish event-level detail, so the view shows none. A projection error is surfaced verbatim in a `live-warning` banner; a session with no Agent Team renders an explicit empty state.

### Movement rule

```
canWander = member.phase === 'active' && !isRunning
```

Only active, non-running agents walk. `Working` agents stay seated at their desk; `provisioning` and `failed` agents stand still at their chair.

## Layout & scene

Workstations are laid out on a grid that adapts to the roster size (`src/dsh-live-entry.tsx`):

```
spacingX = min(2.65, 10.4 / (columns - 1))
spacingZ = min(3.1,  7.2 / (rows - 1))
```

Idle agents orbit a **narrow ellipse in the aisle in front of their own desk** — deliberately not a full-width gather route, which clipped through the desk/chair footprint:

```
orbitRadiusX = min(0.62, max(0.3,  sceneWidth/2 - 1.25))
orbitRadiusZ = min(0.34, max(0.2,  sceneDepth/2 - 1.25))
orbitCenterZ = clamp(z + 1.75, -sceneDepth/2 + 1.25 + rZ, sceneDepth/2 - 0.2 - rZ)
```

32-second cycle per member, phase-offset by a hash of `member.id`: **orbit 18s → travel 4s → pause at the aisle 6s → return 4s**.

The Memoji bubble (`🙂 😎 🤔 😄 😴`) is **decorative ambient only** — seeded from `member.id` and a 7-second clock slot, never inferred from runtime. Its accessibility label says so: `Decorative ambient expression; not DSH emotion data`.

## File map

| Path | Role |
| --- | --- |
| `src/dsh-live-plugin.tsx` | Plugin entry: `inject = ['slots']` + `apply()` slot registration |
| `src/dsh-live-entry.tsx` | The whole Live Team view: data reading, status mapping, 3D scene, controls |
| `src/dsh-live.css` | Header/control styling matched to the DSH Live look |
| `src/office.css` | Name-tag badges and shared scene styling |
| `src/dsh-team-types.d.ts` | Type-only declarations of the host slot/props shapes (no runtime code) |
| `scripts/build-dsh-plugin.mjs` | Builds the installable DSH bundle into `dist-dsh/` |
| `cordis.patch.yml` | Patch manifest declaring the plugin insert |
| `src/App.tsx`, `src/App.css`, `src/OfficeScene.tsx`, `src/OfficeScene.css` | Standalone **demo** dashboard + its own 3D scene |
| `src/main.tsx`, `index.html`, `src/index.css` | Standalone Vite entry (`StrictMode` + `createRoot`) |
| `src/teamData.ts` | Shared `Member` / `MemberStatus` types used by both surfaces |

## Building the DSH plugin

```sh
npm install
npm run build:dsh     # tsc -b && vite build && node scripts/build-dsh-plugin.mjs
```

Output lands in **`dist-dsh/agent-team-visualizer/`**, deliberately outside `dist/`: the standalone `vite build` empties `dist/` (`emptyOutDir` defaults to true) and would wipe the symlinked package the web profile points at.

Install the package into the DSH `web` profile (it is linked at `~/.dsh/profiles/web/node_modules/@local/agent-team-visualizer`), then restart the existing DSH Web process. Rerun `npm run build:dsh` to refresh the symlinked artifacts before reloading DSH. Changes to the normal `apps/web` shell require rebuilding DSH itself — this plugin targets the host's client ModuleLoader and must never be served as a second app.

### Build guardrails (`scripts/build-dsh-plugin.mjs`)

The script fails loudly rather than shipping a bundle the host cannot activate:

- **React major check** — the DSH host serves React 18; a React 19 dependency breaks every hook, so the build throws.
- **Host module table** — `react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`, `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-store`, `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`, `@deepseek-ai/dsh-client-ui-dockkit` stay `external` and are `require()`d from the host. Bundling them would ship a second React whose internals the host cannot reach (`undefined is not an object (evaluating 'Bo.S')` at boot). Everything else (three, react-three-fiber/drei, lucide-react) is bundled in.
- **CJS shape** — output must contain no ESM `import` and must `require("react")` + `require("react-dom/client")`.
- **`inject` shape** — cordis's `Inject.resolve()` understands only arrays or plain objects; a function export silently resolves to zero services, `apply()` runs with an empty `ctx`, and the entry's fiber is disposed (`<id>: failed` in the web boot audit). The check reads the authored source because the minifier may alias the export.
- **CSS registration** — Vite emits `client.css` as a sibling nothing loads, so it is inlined and registered as `<style data-dsh-atv-css>` the way official DSH plugins do.

## Modifying the DSH host (and keeping the plugin compatible)

The plugin is a **guest inside the DSH Web runtime**, so a host change and a plugin change are two different operations. Default to the plugin side; touch the host only when the contract itself moves.

### Where the pieces live

| Location | What it is | How to treat it |
| --- | --- | --- |
| `~/.npm-global/lib/node_modules/@deepseek-ai/dsh/` | The installed host (`@deepseek-ai/dsh` `0.2.0-rc.2`), minified `lib/*.js` | **Read** it to learn the contract. Never hand-edit minified output |
| `~/.dsh/profiles/web/` | The `web` profile: `package.json`, `cordis.yml`, `cordis.patch.yml`, `node_modules` | The wiring surface for this plugin |
| `http://127.0.0.1:3080` | The one running GUI | Verify here after a rebuild. Never start a second server |

### The host contract this plugin depends on

| Host package | Provides | If it changes, do this in this repo |
| --- | --- | --- |
| `@deepseek-ai/dsh-client-ui-slots` | Slot registry: `slots.inject` / `register` / `entries` / `subscribe`, `resolveSlotLabel` | Re-check the `register({...})` options in `src/dsh-live-plugin.tsx` |
| `@deepseek-ai/dsh-client-ui-conversation` | Owns `conversation.view`: tabs from `slots.entries("conversation.view")`, then `renderSlot("conversation.view", { inspectCall, viewRequest, openView, completeViewRequest }, { only: viewId })`, refreshed by `slots.subscribe("conversation.view", refreshViews)` | Rename the slot key in `src/dsh-live-plugin.tsx` + `src/dsh-team-types.d.ts` |
| `@deepseek-ai/dsh-client-ui-chat` | `conversation.view` entry `id: "chat"`, `order: 0` | Keep our `order` above the host's |
| `@deepseek-ai/dsh-client-ui-trajectory` | `conversation.view` entry `id: "trajectory"`, `order: 10`; its tab is hidden unless `ctx.configForms.developerTools.enabled` | Same |
| `@deepseek-ai/dsh-experimental-agent-team` | Publishes the Lead Session `agentTeam` projection | Re-read `src/dsh-live-entry.tsx` status mapping against the new projection shape |
| `@deepseek-ai/dsh-experimental-client-ui-agent-team` | Official roster UI — injects `conversation.session.header.actions`, **not** `conversation.view` | No conflict; two views may coexist |
| `@deepseek-ai/dsh-client-modules` | The browser `ModuleLoader` / `ClientModuleRegistry` | Re-check the CJS bundle shape |
| `@deepseek-ai/dsh-app-boot` | Profile, bundle and patch composition | Re-check `dsh.profile.bundles` ordering |

List slots sort by **`priority` then `order`** (`(a.priority ?? 0) - (b.priority ?? 0) || (a.order ?? 0) - (b.order ?? 0)`); non-list slots sort by `priority` only. Our entry leaves `priority` unset (0) and sets `order: 20`, which puts the `Live Team` tab after `chat` (0) and `trajectory` (10). Host entries use `label: () => t("view.chat")` with `locale: NS`; `resolveSlotLabel` is `typeof label === "function" ? label() : label`, so our plain string `label: 'Live Team'` displays as written — switch to a thunk plus `locale` only if the view becomes translatable.

### Order of operations for a host change

1. **Prefer the patch surface, not the code.** Bundle layers are `cordis.patch.yml` files declared by `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`; the user layer is `~/.dsh/profiles/web/cordis.patch.yml`. Composition order (from `@deepseek-ai/dsh-app-boot`): each bundle's patch lists in `dsh.profile.bundles` order over an empty entry list → the profile's own patches → launcher layers (`--patch` files and flag-derived patches). A profile patch therefore always beats a bundle patch, and `--patch` beats both.
2. **Never edit `cordis.yml`.** It is generated; the file says `Edit cordis.patch.yml, not this file`.
3. **Rebuild the affected Web artifacts, then verify the existing URL** at `http://127.0.0.1:3080` after a page refresh. Client-plugin HMR reloads without a refresh **only** while `pnpm run dev:web` is running from the same checkout. The `apps/web` Vite entry is not a standalone app — `dsh web` injects `window.__DSH_BOOT__`; starting another server does not update this GUI.
4. **Restart the DSH Web process** when the `dsh.client` manifest changes (package metadata, including the negative "not a client package" verdict, is cached per Loader specifier until restart), when a bundle is added to `dsh.profile.bundles`, or when the profile's `node_modules` link changes.
5. **Never start a replacement server** and never serve this plugin as a second app — it targets the host's client ModuleLoader.

### Wiring the plugin into a profile

- `~/.dsh/profiles/web/package.json` must list `@local/agent-team-visualizer` in `dsh.profile.bundles`, and carry the `link:` dependency `"/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/dist-dsh/agent-team-visualizer"`; that link protocol creates `node_modules/@local/agent-team-visualizer -> …/dist-dsh/agent-team-visualizer`.
- Module resolution is two-anchor: a bundle name resolves first from the DSH installation (the launcher's own package), then from the profile directory; pnpm-managed entries in the profile's `node_modules` resolve first.
- `dsh plugin --profile web <pnpm args>` forwards to pnpm inside the profile directory (`dsh plugin --profile web add <package>`); `dsh web` is shorthand for `dsh --profile web`; `--patch a.yml --patch b.yml` is repeatable and non-variadic; `dsh --dump-config` / `--dump-default-config` / `--dump-config-schema` take no app args; `dsh rescue --from-default-profile web` builds a rescue profile from the shipped template.

### Manifest rules the host enforces

| Field | Rule (from `dsh-client-modules` / `dsh-app-boot`) |
| --- | --- |
| `dsh.client.platform` | must be a string **and** equal `"web"`, otherwise the package is not a client module |
| `exports["./client"]` | must be a string, or an object with a string `default`; missing → `client bundle not found; run \`pnpm run build\` before launch` |
| `dsh.client.inject` / `dsh.client.external` | must be string arrays |
| `dsh.client.immediately` | must be a boolean |
| `dsh.bundle.patch` | must be one file path or a list of file paths, resolved package-relative and applied in order |

### ModuleLoader semantics (why the bundle is shaped the way it is)

- `window.__ModuleLoader__.load({ id, factory })` only **registers** the factory. The body — including the CSS injection — runs at materialization `factory(require)` → exports, memoized in `ClientModuleLoader.loadCache`. A top-level side effect in the bundle does nothing until the host materializes the module, which is why CSS is injected inside the factory as `<style data-dsh-atv-css>`.
- `ClientModuleRegistry.rebuilt(id)` — the HMR watch's registration hook — is the **only** entry point through which build changes reach the graph; it compares mtime, ctime and size, so an unchanged artifact is not re-read.
- The host serves **React 18**; `react`, `react/jsx-runtime`, `react-dom`, `react-dom/client` and the `@deepseek-ai/dsh-client-*` UI packages stay `external` and are `require()`d from the host.

### Reading a boot failure

| Symptom | Cause |
| --- | --- |
| `<id>: failed` in the web boot audit | The entry's fiber was disposed — usually `inject` is not an array, so `apply()` runs with an empty `ctx` |
| `client-modules: <pkg> client bundle not found; run \`pnpm run build\` before launch` | `exports["./client"]` target missing from the linked directory |
| `client-modules: <pkg> dsh.client.platform must be a string` | Manifest typo in the `dsh.client` block |
| `client bundles not found` grouped at startup | The linked `dist-dsh/` package was not built before launch |

Startup failure prints `WARNING: Raw diagnostics may contain configuration or credential values from plugin errors.` — scrub raw diagnostics before pasting them anywhere public.

### Do not

- Do not hand-edit minified host `lib/*.js`, and do not patch `~/.dsh/.credentials.yaml`.
- Do not hand-edit `~/.dsh/profiles/web/cordis.yml`.
- Do not bump React past major **18**.
- Do not run a second DSH/GUI server or serve the plugin standalone.

## Controls (Live Team header)

| Control | Behaviour |
| --- | --- |
| Pause / Resume motion | `aria-pressed` toggle; freezes ambient expression and wander |
| Zoom in / out | `nextDistance = clamp(current * (in ? 0.82 : 1.22), 7, 22)` |
| Overview | Reset camera to the full-team framing |
| Focus workstation | Frame the selected member's **desk**, not the walking avatar |

Exactly one `<OrbitControls>` instance exists (`makeDefault enableRotate enableZoom enablePan minDistance 7 maxDistance 22`). Camera requests animate over 0.35s with a smoothstep ease from a `clone()`-ed start snapshot; a user interaction (`onStart`) or zoom click cancels the transition so manual orbit never fights the animation. `prefers-reduced-motion` defaults to paused, and non-wandering members snap to their chair **before** the pause guard runs.

## Verify after every change

```sh
pnpm run build:dsh    # tsc -b && vite build && node scripts/build-dsh-plugin.mjs
pnpm run lint         # oxlint
git diff --check      # must be clean
```

There is **no test runner in this repo** — do not report test results that were not run. Warnings that are expected and non-blocking: `only-export-components` on `src/dsh-live-plugin.tsx`, chunk size above 500 kB, and `lucide-react` "use client" notices for `context.mjs` / `Icon.mjs`.

Performance discipline in `useFrame`: scalar math only, no per-frame object or helper allocation, and the Memoji writes `textContent` only when its phase changes (`lastExpressionPhase` ref).

## Requirements

Node.js 20.19+ or 22.12+ (Vite 8), TypeScript `~6.0.2`, `oxlint ^1.81.0`. React and React DOM must stay on major **18** to match the DSH host.

## Out of scope

- Event-level activity feed for the live view (not published by the Agent Team projection)
- Authentication, persistence, invitations, or task mutations
- Unity / game integration

## Branches

`main`, `feature/3d-office-scene`, `feature/agent-office-movement`, `feature/agent-visualizer-improvements` (current). Open a PR from the current branch at:
<https://github.com/Tiennguyen25081996/Agent-Team-Visualizer/pull/new/feature/agent-visualizer-improvements>

---

## 🌊 **LUỒNG CHỌP VÀ HOẠT ĐỘNG LIVE TEAM PLUGIN**

### 📖 **Biểu đồ trực quan về luồng:**

Hãy mở **[LiveTeam-Diagram.html](file:///Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html)** trong trình duyệt để xem biểu đồ tương tác!

**Vị trí file:** `/Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html`

---

### 🎯 **CẤU TRÚC PLUGIN:**

```
┌───────────────────────────────────────────────────┐
│  LAYER 1: DSX WEB HOST (conversation.view slot) ─ │
│    ├─ Chat View (order: 0)                        │
│    ├─ Trajectory View (order: 10)                 │
│    └─ Live Team View (order: 20) ⭐ ← PLUGIN!   │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  LAYER 2: cordis.patch.yml (plugin entry point) ─ │
│    └─ insert: id → name → label                  │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  LAYER 3: src/dsh-live-plugin.tsx                 │
│    ├─ inject(['slots'])                           │
│    └─ apply(ctx) → register LiveTeamView         │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  LAYER 4: src/dsh-live-entry.tsx                  │
│    ├─ Read data từ host props                     │
│    ├─ Map status (failed→Done, provisioning→Idle) │
│    └─ Render 3D scene với LiveDesk                │
└───────────────────────────────────────────────────┘
              ↓
┌───────────────────────────────────────────────────┐
│  LAYER 5: OfficeCameraController (camera controls) │
└───────────────────────────────────────────────────┘
```

---

### 📋 **TÀI LIỆU HƯỚNG DẪN:**

Để giúp các thành viên nắm bắt nhanh:

#### **📖 File Biểu Đồ Tương Tác:**
- **Path:** `/Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html`
- **Thao tác:** Mở bằng Chrome/Safari để xem flow trực quan
- **Nội dung:** Luồng gọi, mapping status, plugin entry point

#### **📄 Code Files Đã Index (Codebase Memory):**
Các file source quan trọng đã được index trong codebase-memory:
1. `cordis.patch.yml` - Plugin cài đặt
2. `package.json` - Manifest settings  
3. `src/dsh-live-plugin.tsx` - Plugin registration
4. `src/dsh-live-entry.tsx` - Main view component
5. `src/OfficeScene.tsx` - 3D scene rendering

#### **🔧 Cài đặt Plugin vào Profile Web:**

Để install plugin Live Team vào DSH profile web:

```bash
# 1. Add vào package.json của profile web
cat ~/.dsh/profiles/web/package.json | grep agent-team-visualizer

# 2. Bundle output đã build:
```bash
# Từ thư mục project root:
npm run build:dsh
ls dist-dsh/agent-team-visualizer/

# Copy vào profile web (hoặc add symlink):
# ~/.dsh/profiles/web/package.json dependency path: "./dist-dsh/agent-team-visualizer"
```

# 3. Add vào bundle list và restart DSH Web để plugin inject otomatis
```

#### **🎬 Build và Deploy:**

```bash
# Từ thư mục root của project:
npm run build:dsh      # Tạo output vào dist-dsh/agent-team-visualizer/
pnpm run lint          # Chất lượng code (oxlint)
git diff -- check   # Không commit nếu có lỗi
```

#### **👀 Kiểm tra Plugin đã hoạt động:**

1. Mở `<http://127.0.0.1:3080>` trong trình duyệt
2. Tìm tab **Live Team** sau tab Chat và Trajectory View (order: 20)
3. Xem các agent chạy trong workspace 3D

---

### ✅ **KHÁC BIỆT PLUGIN VÀ DEMO:**

| Aspect | **Live Team Plugin** 🎯 | Standalone Demo |
|--------|-------------------------|------------------|
| Data Source | Agent team projection từ host | Hardcoded demo data |
| Status Map | Runtime real-status (failed→Done, etc) | Static illustration |
| Motion | Real-time camera controls | Animation demo only |
| Mục đích | Production runtime | Demo/prototype test |

---

### 🚀 **Các bước tiếp theo:**

1. ✅ Xem biểu đồ tại `/Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html`
2. ✅ Read `cordis.patch.yml` để hiểu plugin entry point
3. ✅ Kiểm tra bundle trong `dist-dsh/agent-team-visualizer/`
4. ✅ Install vào profile web và restart DSH Web

**Chúc bạn làm việc hiệu quả!** 🎉
