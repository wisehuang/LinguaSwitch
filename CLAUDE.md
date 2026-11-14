# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguaSwitch is a Chrome extension (Manifest V3) that translates text using OpenAI chat models (default `gpt-5.6-luna`, configurable in settings).

**Translation Logic:**
- The user picks the target language in the popup (`zh-TW` default, `zh-CN`, `en`, `ja`, `ko`); the choice is saved
- Every translation request sends the system prompt plus a target-language instruction as the system message, and the raw input text as the user message
- Language detection is display-only and on-device (`chrome.i18n.detectLanguage`); it does not change the target language and never blocks translation

**Key Features:**
- Right-click context menu: select text on a page → "LinguaSwitch: Translate" → popup opens and auto-translates
- On-device language detection (display only, no API call)
- Configurable model and system prompt
- Popup input/output persisted across popup opens; Clear button resets them and cancels a running translation
- Translation runs in the service worker, so it finishes even if the popup closes
- Ctrl+Enter / Cmd+Enter translates
- Copy to clipboard

## Behavioral Guardrails
Unknowns are allowed: If not certain, respond with “Unknown/Not sure” and enumerate concrete evidence-gathering steps. Do not invent APIs, functions, error messages, third‑party capabilities, files, or directories.

Evidence-first: Before proposing solutions or writing code, quote sources verbatim with file paths and line ranges, API docs paragraphs, or command outputs. If no verifiable source exists, stop and mark as Unknown.

Minimal change policy: Only propose the smallest viable patch after evidence is collected and referenced.

## Insufficient Context Policy
When context is insufficient, first request the exact files, directories, or command runs needed to gather facts. Do not write code until that evidence is obtained.

Acceptable evidence sources: repository files with path/line ranges, lockfiles and manifests, official API docs excerpts, test or typechecker output, linter output, or sandbox run logs.

## Additional Instruction

Unless specifically requested, do not generate a new Markdown document for each answer.

## Architecture

### Core Flow
1. **Language Detection** (`detectLanguage()` in `popup.js`): `chrome.i18n.detectLanguage()` on-device; the top language code is turned into an English name with `Intl.DisplayNames` and shown in the popup footer. Failure shows "Unknown" and does not affect translation
2. **Translation** (`translate()` / `requestTranslation()` in `background.js`): the popup sends `{ type: 'translate', text, targetLanguage }` via `chrome.runtime.sendMessage`; the service worker calls OpenAI and writes `popupOutput` or `popupError` to `chrome.storage.local`
3. **Rendering** (`chrome.storage.onChanged` listener in `popup.js`): the popup renders results from storage, so a popup reopened mid-translation still gets the result. On open it sends `{ type: 'getStatus' }` to restore the loading state
4. **Settings Management** (`options.js`): Persists API key, model, and system prompt via `chrome.storage.local`
5. **Context Menu** (`background.js`): Service worker registers a `selection` context menu; on click it stores the text in `chrome.storage.session.pendingSelection` and calls `chrome.action.openPopup()` (Chrome 127+). If that fails, it sets a "1" badge so the user clicks the icon
6. **Pending Selection Pickup** (`popup.js`): On open, the popup clears the badge, reads and removes `pendingSelection`, fills the input, and calls `startTranslation()`

### Important Implementation Details

**Single API Call:** Each translation makes one OpenAI Chat Completions call (`/v1/chat/completions`) with `reasoning_effort: 'none'`. If the API answers HTTP 400 naming `reasoning_effort`, the call is retried once without it (for models that reject the parameter).

**One translation at a time:** `activeController` in `background.js` holds the `AbortController` of the request in flight. A new `translate` message or a `cancel` message (Clear button) aborts it, and a superseded result is never written to storage. The Translate button is disabled while a request runs.

**Message types (popup -> service worker):** `translate`, `cancel`, `getStatus`.

**Defaults:** `LINGUASWITCH_DEFAULTS` (`model`, `systemPrompt`) lives only in `defaults.js`, loaded by `background.js` via `importScripts` and by `options.html` via `<script>`.

**Service worker lifetime:** While the popup is open, the pending `sendMessage` response keeps the worker alive. After the popup closes, Chrome may stop an idle worker after about 30 seconds, so a very slow request can be lost.

**Storage Schema:**
```javascript
// chrome.storage.local
{
  apiKey: string,         // OpenAI API key
  model: string,          // OpenAI model name (default 'gpt-5.6-luna')
  systemPrompt: string,   // Custom translation instructions
  targetLanguage: string, // 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko'
  popupInput: string,     // Last popup input
  popupOutput: string,    // Last translation (removed when a new one starts)
  popupError: string,     // Last translation error (removed when a new one starts)
  popupDetectedLanguage: string // Last detected language name
}
// chrome.storage.session
{
  pendingSelection: string // Text from the context menu, consumed by the popup
}
```

## Development Commands

### Testing in Chrome
```bash
# No build step required - load directly as unpacked extension
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select this directory
```

### Reload After Changes
- Click the reload icon in chrome://extensions/ for the LinguaSwitch extension
- For popup/options changes, close and reopen the popup/options page
- For `background.js` changes, the reload is required; inspect the service worker from chrome://extensions/ to see its console

### Testing without Chrome
There is no standalone testing environment. All development requires Chrome browser. `node --check <file>.js` catches syntax errors only. `background.js` has no DOM dependency, so its message handling can be exercised in Node with a mocked `chrome` and `fetch`.

## File Structure

```
popup.html + popup.js     # Main translation interface (UI, language detection, state)
background.js             # Service worker: OpenAI calls, context menu
defaults.js               # Shared default model and system prompt
options.html + options.js # Settings page (API key, model, system prompt)
styles.css                # Shared styles for both pages
manifest.json             # Extension configuration (Manifest V3)
icons/                    # Extension icons (16x16, 48x48, 128x128)
```

## Key Technical Constraints

1. **No Build Process:** This is vanilla JavaScript - direct file edits are immediately testable
2. **Manifest V3 Requirements:** Uses `chrome.storage` API (not localStorage); permissions are `storage`, `contextMenus`; background is a classic service worker; `minimum_chrome_version` is 102 (`chrome.storage.session`)
3. **API Model:** Read from `chrome.storage.local.model` by the service worker at translate time
4. **No Backend:** All translation happens client-side via direct OpenAI API calls

## Common Modifications

**To change the default OpenAI model or system prompt:**
- Update `LINGUASWITCH_DEFAULTS` in `defaults.js`

**To modify translation logic:**
- Update the messages built in `requestTranslation()` (`background.js`)
- Add/remove target languages in `popup.html` (`#targetLanguage` options) and `TARGET_LANGUAGES` in `background.js`

**To adjust language detection:**
- Modify `detectLanguage()` in `popup.js`

**To change the context menu:**
- Menu title/contexts in `background.js`; popup pickup logic in the `pendingSelection` block of `popup.js`
