Server event log on the instance page. Time and detail are monospace; the kind is a tone-coded Badge (combat = danger, connection = info, server = warn).

```jsx
<Card><CardHeader title="Events" /><EventFeed events={[{time:'21:04:11',kind:'player_death',category:'combat',detail:'b1t → rain weapon=ak47 hs=true'}]} /></Card>
```
