/**
 * URL Collector — Background Feature Module
 * Handles storage-based tab broadcasting and URL capture from content scripts.
 */

/**
 * Returns true if the URL is injectable (http/https only).
 */
function isInjectableUrl(url) {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

// ── Listen for picker state changes in storage ─────────
// When popup toggles picker, broadcast to ALL tabs
chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.pickerEnabled) {
        const enabled = changes.pickerEnabled.newValue || false;
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (!isInjectableUrl(tab.url)) continue;
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: enabled ? 'activate-picker' : 'deactivate-picker'
                });
            } catch {
                // Content script may not be ready yet — it will self-activate from storage
            }
        }
    }
});

// ── Handle URL captured from content script ─────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'url-captured') {
        handleUrlCaptured(message, sender, sendResponse);
        return true;
    }
    return false;
});

/**
 * Stores a captured URL in chrome.storage.local.
 * Avoids duplicates.
 */
async function handleUrlCaptured(message, sender, sendResponse) {
    const { url } = message;

    try {
        const result = await chrome.storage.local.get({ urls: [] });
        const urls = result.urls;

        if (!urls.includes(url)) {
            urls.push(url);
            await chrome.storage.local.set({ urls });
        }

        sendResponse({ success: true, count: urls.length });
    } catch (error) {
        console.error('Failed to save URL:', error);
        sendResponse({ success: false, error: error.message });
    }
}
