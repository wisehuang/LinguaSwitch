document.addEventListener('DOMContentLoaded', function() {
  const NO_API_KEY_MESSAGE = 'Please set your OpenAI API key in the settings first.';
  const DETECTED_PREFIX = 'Detected language: ';
  const POPUP_STATE_KEYS = ['popupInput', 'popupOutput', 'popupError', 'popupDetectedLanguage'];

  const inputText = document.getElementById('inputText');
  const translateBtn = document.getElementById('translateBtn');
  const outputText = document.getElementById('outputText');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const openOptionsBtn = document.getElementById('openOptions');
  const copyBtn = document.getElementById('copyBtn');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const detectedLanguage = document.getElementById('detectedLanguage');
  const clearBtn = document.getElementById('clearBtn');

  const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
  let hasApiKey = false;

  function setLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
    translateBtn.disabled = isLoading || !hasApiKey;
  }

  // Ends the loading state and shows text; only real translations are copyable.
  function showResult(text, isTranslation) {
    setLoading(false);
    outputText.textContent = text;
    copyBtn.classList.toggle('visible', isTranslation && text.trim() !== '');
  }

  function setDetectedLanguage(name) {
    detectedLanguage.textContent = DETECTED_PREFIX + name;
  }

  // Load saved state; the translation itself runs in background.js
  chrome.storage.local.get(['apiKey', 'targetLanguage', ...POPUP_STATE_KEYS], function(result) {
    hasApiKey = Boolean(result.apiKey);
    inputText.value = result.popupInput || '';

    if (result.popupError) {
      showResult(`Error: ${result.popupError}`, false);
    } else if (result.popupOutput) {
      showResult(result.popupOutput, true);
    } else if (!hasApiKey) {
      showResult(NO_API_KEY_MESSAGE, false);
    } else {
      setLoading(false);
    }

    if (result.popupDetectedLanguage) {
      setDetectedLanguage(result.popupDetectedLanguage);
    }

    // Load saved target language (default to Traditional Chinese)
    if (result.targetLanguage) {
      targetLanguageSelect.value = result.targetLanguage;
    }

    // A translation started before the popup was closed may still be running
    chrome.runtime.sendMessage({ type: 'getStatus' })
      .then(status => {
        if (status && status.translating) {
          setLoading(true);
        }
      })
      .catch(() => {});

    // Text sent from the right-click context menu (see background.js)
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.session.get('pendingSelection', function(session) {
      const pending = session.pendingSelection;
      if (!pending) return;
      chrome.storage.session.remove('pendingSelection');
      inputText.value = pending;
      chrome.storage.local.set({ popupInput: pending });
      startTranslation(); // replaces any translation still in flight
    });
  });

  // Results arrive through storage, written by background.js
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area !== 'local') return;
    if (changes.popupOutput && changes.popupOutput.newValue !== undefined) {
      showResult(changes.popupOutput.newValue, true);
    }
    if (changes.popupError && changes.popupError.newValue !== undefined) {
      showResult(`Error: ${changes.popupError.newValue}`, false);
    }
  });

  // Save target language preference when changed
  targetLanguageSelect.addEventListener('change', function() {
    chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value });
  });

  inputText.addEventListener('input', function() {
    chrome.storage.local.set({ popupInput: inputText.value });
  });

  // Ctrl+Enter / Cmd+Enter translates
  inputText.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      translateBtn.click(); // no-op while disabled
    }
  });

  // Open options page
  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Copy text to clipboard
  copyBtn.addEventListener('click', function() {
    const textToCopy = outputText.textContent;

    if (!textToCopy || textToCopy.trim() === '') {
      return;
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Visual feedback that text was copied
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';

        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  });

  clearBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ type: 'cancel' }).catch(() => {});
    chrome.storage.local.remove(POPUP_STATE_KEYS);
    inputText.value = '';
    setDetectedLanguage('');
    showResult('', false);
  });

  translateBtn.addEventListener('click', startTranslation);

  function startTranslation() {
    const text = inputText.value.trim();

    if (!text) {
      showResult('Please enter some text to translate.', false);
      setDetectedLanguage('');
      return;
    }

    outputText.textContent = '';
    copyBtn.classList.remove('visible');
    setLoading(true);
    detectLanguage(text);

    // The result comes back through chrome.storage.onChanged; a rejection here
    // means the service worker could not be reached at all.
    chrome.runtime.sendMessage({
      type: 'translate',
      text: text,
      targetLanguage: targetLanguageSelect.value
    }).catch(error => {
      showResult(`Error: ${error.message}`, false);
    });
  }

  // Display-only, on-device detection (no API call); never blocks translation
  async function detectLanguage(text) {
    let name = 'Unknown';
    try {
      const result = await chrome.i18n.detectLanguage(text);
      const top = result.languages.reduce(
        (best, candidate) => (!best || candidate.percentage > best.percentage ? candidate : best),
        null
      );
      if (top && top.language !== 'und') {
        name = languageNames.of(top.language) || top.language;
      }
    } catch (error) {
      console.warn('Language detection failed:', error);
    }
    setDetectedLanguage(name);
    chrome.storage.local.set({ popupDetectedLanguage: name });
  }
});
