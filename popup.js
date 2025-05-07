document.addEventListener('DOMContentLoaded', function() {
  const inputText = document.getElementById('inputText');
  const translateBtn = document.getElementById('translateBtn');
  const outputText = document.getElementById('outputText');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const openOptionsBtn = document.getElementById('openOptions');
  
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
  
  // Translate text
  translateBtn.addEventListener('click', function() {
    const text = inputText.value.trim();
    
    if (!text) {
      outputText.textContent = 'Please enter some text to translate.';
      return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    outputText.textContent = '';
    
    // Get API key and system prompt from storage
    chrome.storage.local.get(['apiKey', 'systemPrompt'], function(result) {
      if (!result.apiKey) {
        loadingIndicator.classList.add('hidden');
        outputText.textContent = 'Please set your OpenAI API key in the settings first.';
        return;
      }
      
      // Determine if input is Chinese
      const isChinese = containsChinese(text);
      
      // Set target language based on input
      const targetLanguage = isChinese ? 'English' : 'Traditional Chinese (zh-TW)';
      
      // Default system prompt if not set
      const systemPrompt = result.systemPrompt || 
        `You are a helpful translation assistant. Translate the user's input text. If the input contains Chinese characters, translate it to English. If the input is in any other language (like English, Korean, Japanese, etc.), translate it to Traditional Chinese (zh-TW).`;
      
      // Call OpenAI API
      callOpenAI(text, result.apiKey, systemPrompt, targetLanguage)
        .then(translation => {
          loadingIndicator.classList.add('hidden');
          outputText.textContent = translation;
        })
        .catch(error => {
          loadingIndicator.classList.add('hidden');
          outputText.textContent = `Error: ${error.message}`;
        });
    });
  });
  
  // Function to detect if text contains Chinese characters
  function containsChinese(text) {
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
    return chineseRegex.test(text);
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