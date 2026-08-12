Metric cell. Put four of them in a `<dl>` grid inside a Card, divided by 1px rules — that is the statistics header used across the panel.

```jsx
<Card><dl style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',margin:0}}>
  <StatTile label="Matches" value={128} />
  <StatTile label="Rounds played" value={3104} />
</dl></Card>
```
