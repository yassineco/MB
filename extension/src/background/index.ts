// Background script pour Chrome Extension MV3
// Gère les événements en arrière-plan

import { API_CONFIG } from '../config/api';

console.log('Magic Button background script loaded');
console.log('🚀 API Configuration:', API_CONFIG.BASE_URL);

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
      processAIRequest(message.data, sendResponse);
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

// Configuration de l'API - MODE PERSISTANT PRODUCTION
const API_BASE_URL = API_CONFIG.BASE_URL;

// Traiter une requête IA via l'API Cloud Run - VERTEX AI
async function processAIRequest(data: any, sendResponse: (response: any) => void) {
  try {
    const apiUrl = `${API_BASE_URL}/api/genai/process`;
    console.log('🚀 VERTEX AI - Making API request to:', apiUrl);
    console.log('Request data:', data);
    console.log('API_BASE_URL from config:', API_CONFIG.BASE_URL);

    const requestBody = {
      action: data.action,
      text: data.text,
      options: data.options || {}
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ API Response success:', result);
    sendResponse(result);

  } catch (error) {
    console.error('❌ Error processing AI request:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      action: data.action 
    });
  }
}