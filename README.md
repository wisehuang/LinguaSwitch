# LinguaSwitch

A Chrome extension that uses OpenAI's GPT-4o model to intelligently translate text between Chinese and other languages.

## Features

- **Smart Translation**: Automatically detects input language and translates accordingly:
  - Chinese → English
  - Other languages (English, Korean, Japanese, etc.) → Traditional Chinese (zh-TW)
- **Local Storage**: Securely stores your OpenAI API key and custom system prompt locally
- **Customizable System Prompt**: Tailor the translation behavior to your specific needs

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the LinguaSwitch directory
5. The extension icon will appear in your Chrome toolbar

## Setup

Before using LinguaSwitch, you need to configure your OpenAI API key:

1. Click the LinguaSwitch icon in your Chrome toolbar
2. Click the "Settings" button
3. Enter your OpenAI API key (get one from [OpenAI's platform](https://platform.openai.com/))
4. Optionally customize the system prompt
5. Click "Save Settings"

## Usage

1. Click the LinguaSwitch icon in your Chrome toolbar
2. Enter or paste the text you want to translate in the input field
3. Click "Translate"
4. The translated text will appear in the output field

## Files Structure

```
LinguaSwitch/
├── manifest.json      # Extension configuration
├── popup.html         # Main extension popup interface
├── popup.js           # Main functionality script
├── options.html       # Settings page
├── options.js         # Settings functionality
├── styles.css         # Styling for both popup and options
└── README.md          # This file
```

## Note on Icons

The manifest.json file references icon files that should be placed in an `images` directory:
- `images/icon16.png` (16x16 pixels)
- `images/icon48.png` (48x48 pixels)
- `images/icon128.png` (128x128 pixels)

You'll need to create these icon files or modify the manifest to use your own icons.

## Technical Details

- Uses OpenAI's GPT-4o model for high-quality translations
- Detects Chinese text using a regular expression pattern
- Implements a clean, responsive UI with loading indicators
- Stores settings using Chrome's Storage API for persistence

## Privacy

This extension:
- Stores your API key locally on your device
- Does not collect or transmit any data except to the OpenAI API for translation
- Does not track your browsing activity

## License

MIT License

## Support

For issues or feature requests, please create an issue in this repository.