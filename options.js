document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const systemPromptInput = document.getElementById('systemPrompt');
  const saveButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');

  modelInput.placeholder = LINGUASWITCH_DEFAULTS.model;
  
  // Load saved settings
  chrome.storage.local.get(['apiKey', 'model', 'systemPrompt'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }

    modelInput.value = result.model || LINGUASWITCH_DEFAULTS.model;
    systemPromptInput.value = result.systemPrompt || LINGUASWITCH_DEFAULTS.systemPrompt;
  });
  
  // Save settings
  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const model = modelInput.value.trim() || LINGUASWITCH_DEFAULTS.model;
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
