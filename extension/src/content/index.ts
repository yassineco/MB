// Content script pour Chrome Extension MV3
// Injecté dans toutes les pages web - Version UX Améliorée

import './content.css';

console.log('🎯 Magic Button content script loaded - Enhanced UX');

// État de l'extension
interface ExtensionState {
  isEnabled: boolean;
  isVisible: boolean;
  selectedText: string;
}

let state: ExtensionState = {
  isEnabled: true,
  isVisible: false,
  selectedText: ''
};

// Éléments DOM
let floatingButton: HTMLElement | null = null;
let magicPanel: HTMLElement | null = null;
let stylesInjected = false;

// Initialisation
document.addEventListener('DOMContentLoaded', initializeExtension);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

function initializeExtension() {
  injectStyles();
  createFloatingButton();
  setupEventListeners();
  loadState();
}

function injectStyles() {
  if (stylesInjected) return;
  
  const style = document.createElement('style');
  style.id = 'magic-button-styles';
  style.textContent = `
    @keyframes magicSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes magicSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes magicPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @keyframes magicFadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

function createFloatingButton() {
  if (floatingButton) return;

  floatingButton = document.createElement('div');
  floatingButton.id = 'magic-floating-btn';
  floatingButton.innerHTML = `
    <div class="magic-btn-icon">✨</div>
    <div class="magic-btn-status"></div>
  `;
  
  floatingButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Icône et statut
  const icon = floatingButton.querySelector('.magic-btn-icon') as HTMLElement;
  const status = floatingButton.querySelector('.magic-btn-status') as HTMLElement;
  
  icon.style.cssText = `
    font-size: 24px;
    transition: transform 0.3s ease;
  `;
  
  status.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid white;
    transition: all 0.3s ease;
  `;

  floatingButton.addEventListener('click', togglePanel);
  floatingButton.addEventListener('mouseenter', () => {
    if (state.isEnabled) {
      floatingButton!.style.transform = 'scale(1.1)';
      floatingButton!.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.6)';
    }
  });
  
  floatingButton.addEventListener('mouseleave', () => {
    floatingButton!.style.transform = 'scale(1)';
    floatingButton!.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
  });

  updateFloatingButtonState();
  document.body.appendChild(floatingButton);
}

function createMagicPanel() {
  if (magicPanel) return;

  magicPanel = document.createElement('div');
  magicPanel.id = 'magic-panel';
  magicPanel.innerHTML = `
    <div class="magic-panel-header">
      <div class="magic-panel-title">
        <span class="magic-icon">✨</span>
        Magic Button
      </div>
      <div class="magic-panel-controls">
        <button id="magic-toggle-btn" class="magic-control-btn" title="Activer/Désactiver">
          <span id="magic-toggle-icon">⚡</span>
        </button>
        <button id="magic-minimize-btn" class="magic-control-btn" title="Réduire">×</button>
      </div>
    </div>
    
    <div class="magic-panel-content">
      <div class="magic-text-section">
        <div class="magic-selected-text" id="magic-selected-text">
          <span class="magic-placeholder">Sélectionnez du texte sur la page...</span>
        </div>
      </div>
      
      <div class="magic-actions">
        <button class="magic-action-btn" data-action="correct">
          <span class="magic-action-icon">✏️</span>
          Corriger
        </button>
        <button class="magic-action-btn" data-action="summarize">
          <span class="magic-action-icon">📝</span>
          Résumer
        </button>
        <button class="magic-action-btn" data-action="translate">
          <span class="magic-action-icon">🌍</span>
          Traduire
        </button>
        <button class="magic-action-btn" data-action="optimize">
          <span class="magic-action-icon">🎯</span>
          Optimiser
        </button>
      </div>
      
      <div class="magic-status" id="magic-status">
        <span class="magic-status-indicator"></span>
        <span id="magic-status-text">Prêt</span>
      </div>
    </div>
  `;

  magicPanel.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    width: 320px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid rgba(0, 0, 0, 0.1);
    animation: magicFadeIn 0.3s ease-out;
    max-height: 500px;
    overflow: hidden;
  `;

  setupPanelStyles();
  setupPanelEventListeners();
  document.body.appendChild(magicPanel);
}

function setupPanelStyles() {
  if (!magicPanel) return;

  const header = magicPanel.querySelector('.magic-panel-header') as HTMLElement;
  const title = magicPanel.querySelector('.magic-panel-title') as HTMLElement;
  const controls = magicPanel.querySelector('.magic-panel-controls') as HTMLElement;
  const content = magicPanel.querySelector('.magic-panel-content') as HTMLElement;
  const textSection = magicPanel.querySelector('.magic-text-section') as HTMLElement;
  const selectedText = magicPanel.querySelector('.magic-selected-text') as HTMLElement;
  const actions = magicPanel.querySelector('.magic-actions') as HTMLElement;
  const status = magicPanel.querySelector('.magic-status') as HTMLElement;

  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px 16px 0 0;
  `;

  title.style.cssText = `
    font-weight: 600;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  controls.style.cssText = `
    display: flex;
    gap: 8px;
  `;

  // Style des boutons de contrôle
  const controlBtns = magicPanel.querySelectorAll('.magic-control-btn');
  controlBtns.forEach(btn => {
    (btn as HTMLElement).style.cssText = `
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s ease;
    `;
  });

  content.style.cssText = `
    padding: 20px;
  `;

  textSection.style.cssText = `
    margin-bottom: 16px;
  `;

  selectedText.style.cssText = `
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    min-height: 60px;
    font-size: 14px;
    line-height: 1.5;
    color: #64748b;
    transition: all 0.3s ease;
  `;

  actions.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  `;

  // Style des boutons d'action
  const actionBtns = magicPanel.querySelectorAll('.magic-action-btn');
  actionBtns.forEach(btn => {
    (btn as HTMLElement).style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      color: #475569;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
  });

  status.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    font-size: 12px;
    color: #15803d;
  `;

  const statusIndicator = magicPanel.querySelector('.magic-status-indicator') as HTMLElement;
  statusIndicator.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  `;
}

function setupPanelEventListeners() {
  if (!magicPanel) return;

  // Bouton de réduction
  const minimizeBtn = magicPanel.querySelector('#magic-minimize-btn');
  minimizeBtn?.addEventListener('click', () => {
    state.isVisible = false;
    hidePanel();
    saveState();
  });

  // Bouton toggle enable/disable
  const toggleBtn = magicPanel.querySelector('#magic-toggle-btn');
  toggleBtn?.addEventListener('click', () => {
    state.isEnabled = !state.isEnabled;
    updateFloatingButtonState();
    updatePanelState();
    saveState();
  });

  // Boutons d'action
  const actionBtns = magicPanel.querySelectorAll('.magic-action-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', handleAction);
    
    // Hover effects
    btn.addEventListener('mouseenter', () => {
      if (state.isEnabled && state.selectedText) {
        (btn as HTMLElement).style.background = '#e2e8f0';
        (btn as HTMLElement).style.transform = 'translateY(-1px)';
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      (btn as HTMLElement).style.background = '#f1f5f9';
      (btn as HTMLElement).style.transform = 'translateY(0)';
    });
  });

  // Hover effects pour boutons de contrôle
  const controlBtns = magicPanel.querySelectorAll('.magic-control-btn');
  controlBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
    });
    
    btn.addEventListener('mouseleave', () => {
      (btn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
    });
  });
}

function setupEventListeners() {
  // Détection de sélection de texte
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
  
  // Échapper pour fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.isVisible) {
      state.isVisible = false;
      hidePanel();
      saveState();
    }
  });
}

function handleTextSelection() {
  if (!state.isEnabled) return;

  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || '';

  if (selectedText && selectedText.length > 3) {
    state.selectedText = selectedText;
    updateSelectedText();
    
    // Animation du bouton flottant
    if (floatingButton) {
      floatingButton.style.animation = 'magicPulse 0.6s ease-in-out';
      setTimeout(() => {
        if (floatingButton) {
          floatingButton.style.animation = '';
        }
      }, 600);
    }
  } else {
    state.selectedText = '';
    updateSelectedText();
  }
}

function togglePanel() {
  if (!state.isEnabled) return;

  state.isVisible = !state.isVisible;
  
  if (state.isVisible) {
    showPanel();
  } else {
    hidePanel();
  }
  
  saveState();
}

function showPanel() {
  if (!magicPanel) {
    createMagicPanel();
  }
  
  if (magicPanel) {
    magicPanel.style.display = 'block';
    magicPanel.style.animation = 'magicFadeIn 0.3s ease-out';
    updateSelectedText();
    updatePanelState();
  }
}

function hidePanel() {
  if (magicPanel) {
    magicPanel.style.animation = 'magicSlideOut 0.3s ease-in';
    setTimeout(() => {
      if (magicPanel) {
        magicPanel.style.display = 'none';
      }
    }, 300);
  }
}

function updateFloatingButtonState() {
  if (!floatingButton) return;

  const icon = floatingButton.querySelector('.magic-btn-icon') as HTMLElement;
  const status = floatingButton.querySelector('.magic-btn-status') as HTMLElement;

  if (state.isEnabled) {
    floatingButton.style.opacity = '1';
    floatingButton.style.cursor = 'pointer';
    icon.textContent = '✨';
    status.style.background = '#10b981';
    floatingButton.title = 'Magic Button (Activé) - Cliquez pour ouvrir';
  } else {
    floatingButton.style.opacity = '0.5';
    floatingButton.style.cursor = 'default';
    icon.textContent = '😴';
    status.style.background = '#ef4444';
    floatingButton.title = 'Magic Button (Désactivé) - Cliquez pour ouvrir';
  }
}

function updateSelectedText() {
  if (!magicPanel) return;

  const selectedTextEl = magicPanel.querySelector('#magic-selected-text') as HTMLElement;

  if (state.selectedText) {
    selectedTextEl.innerHTML = state.selectedText;
    selectedTextEl.style.background = '#ecfdf5';
    selectedTextEl.style.borderColor = '#10b981';
    selectedTextEl.style.color = '#064e3b';
  } else {
    selectedTextEl.innerHTML = '<span class="magic-placeholder">Sélectionnez du texte sur la page...</span>';
    selectedTextEl.style.background = '#f8fafc';
    selectedTextEl.style.borderColor = '#e2e8f0';
    selectedTextEl.style.color = '#64748b';
  }
  
  updateActionButtons();
}

function updateActionButtons() {
  if (!magicPanel) return;

  const actionBtns = magicPanel.querySelectorAll('.magic-action-btn');
  const hasText = state.selectedText.length > 0;
  const isEnabled = state.isEnabled;

  actionBtns.forEach(btn => {
    const btnEl = btn as HTMLElement;
    if (hasText && isEnabled) {
      btnEl.style.opacity = '1';
      btnEl.style.cursor = 'pointer';
      btnEl.style.pointerEvents = 'auto';
    } else {
      btnEl.style.opacity = '0.5';
      btnEl.style.cursor = 'not-allowed';
      btnEl.style.pointerEvents = 'none';
    }
  });
}

function updatePanelState() {
  if (!magicPanel) return;

  const toggleBtn = magicPanel.querySelector('#magic-toggle-btn') as HTMLElement;
  const toggleIcon = magicPanel.querySelector('#magic-toggle-icon') as HTMLElement;
  const statusText = magicPanel.querySelector('#magic-status-text') as HTMLElement;
  const statusIndicator = magicPanel.querySelector('.magic-status-indicator') as HTMLElement;
  const status = magicPanel.querySelector('.magic-status') as HTMLElement;

  if (state.isEnabled) {
    toggleIcon.textContent = '⚡';
    toggleBtn.title = 'Désactiver Magic Button';
    statusText.textContent = 'Activé';
    statusIndicator.style.background = '#22c55e';
    status.style.background = '#f0fdf4';
    status.style.borderColor = '#bbf7d0';
    status.style.color = '#15803d';
  } else {
    toggleIcon.textContent = '💤';
    toggleBtn.title = 'Activer Magic Button';
    statusText.textContent = 'Désactivé';
    statusIndicator.style.background = '#ef4444';
    status.style.background = '#fef2f2';
    status.style.borderColor = '#fecaca';
    status.style.color = '#dc2626';
  }
  
  updateActionButtons();
}

function handleAction(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const action = target.getAttribute('data-action');
  
  if (!action || !state.selectedText || !state.isEnabled) return;

  updateStatus('Traitement...', 'loading');

  // Envoyer le message au background script
  chrome.runtime.sendMessage({
    type: 'PROCESS_TEXT',
    action: action,
    text: state.selectedText
  }, (response) => {
    if (response && response.success) {
      updateStatus('Terminé', 'success');
      
      // Copier le résultat dans le presse-papiers
      navigator.clipboard.writeText(response.result).then(() => {
        updateStatus('Copié dans le presse-papiers', 'success');
        setTimeout(() => updateStatus('Prêt', 'ready'), 2000);
      });
    } else {
      updateStatus('Erreur', 'error');
      setTimeout(() => updateStatus('Prêt', 'ready'), 3000);
    }
  });
}

function updateStatus(text: string, type: 'ready' | 'loading' | 'success' | 'error') {
  if (!magicPanel) return;

  const statusText = magicPanel.querySelector('#magic-status-text') as HTMLElement;
  const statusIndicator = magicPanel.querySelector('.magic-status-indicator') as HTMLElement;
  const status = magicPanel.querySelector('.magic-status') as HTMLElement;

  statusText.textContent = text;

  switch (type) {
    case 'loading':
      statusIndicator.style.background = '#f59e0b';
      status.style.background = '#fffbeb';
      status.style.borderColor = '#fed7aa';
      status.style.color = '#92400e';
      break;
    case 'success':
      statusIndicator.style.background = '#10b981';
      status.style.background = '#ecfdf5';
      status.style.borderColor = '#a7f3d0';
      status.style.color = '#047857';
      break;
    case 'error':
      statusIndicator.style.background = '#ef4444';
      status.style.background = '#fef2f2';
      status.style.borderColor = '#fecaca';
      status.style.color = '#dc2626';
      break;
    default: // ready
      statusIndicator.style.background = '#22c55e';
      status.style.background = '#f0fdf4';
      status.style.borderColor = '#bbf7d0';
      status.style.color = '#15803d';
  }
}

// Sauvegarde et chargement de l'état
function saveState() {
  chrome.storage.local.set({ magicButtonState: state });
}

function loadState() {
  chrome.storage.local.get(['magicButtonState'], (result) => {
    if (result.magicButtonState) {
      state = { ...state, ...result.magicButtonState };
      updateFloatingButtonState();
      
      if (state.isVisible) {
        showPanel();
      }
    }
  });
}

// Nettoyage
window.addEventListener('beforeunload', () => {
  if (floatingButton) {
    floatingButton.remove();
  }
  if (magicPanel) {
    magicPanel.remove();
  }
});