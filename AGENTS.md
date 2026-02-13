# llm-helper — Browser Extension

A Chrome/Edge browser extension for capturing and managing URLs from web pages.

## Architecture

This is a **Manifest V3** browser extension with the following components:

| File | Role |
|------|------|
| `manifest.json` | Extension configuration, permissions, content script declaration |
| `popup.html/css/js` | Popup UI — menu with URL list management, capture button, picker toggle |
| `content.js` | Content script — injected on all http/https pages, intercepts clicks when picker is enabled |
| `background.js` | Service worker — broadcasts picker state changes, handles URL storage |
| `icons/` | Extension toolbar icons (16/48/128px PNGs) |
| `test-helper.js` | Playwright-based test harness for manual verification |

## Key Design Decisions

- **Global picker state** is stored in `chrome.storage.local.pickerEnabled` (not in-memory variables) to survive service worker restarts.
- **Content script auto-injects** via manifest `content_scripts` declaration and **self-activates** by reading storage on load — no dependency on service worker being awake.
- **Message passing** (`activate-picker` / `deactivate-picker`) is used only for real-time toggling of tabs that already have the content script loaded.
- **URL deduplication**: both the popup capture button and the link picker check for duplicates before adding.

## State Flow

```
popup.js (toggle) → chrome.storage.local { pickerEnabled }
                          ↓                    ↓
              background.js (broadcast)    content.js (self-activate on load)
              sends activate/deactivate    reads storage → activate()
              to all existing tabs
```

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
node test-helper.js  # Launches browser with extension loaded
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
