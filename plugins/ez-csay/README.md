# eZ-Match CSay

CounterStrikeSharp plugin by **denello** that brands server console chat as **`[EZ-MATCH]`** and supports `{green}` / `{yellow}` color tags (same idea as ColorSay).

## Commands

| Command | Who | Effect |
|---------|-----|--------|
| `say "…"` from **server console** | hub / panel | Rewritten to colored `[EZ-MATCH] …` |
| `ezsay` / `csay` / `colorsay` | server only | Same, explicit |

Player `say` is untouched.

## Install

Via the panel plugin catalog (**eZ-Match CSay**, requires CounterStrikeSharp), or copy `EzCSay.dll` to:

`game/csgo/addons/counterstrikesharp/plugins/EzCSay/EzCSay.dll`

Verify with **`css_plugins list`** (not `meta list` — that only shows Metamod plugins like Fake RCON / CounterStrikeSharp).

## Build

```bash
dotnet publish -c Release -o ./publish
```

CI: `.github/workflows/publish-ez-csay.yml` publishes `ez-csay-v*` releases.
