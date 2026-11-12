# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguaSwitch is a Chrome extension (Manifest V3) that translates text using OpenAI chat models (default `gpt-5.6-luna`, configurable in settings).

**Translation Logic:**
- The user picks the target language in the popup (`zh-TW` default, `zh-CN`, `en`, `ja`, `ko`); the choice is saved
- Every translation request is "Translate the following text to {targetLanguage}" plus the system prompt
- Language detection is display-only; it does not change the target language

**Key Features:**
- Right-click context menu: select text on a page → "LinguaSwitch: Translate" → popup opens and auto-translates
- AI-powered language detection (display only)
- Configurable model and system prompt
- Popup input/output persisted across popup opens; Clear button resets them
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
1. **Language Detection** (`containsChinese()`, `popup.js:160-203`): Separate API call that asks the model for the input's language name; result shown in the popup footer
2. **Translation** (`callOpenAI()`, `popup.js:206-236`): API call with the system prompt and the selected target language
3. **Settings Management** (`options.js`): Persists API key, model, and system prompt via `chrome.storage.local`
4. **Context Menu** (`background.js`): Service worker registers a `selection` context menu; on click it stores the text in `chrome.storage.session.pendingSelection` and calls `chrome.action.openPopup()` (Chrome 127+). If that fails, it sets a "1" badge so the user clicks the icon
5. **Pending Selection Pickup** (`popup.js:38-47`): On open, the popup clears the badge, reads and removes `pendingSelection`, fills the input, and clicks Translate

### Important Implementation Details

**Dual API Calls:** Each translation makes two OpenAI Chat Completions calls (`/v1/chat/completions`), both with `reasoning_effort: 'none'`:
- `containsChinese()` detects the language (despite its name, the return value is unused)
- `callOpenAI()` performs the translation

**Default Model:** `defaultModel` is defined in both `popup.js:2` and `options.js:2`. Update both when changing the default.

**Default System Prompt:** Defined in two places with *different* text:
- `popup.js:134-135`: fallback used when no prompt is saved (generic "translate to the requested target language")
- `options.js:21`: prefilled in the settings textarea (older Chinese↔English auto-direction wording)

**Storage Schema:**
```javascript
// chrome.storage.local
{
  apiKey: string,         // OpenAI API key
  model: string,          // OpenAI model name (default 'gpt-5.6-luna')
  systemPrompt: string,   // Custom translation instructions
  targetLanguage: string, // 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko'
  popupInput: string,     // Last popup input
  popupOutput: string     // Last translation
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
There is no standalone testing environment. All development requires Chrome browser. `node --check <file>.js` catches syntax errors only.

## File Structure

```
popup.html + popup.js     # Main translation interface
background.js             # Context menu: right-click selected text -> open popup and translate
options.html + options.js # Settings page (API key, model, system prompt)
styles.css                # Shared styles for both pages
manifest.json             # Extension configuration (Manifest V3)
icons/                    # Extension icons (16x16, 48x48, 128x128)
```

## Key Technical Constraints

1. **No Build Process:** This is vanilla JavaScript - direct file edits are immediately testable
2. **Manifest V3 Requirements:** Uses `chrome.storage` API (not localStorage); permissions are `storage`, `activeTab`, `contextMenus`; background is a service worker
3. **API Model:** Read from `chrome.storage.local.model` at translate time and passed to both API calls
4. **No Backend:** All translation happens client-side via direct OpenAI API calls

## Common Modifications

**To change the default OpenAI model:**
- Update `defaultModel` in `popup.js:2` and `options.js:2`, and the placeholder in `options.html`

**To modify translation logic:**
- Update the default system prompts in `popup.js:134-135` and `options.js:21`
- Update the user message in `callOpenAI()` (`popup.js:206-236`)
- Add/remove target languages in `popup.html` (`#targetLanguage` options) and `languageMap` in `popup.js:124-131`

**To adjust language detection:**
- Modify the detection API call in `containsChinese()` (`popup.js:160-203`)

**To change the context menu:**
- Menu title/contexts in `background.js`; popup pickup logic in `popup.js:38-47`
