document.addEventListener('DOMContentLoaded', function() {
  const inputText = document.getElementById('inputText');
  const translateBtn = document.getElementById('translateBtn');
  const outputText = document.getElementById('outputText');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const openOptionsBtn = document.getElementById('openOptions');
  const copyBtn = document.getElementById('copyBtn');
  
  // Check if API key is set
  chrome.storage.local.get(['apiKey'], function(result) {
    if (!result.apiKey) {
      outputText.textContent = 'Please set your OpenAI API key in the settings first.';
      translateBtn.disabled = true;
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
  
  // Translate text
  translateBtn.addEventListener('click', function() {
    const text = inputText.value.trim();
    
    if (!text) {
      outputText.textContent = 'Please enter some text to translate.';
      document.getElementById('detectedLanguage').textContent = 'Detected language: ';
      return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    outputText.textContent = '';
    document.getElementById('detectedLanguage').textContent = 'Detecting language...';
    
    // Hide copy button when starting a new translation
    copyBtn.classList.remove('visible');
    
    // Get API key and system prompt from storage
    chrome.storage.local.get(['apiKey', 'systemPrompt'], function(result) {
      if (!result.apiKey) {
        loadingIndicator.classList.add('hidden');
        outputText.textContent = 'Please set your OpenAI API key in the settings first.';
        return;
      }
      
      // Determine if input is Chinese
      containsChinese(text)
        .then(isChinese => {
          // Set target language based on input
          const targetLanguage = isChinese ? 'English' : 'Traditional Chinese (zh-TW)';
          
          // Default system prompt if not set
          const systemPrompt = result.systemPrompt || 
            `You are a helpful translation assistant. Translate the user's input text. If the input contains Chinese characters, translate it to English. If the input is in any other language (like English, Japanese, Korean, etc.), translate it to Traditional Chinese (zh-TW). For Japanese text, ensure you translate it to Traditional Chinese characters, not Simplified Chinese.`;
          
          // Call OpenAI API
          return callOpenAI(text, result.apiKey, systemPrompt, targetLanguage);
        })
        .then(translation => {
          loadingIndicator.classList.add('hidden');
          outputText.textContent = translation;
          
          // Show copy button after translation is complete
          copyBtn.classList.add('visible');
        })
        .catch(error => {
          loadingIndicator.classList.add('hidden');
          outputText.textContent = `Error: ${error.message}`;
        });
    });
  });
  
  // Function to detect if text contains Chinese characters using OpenAI API
  async function containsChinese(text) {
    try {
      // Get API key from storage
      const result = await new Promise(resolve => {
        chrome.storage.local.get(['apiKey'], resolve);
      });
      
      if (!result.apiKey) {
        throw new Error('API key not found');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a language detection tool. Respond with the language name in English (e.g., "Chinese", "Japanese", "English", etc.).'
            },
            {
              role: 'user',
              content: `What is the primary language of this text? Respond with only the language name in English: "${text.substring(0, 100)}"`
            }
          ],
          temperature: 0.1
        })
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const data = await response.json();
      const detectedLanguage = data.choices[0].message.content.trim();
      
      // Update the UI with detected language
      document.getElementById('detectedLanguage').textContent = `Detected language: ${detectedLanguage}`;
      
      return detectedLanguage.toLowerCase().includes('chinese');
    } catch (error) {
      console.error('Error detecting language:', error);
      throw error;
    }
  }
  
  // Function to call OpenAI API
  async function callOpenAI(text, apiKey, systemPrompt, targetLanguage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Translate the following text to ${targetLanguage}: "${text}"`
          }
        ],
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to translate');
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
});