# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinguaSwitch is a Chrome extension (Manifest V3) that provides intelligent bidirectional translation between Chinese and other languages using OpenAI's GPT-4o model.

**Translation Logic:**
- Chinese input → English output
- Non-Chinese input (English, Japanese, Korean, etc.) → Traditional Chinese (zh-TW) output

**Key Features:**
- AI-powered language detection using GPT-4o API
- Customizable system prompts for translation behavior
- Local storage of API keys and settings via Chrome Storage API
- Copy to clipboard functionality

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
1. **Language Detection** (`popup.js:99-147`): Makes a separate API call to GPT-4o to detect the input language
2. **Translation** (`popup.js:150-180`): Makes another API call with appropriate system prompt and target language
3. **Settings Management** (`options.js`): Handles API key and system prompt persistence via `chrome.storage.local`

### Important Implementation Details

**Dual API Calls:** The extension makes two separate OpenAI API calls per translation:
- First call detects the language (via `containsChinese()` function)
- Second call performs the actual translation (via `callOpenAI()` function)

**Default System Prompt:** Hardcoded in both `popup.js:78-79` and `options.js:17`. When modifying translation behavior, update both locations.

**Storage Schema:**
```javascript
{
  apiKey: string,      // OpenAI API key
  systemPrompt: string // Custom translation instructions
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

### Testing without Chrome
There is no standalone testing environment. All development requires Chrome browser.

## File Structure

```
popup.html + popup.js     # Main translation interface
options.html + options.js # Settings page (API key + system prompt)
styles.css                # Shared styles for both pages
manifest.json             # Extension configuration (Manifest V3)
icons/                    # Extension icons (16x16, 48x48, 128x128)
```

## Key Technical Constraints

1. **No Build Process:** This is vanilla JavaScript - direct file edits are immediately testable
2. **Manifest V3 Requirements:** Uses `chrome.storage` API (not localStorage), requires `storage` and `activeTab` permissions
3. **API Model:** Hardcoded to use `gpt-4o` model - changing models requires updating both API calls in `popup.js`
4. **No Backend:** All translation happens client-side via direct OpenAI API calls

## Common Modifications

**To change the OpenAI model:**
- Update model name in `popup.js:118` (language detection) and `popup.js:158` (translation)

**To modify translation logic:**
- Update default system prompt in `popup.js:78-79` and `options.js:17`
- Update target language selection logic in `popup.js:75`

**To adjust language detection:**
- Modify the detection API call in `popup.js:110-130`
- Update the Chinese detection logic in `popup.js:142`
