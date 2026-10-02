# Agent Team Visualizer

A local-first dashboard prototype with a live Agent Team view for DSH Web. Its standalone Overview view remains illustrative demo data; the DSH view reads the current `agentTeam` projection and runtime session running states.

## MVP scope

- Team member presence, role, current task, model, branch and progress
- Interactive 3D office with one desk/chair workstation per member; agents type while working/reviewing and walk around carrying a task card while delivering
- Demo controls to change member state, select a workstation, orbit and zoom the scene
- Activity feed with search and category filters
- Sprint task board and selected-member detail panel
- Responsive dark operations-console layout
- Demo interactions for selecting members, filtering activity and showing notices

## Live DSH Web integration

The `Live Team` conversation view is registered as a DSH client plugin. It reads the active Lead Session's `agentTeam` projection (roster and shared tasks) and DSH Session runtime running status. It does not invent an activity feed: the current projection API does not publish detailed per-tool/per-message team events. The view is exposed in DSH's conversation-view selector for the current Session.

Build the DSH installable bundle:

```sh
npm install
npm run build:dsh
```

Install `dist-dsh/agent-team-visualizer` into the DSH `web` profile (it lives outside `dist/` on purpose: the standalone `vite build` empties `dist/` and would otherwise wipe the symlinked package), then restart the existing DSH Web process. The local `dsh` install is linked at `~/.dsh/profiles/web/node_modules/@local/agent-team-visualizer`; rerun `npm run build:dsh` to update those symlinked artifacts before reloading DSH. Changes to the normal `apps/web` shell require rebuilding DSH itself; this plugin targets the host's client ModuleLoader and must not be served as a second app.

When opened in a Session without an Agent Team projection, the plugin shows an explicit empty state. The standalone Vite Overview remains a demo and must not be interpreted as live runtime data.

## Out of scope for this prototype

- Detailed event-level activity feed (not currently published by the Agent Team projection)
- Authentication, persistence, invitations or task mutations
- Unity/game integration

## Run locally

Requirements: Node.js 20.19+ or 22.12+ (Vite 8).

```sh
npm install
npm run dev
```

## Verify production build

```sh
npm run build
npm run preview
```

All displayed data is illustrative. Do not treat it as live operational state.
