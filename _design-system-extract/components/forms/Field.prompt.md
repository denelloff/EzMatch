Wraps a single form control with its label and hint. Hints carry the CS2 domain knowledge and are worth writing.

```jsx
<Field label="Max rounds" hint="MR12 = 24 total rounds (12 per half).">
  <Select options={[{value:'24',label:'MR12'},{value:'16',label:'MR8'}]} />
</Field>
```
