document.addEventListener('DOMContentLoaded', function() {
  const defaultModel = 'gpt-5.6-luna';
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const systemPromptInput = document.getElementById('systemPrompt');
  const saveButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved settings
  chrome.storage.local.get(['apiKey', 'model', 'systemPrompt'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }

    modelInput.value = result.model || defaultModel;
    
    if (result.systemPrompt) {
      systemPromptInput.value = result.systemPrompt;
    } else {
      // Default system prompt
      systemPromptInput.value = 'You are a helpful translation assistant. Translate the user\'s input text accurately to the requested target language.';
    }
  });
  
  // Save settings
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim() || defaultModel;
    const systemPrompt = systemPromptInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter your OpenAI API key.', 'error');
      return;
    }
    
    chrome.storage.local.set({
      apiKey: apiKey,
      model: model,
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
