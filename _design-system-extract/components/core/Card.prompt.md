Panel container. Card + CardHeader + CardBody is the standard grouping for every settings block, list and stat panel.

```jsx
<Card>
  <CardHeader title="Free servers" description="Running instances with no match attached." action={<Chip href="#">Add agent</Chip>} />
  <CardBody>…</CardBody>
</Card>
```

Use `inset` for console/scoreboard surfaces that must read as recessed. Never add a box-shadow.
