/**
 * Popup Orchestrator
 * Loads all feature modules. Add new features by importing their init() here.
 */

import { init as initUrlCollector } from './features/url-collector/popup.js';

document.addEventListener('DOMContentLoaded', () => {
    initUrlCollector();
    // Future features:
    // import { init as initFeatureName } from './features/feature-name/popup.js';
    // initFeatureName();
});
