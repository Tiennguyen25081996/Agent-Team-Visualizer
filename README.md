# Agent Team Visualizer

A local-first web dashboard prototype for visualizing Agent Team activity. The current version uses illustrative mock data; it is not connected to a live DSH runtime.

## MVP scope

- Team member presence, role, current task, model, branch and progress
- Interactive 3D office with one desk/chair workstation per member; agents type while working/reviewing and walk around carrying a task card while delivering
- Demo controls to change member state, select a workstation, orbit and zoom the scene
- Activity feed with search and category filters
- Sprint task board and selected-member detail panel
- Responsive dark operations-console layout
- Demo interactions for selecting members, filtering activity and showing notices

## Out of scope for this prototype

- Live DSH/Agent Teams event ingestion (scene animation currently uses mock status data)
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
