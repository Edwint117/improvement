document.addEventListener('DOMContentLoaded', () => {
  const overlayToggle = document.getElementById('overlayToggle');
  const opacitySlider = document.getElementById('opacitySlider');
  const textSizeSlider = document.getElementById('textSizeSlider');

  // Load saved settings
  chrome.storage.sync.get(['enabled', 'opacity', 'textSize'], (result) => {
    overlayToggle.checked = result.enabled || false;
    opacitySlider.value = result.opacity || 50;
    textSizeSlider.value = result.textSize || 16;
  });

  // Handle overlay toggle
  overlayToggle.addEventListener('change', () => {
    const enabled = overlayToggle.checked;
    chrome.storage.sync.set({ enabled });
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleOverlay',
        enabled: enabled
      });
    });
  });

  // Handle opacity change
  opacitySlider.addEventListener('input', () => {
    const opacity = opacitySlider.value;
    chrome.storage.sync.set({ opacity });
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateOpacity',
        opacity: opacity
      });
    });
  });

  // Handle text size change
  textSizeSlider.addEventListener('input', () => {
    const textSize = textSizeSlider.value;
    chrome.storage.sync.set({ textSize });
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateTextSize',
        textSize: textSize
      });
    });
  });
}); 