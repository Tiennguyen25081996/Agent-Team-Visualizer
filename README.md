# Agent Team Visualizer

A local-first web dashboard prototype for visualizing Agent Team activity. The current version uses illustrative mock data; it is not connected to a live DSH runtime.

## MVP scope

- Team member presence, role, current task, model, branch and progress
- Activity feed with search and category filters
- Sprint task board and selected-member detail panel
- Responsive dark operations-console layout
- Demo interactions for selecting members, filtering activity and showing notices

## Out of scope for this prototype

- Live DSH/Agent Teams event ingestion
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
