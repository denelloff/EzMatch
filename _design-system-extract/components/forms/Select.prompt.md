Dropdown for maps, teams, servers and MR presets. Always give it a `placeholder` ("Select a team", "Select a server") rather than defaulting to the first option.

```jsx
<Select placeholder="Select a map" options={[{value:'de_mirage',label:'Mirage'},{value:'de_nuke',label:'Nuke'}]} />
```
