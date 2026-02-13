<p align="center">
  <img src="icons/icon-128.png" alt="llm-helper logo" width="80" />
</p>

<h1 align="center">llm-helper</h1>

<p align="center">
  <strong>A sleek browser extension for capturing and managing URLs with a single click.</strong>
</p>

<p align="center">
  <a href="https://github.com/Kooooooma/llm-helper/stargazers"><img src="https://img.shields.io/github/stars/Kooooooma/llm-helper?style=flat-square&color=6366f1" alt="Stars" /></a>
  <a href="https://github.com/Kooooooma/llm-helper/releases/latest"><img src="https://img.shields.io/github/v/release/Kooooooma/llm-helper?style=flat-square&color=22c55e" alt="Release" /></a>
  <a href="https://github.com/Kooooooma/llm-helper/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Kooooooma/llm-helper?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/manifest-v3-blueviolet?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/chrome-%3E%3D88-green?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome 88+" />
  <img src="https://img.shields.io/badge/edge-%3E%3D88-blue?style=flat-square&logo=microsoftedge&logoColor=white" alt="Edge 88+" />
</p>

---

## ✨ Features

- 🔗 **Link Picker** — Enable globally across all tabs. Single-click any link to capture its URL; double-click to navigate normally.
- ⊕ **Capture Page URL** — One click to save the current page's address bar URL.
- 📋 **Copy All** — Copy all collected URLs to clipboard, one per line.
- ✏️ **Edit & Manage** — Inline editing, per-URL copy, delete, and bulk clear.
- 🌐 **Cross-Tab** — Picker state persists across page refreshes, new tabs, and tab switches.
- 🎨 **Modern Dark UI** — Glassmorphism design with smooth micro-animations.

## 🚀 Getting Started

### Install from Release (Recommended)

1. Go to the [Releases](https://github.com/Kooooooma/llm-helper/releases/latest) page.
2. Download `llm-helper-vX.Y.Z.zip` from the latest release.
3. Unzip the file.
4. Open `chrome://extensions` or `edge://extensions`, enable **Developer Mode**.
5. Click **Load Unpacked** and select the unzipped folder.
6. Pin the extension icon in your toolbar.

### Install from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/Kooooooma/llm-helper.git
   ```

2. Open `chrome://extensions` or `edge://extensions`, enable **Developer Mode**.

3. Click **Load Unpacked** and select the cloned `llm-helper` directory.

4. Pin the extension icon in your toolbar for easy access.

### Usage

| Action | How |
|--------|-----|
| Capture current page URL | Click **⊕** button in popup |
| Enable Link Picker | Toggle the **Link Picker** switch |
| Capture a link | Single-click any link on the page |
| Navigate normally | Double-click the link |
| Copy all URLs | Click **📋** in popup |
| Edit/manage URLs | Click **✏️** to open the editor |
| Clear all URLs | Click **🗑** in popup or "Clear All" in editor |

## 🏗️ Architecture

```
llm-helper/
├── manifest.json              # Extension config (Manifest V3, ES modules)
├── popup.html                 # Popup shell — loads shared + feature CSS/JS
├── popup.js                   # Popup orchestrator (imports features)
├── background.js              # Service worker orchestrator (imports features)
├── shared/
│   └── base.css               # Design tokens, reset, common components
├── features/
│   └── url-collector/         # URL Collector feature
│       ├── popup.js            # Feature popup logic
│       ├── popup.css           # Feature-specific styles
│       ├── content.js          # Content script (link picker)
│       └── background.js       # Background logic (state broadcasting)
├── tests/
│   └── test-helper.js         # Playwright test harness
├── icons/                     # Toolbar icons (16/48/128px)
└── build.js                   # Build script → dist/*.zip
```

### State Management

The global picker state is stored in `chrome.storage.local`, making it resilient to service worker restarts. Content scripts self-activate on page load by reading storage — no dependency on the background worker being awake.

```
User toggles picker
       │
       ▼
chrome.storage.local { pickerEnabled: true }
       │
       ├──► background.js broadcasts activate to all tabs
       │
       └──► content.js reads storage on load → self-activates
```

## 🧪 Development

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- Chrome or Edge browser

### Running Tests

```bash
npm install          # Install Playwright (one-time)
npm test             # Run tests
```

### Building for Distribution

To create a distributable `.zip` file (for manual installation or store submission):

```bash
npm run build
```

The packaged extension will be created in the `dist/` directory, e.g., `dist/llm-helper-v1.0.0.zip`. This file can be shared with others. To install it manually, unzip it and load the folder as an unpacked extension.


## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#Kooooooma/llm-helper&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Kooooooma/llm-helper&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Kooooooma/llm-helper&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Kooooooma/llm-helper&type=Date" width="600" />
    </picture>
  </a>
</p>

## 📄 License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.

