240px fixed admin sidebar. Sections are titled in 10px uppercase eyebrows; the active item gets a surface fill plus a 2px orange left rule.

```jsx
<Sidebar activeHref="/admin/matches" sections={[
  { title: 'Match menu', items: [{ href: '/admin/matches', label: 'Matches in progress', count: 3 }] },
]} />
```

Section order in the real panel: Main menu, Match menu, Match management, Team management, Game servers, Statistics, Settings.
