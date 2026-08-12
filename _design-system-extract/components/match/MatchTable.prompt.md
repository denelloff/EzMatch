Match list used on the home, archive and admin control-room screens. Carries its own "Display scores" / "Live refresh" toolbar.

```jsx
<MatchTable rows={[{ id:'1', shortId:'a41f', team1Name:'NAVI', team2Name:'FaZe', team1Score:12, team2Score:9, map:'de_mirage', serverName:'fra-01', instanceName:'main', state:'LIVE' }]} />
```

Scores are zero-padded to two digits and set in the display face with tabular numerals; the leading team is the only white name in the row.
