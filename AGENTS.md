# llm-helper — Browser Extension

A Chrome/Edge browser extension for capturing and managing URLs from web pages.

## Architecture

This is a **Manifest V3** browser extension with the following components:

The project uses a **modular feature-based** architecture. Root files are thin orchestrators; each feature lives in `features/<name>/`.

| Path | Role |
|------|------|
| `manifest.json` | Extension configuration, permissions, ES module service worker |
| `popup.html` | Popup shell — loads `shared/base.css` + feature CSS/JS |
| `popup.js` | Popup orchestrator — imports feature `init()` functions |
| `background.js` | Service worker orchestrator — imports feature background modules |
| `shared/base.css` | Shared design tokens, reset, common component styles |
| `features/url-collector/popup.js` | URL Collector popup logic (export `init()`) |
| `features/url-collector/popup.css` | URL Collector feature styles (modal, URL items) |
| `features/url-collector/content.js` | Content script — link picker (self-contained IIFE, no ES modules) |
| `features/url-collector/background.js` | Background logic — picker broadcasting, URL storage |
| `tests/test-helper.js` | Playwright-based test harness |
| `icons/` | Extension toolbar icons (16/48/128px PNGs) |

## Key Design Decisions

- **Global picker state** is stored in `chrome.storage.local.pickerEnabled` (not in-memory variables) to survive service worker restarts.
- **Content script auto-injects** via manifest `content_scripts` declaration and **self-activates** by reading storage on load — no dependency on service worker being awake.
- **Message passing** (`activate-picker` / `deactivate-picker`) is used only for real-time toggling of tabs that already have the content script loaded.
- **URL deduplication**: both the popup capture button and the link picker check for duplicates before adding.

## State Flow

```
popup.js → features/url-collector/popup.js (toggle)
    → chrome.storage.local { pickerEnabled }
           ↓                              ↓
  features/url-collector/background.js    features/url-collector/content.js
  (broadcast to all tabs)                 (self-activate on load from storage)
```

### Adding a New Feature

1. Create `features/<name>/` with `popup.js` (export `init()`), `popup.css`, etc.
2. Add `<link>` in `popup.html` for the feature CSS.
3. Add `import { init } from './features/<name>/popup.js'` in root `popup.js`.
4. If content script needed, add to `manifest.json` `content_scripts` array.
5. If background logic needed, add `import` in root `background.js`.

## Development

### Prerequisites
- Node.js (for running tests)
- Chrome or Edge browser

### Loading the Extension
1. Open `edge://extensions` or `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project root directory

### Running Tests
```bash
npm install        # Install Playwright (one-time)
npm test           # Launches browser with extension loaded
```

### Building
```bash
npm run build        # Generates dist/llm-helper-vX.Y.Z.zip
```

## Permissions

| Permission | Purpose |
|-----------|---------|
| `activeTab` | Access to the currently active tab |
| `tabs` | Query all tabs for global picker broadcasting |
| `storage` | Persist URLs and picker state |
| `scripting` | Programmatic script injection (fallback) |
| `host_permissions: <all_urls>` | Content script injection on all sites |
