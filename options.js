document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const systemPromptInput = document.getElementById('systemPrompt');
  const saveButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved settings
  chrome.storage.local.get(['apiKey', 'systemPrompt'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    
    if (result.systemPrompt) {
      systemPromptInput.value = result.systemPrompt;
    } else {
      // Default system prompt
      systemPromptInput.value = 'You are a helpful translation assistant. Translate the user\'s input text. If the input contains Chinese characters, translate it to English. If the input is in any other language (like English, Korean, Japanese, etc.), translate it to Traditional Chinese (zh-TW).';
    }
  });
  
  // Save settings
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const systemPrompt = systemPromptInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter your OpenAI API key.', 'error');
      return;
    }
    
    chrome.storage.local.set({
      apiKey: apiKey,
      systemPrompt: systemPrompt
    }, function() {
      showStatus('Settings saved successfully!', 'success');
    });
  });
  
  // Show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'status-success', 'status-error');
    statusMessage.classList.add(`status-${type}`);
    
    setTimeout(function() {
      statusMessage.classList.add('hidden');
    }, 3000);
  }
});