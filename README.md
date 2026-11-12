# LinguaSwitch

A Chrome extension (Manifest V3) that translates text with OpenAI models. Type or paste text in the popup, or select text on any web page and translate it from the right-click menu.

## Features

- **Right-click translation**: Select text on any web page, right-click, and choose **LinguaSwitch: Translate "…"**. The popup opens with the selected text and starts translating right away.
- **Target language selector**: Translate into Traditional Chinese (default), Simplified Chinese, English, Japanese, or Korean. The extension remembers your last choice.
- **Language detection**: Shows the detected language of the input.
- **Configurable model**: Use any OpenAI chat model. The default is `gpt-5.6-luna`.
- **Customizable system prompt**: Change the system prompt to control how the model translates.
- **Persistent popup state**: The last input and translation are kept when you close and reopen the popup. **Clear** resets them.
- **Copy to clipboard**: Copy the translation with one click.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Turn on **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the LinguaSwitch directory.
5. The LinguaSwitch icon appears in the Chrome toolbar.

No build step is required.

## Setup

1. Click the LinguaSwitch icon in the toolbar.
2. Click the **Settings** (gear) button.
3. Enter your OpenAI API key. You can get one from the [OpenAI platform](https://platform.openai.com/).
4. Optional: change the model name and the system prompt.
5. Click **Save Settings**.

## Usage

### From the popup

1. Click the LinguaSwitch icon in the toolbar.
2. Enter or paste text in the input field.
3. Choose a target language.
4. Click **Translate**.
5. Click **Copy** to copy the result, or **Clear** to start over.

### From the right-click menu

1. Select text on any web page.
2. Right-click and choose **LinguaSwitch: Translate "…"**.
3. The popup opens and translates the selection into your saved target language.

The right-click flow opens the popup with `chrome.action.openPopup()`, which needs Chrome 127 or later. If Chrome cannot open the popup, a **1** badge appears on the LinguaSwitch icon. Click the icon to translate the selection.

## File Structure

```
LinguaSwitch/
├── manifest.json   # Extension configuration (Manifest V3)
├── background.js   # Service worker: right-click menu, hands the selection to the popup
├── popup.html      # Translation popup
├── popup.js        # Popup logic: language detection, translation, state
├── options.html    # Settings page
├── options.js      # Settings logic: API key, model, system prompt
├── styles.css      # Shared styles for the popup and settings page
└── icons/          # Extension icons (16, 48, 128 px)
```

## Technical Details

- Calls the OpenAI Chat Completions API (`/v1/chat/completions`) directly from the extension. There is no backend.
- Makes two API calls per translation: one to detect the input language (for display) and one to translate into the selected target language.
- Stores settings, the target language, and the last popup input/output in `chrome.storage.local`.
- Holds right-click selections briefly in `chrome.storage.session` until the popup reads them.
- Permissions: `storage`, `activeTab`, `contextMenus`.

## Privacy

This extension:
- Stores your API key locally in your browser
- Sends text to the OpenAI API only when you translate it (from the popup or the right-click menu)
- Does not collect analytics or track your browsing activity

## License

MIT License

## Support

For issues or feature requests, please open an issue in this repository.
