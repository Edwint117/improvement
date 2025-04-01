let overlay = null;
let isActive = false;

// Create overlay element
function createOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'transparent-overlay';
  document.body.appendChild(overlay);
  return overlay;
}

// Initialize overlay
function initOverlay() {
  if (!overlay) {
    overlay = createOverlay();
  }
  
  // Load saved settings
  chrome.storage.sync.get(['enabled', 'opacity', 'textSize'], (result) => {
    isActive = result.enabled || false;
    if (isActive) {
      overlay.classList.add('active');
    }
    updateOverlaySettings(result);
  });
}

// Update overlay settings
function updateOverlaySettings(settings) {
  if (!overlay) return;
  
  if (settings.opacity !== undefined) {
    overlay.style.opacity = settings.opacity / 100;
  }
  
  if (settings.textSize !== undefined) {
    const overlayTexts = overlay.getElementsByClassName('overlay-text');
    Array.from(overlayTexts).forEach(text => {
      text.style.fontSize = `${settings.textSize}px`;
    });
  }
}

// Handle text selection
function handleTextSelection() {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Create highlight
    const highlight = document.createElement('div');
    highlight.className = 'overlay-highlight';
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    document.body.appendChild(highlight);
    
    // Create text overlay
    const textOverlay = document.createElement('div');
    textOverlay.className = 'overlay-text';
    textOverlay.textContent = selection.toString();
    textOverlay.style.left = `${rect.left + window.scrollX}px`;
    textOverlay.style.top = `${rect.bottom + window.scrollY + 5}px`;
    overlay.appendChild(textOverlay);
    
    // Remove highlight and text overlay after 3 seconds
    setTimeout(() => {
      highlight.remove();
      textOverlay.remove();
    }, 3000);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'toggleOverlay':
      isActive = message.enabled;
      if (isActive) {
        overlay.classList.add('active');
      } else {
        overlay.classList.remove('active');
      }
      break;
      
    case 'updateOpacity':
      updateOverlaySettings({ opacity: message.opacity });
      break;
      
    case 'updateTextSize':
      updateOverlaySettings({ textSize: message.textSize });
      break;
  }
});

// Initialize overlay when content script loads
initOverlay();

// Add text selection listener
document.addEventListener('mouseup', () => {
  if (isActive) {
    handleTextSelection();
  }
}); 