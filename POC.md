# FloatBrowser POC

Prototype Chrome extension that showcases how we can replicate the core feel of floatbrowser.app: launch multiple distraction-free, floating browser workspaces for the tools the client uses every day.

## Scope & assumptions

- Focus on the "floating workspace" experience called out in the job description: spin up one or several apps inside frameless popup windows sized for multitasking.
- Provide opinionated defaults (Gmail, Notion, Linear, Slack, Figma, Calendar, Spotify) so the client can click around immediately without configuring anything.
- Allow custom apps, widths, and heights to prove we can support bespoke workflows floatbrowser users expect.
- Ship a compact UI that could live in the toolbar popup—fast clicks, minimal ceremony—optimised for a Sunday demo deadline.

## How it works

1. **Pinned apps** – curated quick-launch list persisted via `chrome.storage.sync`. Each app opens in a popup window with a tailored geometry (e.g., Gmail narrow, Figma wide).
2. **Workflows** – one-click macros that launch multiple popups in a cascading layout (e.g., Calendar + Notion + Linear for daily planning).
3. **Custom apps** – add any URL with custom dimensions. Entries can be removed or reset to defaults.
4. **Floating windows** – uses `chrome.windows.create` with `type: "popup"` to remove toolbars and keep the surface focused, simulating FloatBrowser's floating panes.

## Repository layout

```
poc-extension/
  manifest.json   # Chrome MV3 manifest
  popup.html      # Toolbar popup UI shell
  popup.css       # Styling (light + dark)
  popup.js        # Launch logic, workflows, storage
job-text.txt      # Original job brief
POC.md            # (this file) explainer + next steps
```

## Trying it locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `poc-extension` directory.
4. Pin the extension and open the popup to launch floating workspaces.

## Suggested next steps

1. **Capability parity** – inspect floatbrowser.app with the provided paid account and map gaps (e.g., account sync, analytics, collaboration).
2. **Window management polish** – add snapping, remember last positions, and optional "always on top" helpers via a native companion.
3. **Account-aware data** – persist presets per user (backend or Firebase) so workspaces follow the account instead of local storage.
4. **Tracking & instrumentation** – wire analytics to learn which workflows get traction ahead of the MVP build.
