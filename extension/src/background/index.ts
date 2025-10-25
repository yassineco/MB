// Background script pour Chrome Extension MV3
// Gère les événements en arrière-plan

console.log('Magic Button background script loaded');

// Événement d'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Magic Button extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Première installation
    chrome.storage.local.set({
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
    });
  }
});

// Gestion des messages depuis le content script ou popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'GET_SELECTED_TEXT':
      handleGetSelectedText(sender.tab?.id, sendResponse);
      return true; // Indique une réponse asynchrone
      
    case 'PROCESS_AI_REQUEST':
      handleAIRequest(message.data, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Récupérer le texte sélectionné
async function handleGetSelectedText(tabId: number | undefined, sendResponse: (response: any) => void) {
  try {
    if (!tabId) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection()?.toString() || '',
    });

    const selectedText = results[0]?.result || '';
    sendResponse({ selectedText });
  } catch (error) {
    console.error('Error getting selected text:', error);
    sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Configuration de l'API
const API_BASE_URL = 'https://magic-button-api-374140035541.europe-west1.run.app';

// Traiter une requête IA via l'API Cloud Run
async function handleAIRequest(data: any, sendResponse: (response: any) => void) {
  try {
    console.log('Making API request to:', `${API_BASE_URL}/api/genai/process`);
    console.log('Request data:', data);
    
    const response = await fetch(`${API_BASE_URL}/api/genai/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: data.action,
        text: data.text,
        options: data.options || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    
    sendResponse(result);

  } catch (error) {
    console.error('Error processing AI request:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      action: data.action 
    });
  }
}