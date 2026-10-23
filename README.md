# OpenCode Model Badge

A small **OpenCode V2 terminal plugin** that makes your selected model easy to
recognize at a glance. Shows a colored marker, an icon, the model's real display
name, and its selected reasoning variant (when set).

The badge appears **above the session input** and in the **home-screen footer**.
It updates immediately when you switch models, without sending a message.
Your existing theme stays unchanged.

| Default model | Icon | Color |
| --- | --- | --- |
| DeepSeek (any `deepseek-*` model ID) | 🐋 | Blue `#60A5FA` |
| GPT-6 Luna (`gpt-6-luna`) | ☾ | White `#F1F5F9` |
| GPT-6.1 Sol (`gpt-6.1-sol`) | ☀️ | Yellow `#FACC15` |
| Other models | ◇ | Gray `#94A3B8` |

Any number of other models, colors, and icons can be configured. Model names
always come from OpenCode's catalog; the plugin never renames models.

## Install

Tested with **OpenCode v2.0.32** (full-screen TUI). Not intended for OpenCode V1,
Mini, or the web/desktop UI. No npm install or build step is needed: OpenCode
loads the source and supplies its plugin runtime.

1. Clone the repository somewhere permanent:

   ```sh
   git clone https://github.com/atilla777/opencode-model-badge.git "$HOME/opencode-model-badge"
   ```

2. Edit `~/.config/opencode/cli.json` (or
   `$XDG_CONFIG_HOME/opencode/cli.json` if set). **Merge** the following into your
   existing settings, preserving other plugins and keybindings. Replace the path
   with the **absolute path** to your clone:

   ```json
   {
     "$schema": "https://opencode.ai/v2/cli.json",
     "plugins": ["/absolute/path/to/opencode-model-badge"],
     "keybinds": {
       "model.cycle_favorite": "f3",
       "model.cycle_favorite_reverse": "shift+f3"
     }
   }
   ```

3. Reopen OpenCode if the badge has not appeared.

Do not put these terminal settings in `opencode.json`. The plugin runs locally,
including when your TUI connects to a remote OpenCode server.

## Favorite-model shortcuts

The configuration above enables OpenCode's **built-in** favorite-model cycling:

- **F3** — next favorite model.
- **Shift+F3** — previous favorite model.

Open the model picker with **Ctrl+X, M** (default binding), select a model, then
press **Ctrl+F** to toggle its favorite status. Add as many favorites as you want.
These are OpenCode's favorites, not a second list maintained by this plugin.
The plugin does not change favorites or override your shortcuts itself; the
snippet enables the native commands. You may choose different keys or omit them.

Your terminal must forward these keys to OpenCode. If Shift+F3 is intercepted by
the terminal or desktop, change that binding in `cli.json`.

## Customize colors and icons (optional)

Replace the plugin string with an object containing `options.models`:

```json
{
  "plugins": [
    {
      "package": "/absolute/path/to/opencode-model-badge",
      "options": {
        "models": {
          "gpt-6-luna": { "color": "#FFFFFF", "icon": "☾" },
          "deepseek-v4-pro": { "color": "#60A5FA", "icon": "🐋" },
          "some-other-model-id": { "color": "#A78BFA", "icon": "◆" },
          "openai/gpt-6.1-sol": { "color": "#FACC15", "icon": "☀" }
        }
      }
    }
  ]
}
```

- Keys are **exact model IDs**, or `providerID/modelID` for provider-specific
  styling. Find IDs with `opencode models`. Custom wildcard patterns are not supported.
- Add as many entries as you need; styling is independent of favorite status.
- Both `color` and `icon` are optional. Unspecified values keep the default style.
- Provider-specific values override shared model-ID values, then built-in defaults.
- Colors must use six-digit `#RRGGBB` notation. Set `"icon": ""` to hide an icon.
- Use text symbols such as `☾`, `☀`, or `◆` if you want the icon to inherit the
  badge color. Emoji such as 🐋 have their own colors; rendering depends on your
  terminal and font. No Nerd Font is required.
- Restart the TUI after changing plugin options if they have not reloaded.

## Update / uninstall

To update, run `git pull --ff-only` inside your clone, then reopen OpenCode.
To uninstall, remove this plugin's entry from `cli.json`. Remove the two optional
keybindings too if you no longer want favorite cycling on F3 / Shift+F3.

## Development

With Node.js 18+ installed:

```sh
npm test
```

Tests cover defaults, custom styles, provider precedence, real catalog names,
missing catalog data, and option validation. They require no dependencies and
make no model requests. The plugin adds no telemetry, network calls, or server hooks.

## References

- [OpenCode CLI plugins](https://opencode.ai/v2/docs/build/plugins/cli)
- [CLI settings](https://opencode.ai/v2/docs/cli/config)
- [Keybindings](https://opencode.ai/v2/docs/cli/keybinds)

## License

[MIT](LICENSE)
