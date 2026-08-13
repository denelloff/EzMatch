56px sticky header for the player-facing side of the panel (matches, archive, statistics).

```jsx
<TopNav activeHref="/" user="denelloff" role="OWNER"
  items={[{ href: '/', label: 'Matches in progress', count: 2 }, { href: '/matches', label: 'Archived matches' }]}
  right={<Button variant="secondary" size="sm">Admin panel</Button>} />
```

The active tab is marked by a 2px orange underline plus a surface fill — not by color alone.
