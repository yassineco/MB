// Content script pour Chrome Extension MV3
// Injecté dans toutes les pages web

import './content.css';

console.log('Magic Button content script loaded');

// Ajouter un indicateur visuel quand du texte est sélectionné
let selectionIndicator: HTMLElement | null = null;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim();

  if (selectedText && selectedText.length > 3) {
    showSelectionIndicator();
  } else {
    hideSelectionIndicator();
  }
});

function showSelectionIndicator() {
  hideSelectionIndicator(); // Supprimer l'ancien indicateur

  selectionIndicator = document.createElement('div');
  selectionIndicator.id = 'magic-button-indicator';
  selectionIndicator.innerHTML = '✨ Magic Button ready';
  selectionIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
    cursor: pointer;
  `;

  // Ajouter l'animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  selectionIndicator.addEventListener('click', () => {
    // Ouvrir la popup via message au background
    chrome.runtime.sendMessage({
      type: 'OPEN_POPUP',
      selectedText: window.getSelection()?.toString() || '',
    });
  });

  document.body.appendChild(selectionIndicator);

  // Auto-hide après 5 secondes
  setTimeout(hideSelectionIndicator, 5000);
}

function hideSelectionIndicator() {
  if (selectionIndicator) {
    selectionIndicator.remove();
    selectionIndicator = null;
  }
}

// Nettoyer quand on quitte la page
window.addEventListener('beforeunload', () => {
  hideSelectionIndicator();
});