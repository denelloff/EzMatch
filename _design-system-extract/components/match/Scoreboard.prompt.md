The hero of the match page. Side colours are fixed by the game — CT is `--side-ct` blue, T is `--side-t` gold — and must never be swapped for brand colour.

```jsx
<Scoreboard map="de_mirage" state="LIVE" maxRounds={24} team1Side="CT" roundsPlayed={21}
  team1={{ name:'NAVI', score:12, players:[{name:'b1t',kills:19,assists:4,deaths:14,damage:1740}] }}
  team2={{ name:'FaZe', score:9, players:[] }} />
```

ADR is derived (damage / roundsPlayed), never passed in.
