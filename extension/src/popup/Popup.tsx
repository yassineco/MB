import React, { useState, useEffect } from 'react';
import { FileText, Search, Languages, Wand2, Database, Type, Sparkles, Upload, MessageSquare } from 'lucide-react';

// Types
interface AIAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ProcessingState {
  isProcessing: boolean;
  action: string | null;
  result: string | null;
  error: string | null;
}

interface Tab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'actions',
    name: 'Actions IA',
    icon: <Wand2 className="w-4 h-4" />,
  },
  {
    id: 'rag',
    name: 'Assistant RAG',
    icon: <Database className="w-4 h-4" />,
  },
];

const AI_ACTIONS: AIAction[] = [
  {
    id: 'corriger',
    name: 'Corriger',
    description: 'Corrige l\'orthographe et la grammaire',
    icon: <Type className="w-4 h-4" />,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    id: 'résumer',
    name: 'Résumer',
    description: 'Résume le texte en points clés',
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    id: 'traduire',
    name: 'Traduire',
    description: 'Traduit vers une autre langue',
    icon: <Languages className="w-4 h-4" />,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    id: 'optimiser',
    name: 'Optimiser',
    description: 'Améliore la clarté et l\'impact',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

export function Popup(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('actions');
  const [selectedText, setSelectedText] = useState<string>('');
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    action: null,
    result: null,
    error: null,
  });

  // Options pour la traduction
  const [translationOptions, setTranslationOptions] = useState({
    targetLanguage: 'en',
    showLanguageSelector: false,
  });

  // État RAG
  const [ragState, setRagState] = useState({
    documents: [],
    query: '',
    searchResults: [],
    isUploading: false,
    isSearching: false,
    isGenerating: false,
    notification: null as { type: 'success' | 'error'; message: string } | null,
  });

  // Récupérer le texte sélectionné au chargement
  useEffect(() => {
    getSelectedText();
  }, []);

  const getSelectedText = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString() || '',
      });

      const text = results[0]?.result || '';
      setSelectedText(text);
    } catch (error) {
      console.error('Erreur lors de la récupération du texte:', error);
    }
  };

  const processText = async (action: string, targetLanguage?: string) => {
    console.log('🎯 Popup: processText called with action:', action, 'targetLanguage:', targetLanguage);
    console.log('🎯 Popup: selectedText:', selectedText);
    
    if (!selectedText.trim()) {
      console.log('❌ Popup: No text selected');
      setProcessing({
        isProcessing: false,
        action: null,
        result: null,
        error: 'Aucun texte sélectionné. Sélectionnez du texte sur la page.',
      });
      return;
    }

    // Pour la traduction, demander la langue si pas fournie
    if (action === 'traduire' && !targetLanguage) {
      console.log('🔤 Popup: Translation requested, showing language selector');
      setTranslationOptions({
        ...translationOptions,
        showLanguageSelector: true,
      });
      return;
    }

    console.log('🚀 Popup: Starting processing...');
    setProcessing({
      isProcessing: true,
      action,
      result: null,
      error: null,
    });

    try {
      console.log('📤 Popup: Sending message to background script');
      // Appel à l'API backend via le background script
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_AI_REQUEST',
        data: {
          action,
          text: selectedText,
          context: '',
          options: targetLanguage ? { targetLanguage } : undefined,
        },
      });

      console.log('📥 Popup: Received response from background:', response);

      if (response.error) {
        throw new Error(response.error);
      }
      
      setProcessing({
        isProcessing: false,
        action: null,
        result: response.result,
        error: null,
      });
    } catch (error) {
      console.error('❌ Popup: Error in processText:', error);
      setProcessing({
        isProcessing: false,
        action: null,
        result: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Afficher une notification de succès
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const reset = () => {
    setProcessing({
      isProcessing: false,
      action: null,
      result: null,
      error: null,
    });
    getSelectedText();
  };

  // Fonctions RAG
  // Configuration API - MODE PERSISTANT PRODUCTION
  const API_BASE = 'https://magic-button-api-374140035541.europe-west1.run.app';

  // Test simple de connectivity
  const testConnection = async () => {
    console.log('🔧 Test de connexion direct depuis popup...');
    try {
      // Test 1: Connexion directe
      const response = await fetch(`${API_BASE}/demo/status`);
      const data = await response.json();
      console.log('✅ Test direct réussi:', data);
      
      // Test 2: Via background script
      console.log('🔧 Test via background script...');
      const bgResponse = await chrome.runtime.sendMessage({
        type: 'PROCESS_AI_REQUEST',
        data: {
          action: 'test',
          text: 'Test texte',
          context: '',
          options: {}
        }
      });
      console.log('📥 Background response:', bgResponse);
      
      alert(`✅ Connexion OK!\n\nDirect: ${data.data.currentMode}\nBackground: ${bgResponse ? 'OK' : 'ECHEC'}`);
    } catch (error) {
      console.error('❌ Test échoué:', error);
      alert('❌ Erreur: ' + error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setRagState(prev => ({ ...prev, notification: { type, message } }));
    setTimeout(() => {
      setRagState(prev => ({ ...prev, notification: null }));
    }, 3000);
  };

  const uploadDocument = async (content: string, fileName: string) => {
    setRagState(prev => ({ ...prev, isUploading: true }));
    
    try {
      const response = await fetch(`${API_BASE}/rag/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileName,
          mimeType: 'text/plain',
          title: fileName
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRagState(prev => ({ 
          ...prev, 
          isUploading: false,
          documents: [...prev.documents, data] as any
        }));
        return data;
      } else {
        throw new Error(data.message || 'Erreur upload');
      }
    } catch (error) {
      setRagState(prev => ({ ...prev, isUploading: false }));
      throw error;
    }
  };

  const searchDocuments = async (query: string) => {
    setRagState(prev => ({ ...prev, isSearching: true }));
    
    try {
      const response = await fetch(`${API_BASE}/rag/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      
      if (data.success) {
        setRagState(prev => ({ 
          ...prev, 
          isSearching: false,
          searchResults: data.results
        }));
        return data.results;
      } else {
        throw new Error(data.message || 'Erreur recherche');
      }
    } catch (error) {
      setRagState(prev => ({ ...prev, isSearching: false }));
      throw error;
    }
  };

  const generateResponse = async (query: string) => {
    setRagState(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const response = await fetch(`${API_BASE}/rag/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxContextChunks: 5 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRagState(prev => ({ ...prev, isGenerating: false }));
        return data;
      } else {
        throw new Error(data.message || 'Erreur génération');
      }
    } catch (error) {
      setRagState(prev => ({ ...prev, isGenerating: false }));
      throw error;
    }
  };

  return (
    <div className="w-96 bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <h1 className="font-semibold">Magic Button</h1>
        </div>
        <p className="text-xs text-blue-100 mt-1">Assistant IA avec mémoire</p>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Onglet Actions IA */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Texte sélectionné */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Texte sélectionné :</h3>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[60px]">
                {selectedText ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedText}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Sélectionnez du texte sur la page pour commencer
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={getSelectedText}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Actualiser le texte sélectionné
                </button>
                <button
                  onClick={testConnection}
                  className="text-xs text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                >
                  🔧 Test Connexion
                </button>
              </div>
            </div>

            {/* Actions disponibles */}
            {selectedText && !processing.isProcessing && !processing.result && !processing.error && !translationOptions.showLanguageSelector && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Choisissez une action :</h3>
                <div className="grid grid-cols-2 gap-2">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => processText(action.id)}
                      className={`p-3 text-white text-sm rounded-lg transition-colors ${action.color}`}
                    >
                      <div className="flex items-center gap-2">
                        {action.icon}
                        <span>{action.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sélecteur de langue pour la traduction */}
            {translationOptions.showLanguageSelector && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Choisissez la langue de destination :</h3>
                <div className="space-y-2">
                  {[
                    { code: 'en', name: '🇬🇧 Anglais', flag: '🇬🇧' },
                    { code: 'es', name: '🇪🇸 Espagnol', flag: '🇪🇸' },
                    { code: 'de', name: '🇩🇪 Allemand', flag: '🇩🇪' },
                    { code: 'it', name: '🇮🇹 Italien', flag: '🇮🇹' },
                    { code: 'ar', name: '🇸🇦 Arabe', flag: '🇸🇦' },
                  ].map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        setTranslationOptions({
                          targetLanguage: language.code,
                          showLanguageSelector: false,
                        });
                        processText('traduire', language.code);
                      }}
                      className="w-full p-3 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Languages className="w-4 h-4" />
                        <span>{language.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setTranslationOptions({
                    ...translationOptions,
                    showLanguageSelector: false,
                  })}
                  className="w-full p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* État de traitement */}
            {processing.isProcessing && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Traitement en cours...</p>
                </div>
              </div>
            )}

            {/* Résultat */}
            {processing.result && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Résultat :</h3>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{processing.result}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(processing.result!)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    Copier
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    Nouveau
                  </button>
                </div>
              </div>
            )}

            {/* Erreur */}
            {processing.error && (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{processing.error}</p>
                </div>
                <button
                  onClick={reset}
                  className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onglet RAG */}
        {activeTab === 'rag' && (
          <div className="space-y-4">
            <div className="text-center">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-800">Assistant RAG</h3>
              <p className="text-sm text-gray-600">
                Uploadez des documents et posez vos questions
              </p>
              {ragState.documents.length > 0 && (
                <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block">
                  📚 {ragState.documents.length} document(s) dans la base
                </div>
              )}
            </div>

            {/* Upload de document */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">📄 Upload Document</h4>
              {selectedText && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Texte prêt :</strong> {selectedText.substring(0, 50)}
                  {selectedText.length > 50 ? '...' : ''} ({selectedText.length} caractères)
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedText) {
                      uploadDocument(selectedText, `selection_${Date.now()}.txt`)
                        .then(() => showNotification('success', 'Document uploadé avec succès!'))
                        .catch(err => showNotification('error', `Erreur: ${err.message}`));
                    } else {
                      showNotification('error', 'Sélectionnez du texte à uploader');
                    }
                  }}
                  disabled={!selectedText || ragState.isUploading}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {ragState.isUploading ? 'Upload...' : 'Upload Sélection'}
                </button>
              </div>
            </div>

            {/* Recherche */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">🔍 Recherche Sémantique</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragState.query}
                  onChange={(e) => setRagState(prev => ({ ...prev, query: e.target.value }))}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => {
                    if (ragState.query.trim()) {
                      searchDocuments(ragState.query)
                        .then(results => showNotification('success', `${results.length} résultats trouvés`))
                        .catch(err => showNotification('error', `Erreur: ${err.message}`));
                    }
                  }}
                  disabled={!ragState.query.trim() || ragState.isSearching}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {ragState.isSearching ? '...' : 'Chercher'}
                </button>
              </div>
            </div>

            {/* Génération de réponse */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">🤖 Réponse Augmentée</h4>
              <button
                onClick={() => {
                  if (ragState.query.trim()) {
                    generateResponse(ragState.query)
                      .then(data => {
                        setProcessing({
                          isProcessing: false,
                          action: 'rag',
                          result: data.response,
                          error: null,
                        });
                      })
                      .catch(err => {
                        setProcessing({
                          isProcessing: false,
                          action: 'rag',
                          result: null,
                          error: err.message,
                        });
                      });
                  }
                }}
                disabled={!ragState.query.trim() || ragState.isGenerating}
                className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {ragState.isGenerating ? 'Génération...' : 'Générer Réponse'}
              </button>
            </div>

            {/* Résultats de recherche */}
            {ragState.searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Résultats:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {ragState.searchResults.map((result: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="text-gray-600">Similarité: {Math.round(result.similarity * 100)}%</div>
                      <div className="text-gray-800">{result.content.substring(0, 100)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Résultat de génération */}
            {processing.action === 'rag' && processing.result && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Réponse RAG:</h4>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{processing.result}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(processing.result!)}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Copier la réponse
                </button>
              </div>
            )}

            {/* Erreur RAG */}
            {processing.action === 'rag' && processing.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{processing.error}</p>
              </div>
            )}

            {/* Notifications RAG */}
            {ragState.notification && (
              <div className={`p-3 rounded-lg border ${
                ragState.notification.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="text-sm">{ragState.notification.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}