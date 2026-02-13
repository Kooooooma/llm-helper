/**
 * URL Collector — Popup Feature Module
 * Handles URL capture, picker toggle, copy, and edit modal.
 */

// ── DOM References ─────────────────────────────
const btnCapturePage = document.getElementById('btn-capture-page');
const btnClear = document.getElementById('btn-clear');
const btnCopy = document.getElementById('btn-copy');
const btnEdit = document.getElementById('btn-edit');
const togglePicker = document.getElementById('toggle-picker');
const urlCount = document.getElementById('url-count');
const editModal = document.getElementById('edit-modal');
const urlList = document.getElementById('url-list');
const emptyState = document.getElementById('empty-state');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnClearAll = document.getElementById('btn-clear-all');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// ── Initialization ─────────────────────────────
export async function init() {
    await loadPickerState();
    await updateUrlCount();
    bindEvents();
}

/**
 * Loads the current picker state from storage and syncs toggle.
 */
async function loadPickerState() {
    const result = await chrome.storage.local.get({ pickerEnabled: false });
    togglePicker.checked = result.pickerEnabled;
}

/**
 * Reads URL count from storage and updates badge.
 */
async function updateUrlCount() {
    const result = await chrome.storage.local.get({ urls: [] });
    urlCount.textContent = result.urls.length;
}

/**
 * Binds all event listeners.
 */
function bindEvents() {
    btnCapturePage.addEventListener('click', handleCapturePage);
    btnClear.addEventListener('click', handleClear);
    togglePicker.addEventListener('change', handleToggle);
    btnCopy.addEventListener('click', handleCopy);
    btnEdit.addEventListener('click', handleOpenEdit);
    btnCloseModal.addEventListener('click', handleCloseEdit);
    btnClearAll.addEventListener('click', handleClearAll);
}

// ── Capture Current Page URL ───────────────────
async function handleCapturePage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
        showToast('Cannot capture this page');
        return;
    }

    const result = await chrome.storage.local.get({ urls: [] });
    const urls = result.urls;

    if (urls.includes(tab.url)) {
        showToast('URL already captured');
        return;
    }

    urls.push(tab.url);
    await chrome.storage.local.set({ urls });
    await updateUrlCount();
    showToast('Page URL captured');
}

// ── Clear All URLs (from menu) ─────────────────
async function handleClear() {
    await chrome.storage.local.set({ urls: [] });
    await updateUrlCount();
    showToast('All URLs cleared');
}

// ── Toggle Picker (global) ─────────────────────
async function handleToggle() {
    const enabled = togglePicker.checked;

    // Persist state — background broadcasts to other tabs, content scripts self-activate on load
    await chrome.storage.local.set({ pickerEnabled: enabled });

    // Send message to current tab immediately for instant feedback
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                type: enabled ? 'activate-picker' : 'deactivate-picker'
            });
        } catch {
            // Content script not ready — it will self-activate from storage
        }
    }

    showToast(enabled ? 'Picker enabled' : 'Picker disabled');
}

// ── Copy URLs ──────────────────────────────────
async function handleCopy() {
    const result = await chrome.storage.local.get({ urls: [] });
    const urls = result.urls;

    if (urls.length === 0) {
        showToast('No URLs to copy');
        return;
    }

    const text = urls.join('\n');

    try {
        await navigator.clipboard.writeText(text);
        showToast(`Copied ${urls.length} URL${urls.length > 1 ? 's' : ''}`);
    } catch {
        // Fallback for clipboard API failure
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`Copied ${urls.length} URL${urls.length > 1 ? 's' : ''}`);
    }
}

// ── Edit Modal ─────────────────────────────────
async function handleOpenEdit() {
    const result = await chrome.storage.local.get({ urls: [] });
    renderUrlList(result.urls);
    editModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function handleCloseEdit() {
    editModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    updateUrlCount();
}

/**
 * Renders the URL list inside the modal.
 */
function renderUrlList(urls) {
    urlList.innerHTML = '';

    if (urls.length === 0) {
        emptyState.classList.remove('hidden');
        urlList.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    urlList.classList.remove('hidden');

    urls.forEach((url, index) => {
        const item = createUrlItem(url, index);
        urlList.appendChild(item);
    });
}

/**
 * Creates a single URL item element.
 */
function createUrlItem(url, index) {
    const item = document.createElement('div');
    item.className = 'url-item';
    item.dataset.index = index;

    // Index number
    const indexEl = document.createElement('span');
    indexEl.className = 'url-item-index';
    indexEl.textContent = index + 1;

    // Editable input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'url-item-input';
    input.value = url;
    input.addEventListener('blur', () => handleUrlEdit(index, input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'url-item-copy';
    copyBtn.title = 'Copy';
    copyBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  `;
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
            setTimeout(() => {
                copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;
            }, 1000);
        } catch { /* ignore */ }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'url-item-delete';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `;
    deleteBtn.addEventListener('click', () => handleUrlDelete(index));

    item.appendChild(indexEl);
    item.appendChild(input);
    item.appendChild(copyBtn);
    item.appendChild(deleteBtn);

    return item;
}

/**
 * Handles editing a URL at a given index.
 */
async function handleUrlEdit(index, newUrl) {
    const result = await chrome.storage.local.get({ urls: [] });
    const urls = result.urls;

    // Remove if empty
    if (!newUrl.trim()) {
        urls.splice(index, 1);
    } else {
        urls[index] = newUrl.trim();
    }

    await chrome.storage.local.set({ urls });
    renderUrlList(urls);
}

/**
 * Handles deleting a URL at a given index.
 */
async function handleUrlDelete(index) {
    const result = await chrome.storage.local.get({ urls: [] });
    const urls = result.urls;
    urls.splice(index, 1);
    await chrome.storage.local.set({ urls });
    renderUrlList(urls);
    updateUrlCount();
}

/**
 * Clears all saved URLs.
 */
async function handleClearAll() {
    await chrome.storage.local.set({ urls: [] });
    renderUrlList([]);
    updateUrlCount();
    showToast('All URLs cleared');
}

// ── Toast ──────────────────────────────────────
let toastTimer = null;

function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);

    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    // Trigger reflow for animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.classList.add('hidden'), 250);
    }, 2000);
}
