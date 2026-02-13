/**
 * URL Collector — Content Script (Link Picker)
 * Intercepts single clicks to capture URLs from <a> elements.
 * Allows double clicks to perform normal navigation.
 *
 * NOTE: Content scripts do NOT support ES modules.
 * This file is self-contained and loaded via manifest content_scripts.
 */

(function () {
    // Prevent multiple injections
    if (window.__urlCollectorInjected) {
        return;
    }
    window.__urlCollectorInjected = true;

    window.__urlCollectorActive = false;

    // Self-activate: check storage to see if picker should be enabled
    chrome.storage.local.get({ pickerEnabled: false }, (result) => {
        if (result.pickerEnabled) {
            activate();
        }
    });

    let clickTimer = null;
    const DOUBLE_CLICK_DELAY = 300; // ms

    /**
     * Finds the closest <a> ancestor (or self) with an href.
     */
    function findClosestLink(element) {
        let el = element;
        while (el && el !== document.body) {
            if (el.tagName === 'A' && el.href) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    /**
     * Shows a brief toast notification on the page.
     */
    function showCaptureToast(url) {
        // Remove existing toast if any
        const existing = document.getElementById('__url-collector-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = '__url-collector-toast';
        toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #fff;
      padding: 10px 18px;
      border-radius: 10px;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      z-index: 2147483647;
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.35);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 360px;
      word-break: break-all;
      pointer-events: none;
    `;

        // Checkmark SVG
        toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
      <span style="opacity:0.95">${truncateUrl(url)}</span>
    `;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Auto-remove after 2s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Truncates a URL for display purposes.
     */
    function truncateUrl(url) {
        if (url.length > 60) {
            return url.substring(0, 57) + '...';
        }
        return url;
    }

    /**
     * Click handler — intercepts single clicks on links.
     * Uses a timer to distinguish single from double clicks.
     */
    function handleClick(e) {
        if (!window.__urlCollectorActive) return;

        const link = findClosestLink(e.target);
        if (!link) return;

        // Prevent default navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        // If we're waiting for a potential double-click, this is the second click
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            // Double-click on link — navigate normally
            window.location.href = link.href;
            return;
        }

        // Start timer — if no second click arrives, capture the URL
        const capturedHref = link.href;
        clickTimer = setTimeout(() => {
            clickTimer = null;
            captureUrl(capturedHref);
        }, DOUBLE_CLICK_DELAY);
    }

    /**
     * Sends a captured URL to the background script and shows a toast.
     */
    function captureUrl(url) {
        chrome.runtime.sendMessage(
            { type: 'url-captured', url },
            (response) => {
                if (response && response.success) {
                    showCaptureToast(url);
                }
            }
        );
    }

    /**
     * Double-click handler — performs normal navigation.
     */
    function handleDblClick(e) {
        if (!window.__urlCollectorActive) return;

        const link = findClosestLink(e.target);
        if (!link) return;

        // Clear the capture timer if it's still pending
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }

        // Navigate to the link
        window.location.href = link.href;
    }

    /**
     * Activates the picker — attaches event listeners.
     */
    function activate() {
        window.__urlCollectorActive = true;
        document.addEventListener('click', handleClick, true);
        document.addEventListener('dblclick', handleDblClick, true);
        document.body.style.cursor = 'crosshair';
    }

    /**
     * Deactivates the picker — removes event listeners.
     */
    function deactivate() {
        window.__urlCollectorActive = false;
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('dblclick', handleDblClick, true);
        document.body.style.cursor = '';

        // Clean up any toast
        const toast = document.getElementById('__url-collector-toast');
        if (toast) toast.remove();

        // Clear timer
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'activate-picker') {
            activate();
        } else if (message.type === 'deactivate-picker') {
            deactivate();
        }
    });
})();
