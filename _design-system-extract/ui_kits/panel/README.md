# eZ-Match panel — UI kit

Click-through recreation of the eZ-Match control panel, rebuilt from
`EzMatch-panel-main/apps/panel/src` and restyled onto the **Ignite** direction.

Open `index.html`. Flow: **Sign in** (any password of 3+ chars) → Matches in
progress → **Show** on a row → match scoreboard with tabs → **Admin panel** →
sidebar routes (Home, Create a match, Statistics).

| File | Source screen |
| --- | --- |
| `LoginScreen.jsx` | `src/app/login/page.tsx` + `login-form.tsx` |
| `AppShell.jsx` | `src/app/(app)/layout.tsx` |
| `MatchesScreen.jsx` | `src/app/(app)/page.tsx`, `matches/page.tsx` |
| `MatchScreen.jsx` | `src/app/(app)/matches/[id]/*`, `scoreboard-view.tsx`, `event-feed.tsx` |
| `AdminShell.jsx` | `src/app/admin/layout.tsx`, `components/admin-sidebar.tsx` |
| `AdminHomeScreen.jsx` | `src/app/admin/page.tsx`, `components/task-progress.tsx` |
| `CreateMatchScreen.jsx` | `src/app/admin/matches/new/*` |
| `StatsScreen.jsx` | `src/app/(app)/stats/page.tsx` |
| `ServersScreen.jsx` | `src/app/admin/servers/page.tsx` (agents + CS2 instances) |
| `TeamsScreen.jsx` | `src/app/admin/teams/page.tsx` + `import-preset-button.tsx` |
| `UsersScreen.jsx` | `src/app/admin/users/page.tsx` |
| `SettingsScreen.jsx` | `src/app/admin/settings/*` (match defaults + map pool) |
| `ControlRoomScreen.jsx` | `src/app/admin/matches/[id]/(room)/*` — console, chat, backups, demos, connect line |
| `SeasonsScreen.jsx` | `src/app/admin/seasons/page.tsx` (deliberately blank) |

Tabs with no design in the source (Match statistics, Heatmap, Duels, …) are left
deliberately blank with a "Coming soon" badge, matching `components/coming-soon.tsx`.
