import React, { useState, useEffect } from 'react';
import { Wand2, Type, FileText, Languages, Sparkles, Search } from 'lucide-react';

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
  const [selectedText, setSelectedText] = useState<string>('');
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    action: null,
    result: null,
    error: null,
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

  const processText = async (action: string, _targetLanguage?: string) => {
    if (!selectedText.trim()) {
      setProcessing({
        isProcessing: false,
        action: null,
        result: null,
        error: 'Aucun texte sélectionné. Sélectionnez du texte sur la page.',
      });
      return;
    }

    setProcessing({
      isProcessing: true,
      action,
      result: null,
      error: null,
    });

    try {
      // Appel à l'API backend via le background script
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_AI_REQUEST',
        data: {
          action,
          text: selectedText,
          context: '',
        },
      });

      if (response.error) {
        throw new Error(response.error);
      }
      
      setProcessing({
        isProcessing: false,
        action: null,
        result: response.result,
        error: null,
      });

      // Sauvegarder dans l'historique local
      await saveToHistory(action, selectedText, response.result);

    } catch (error) {
      setProcessing({
        isProcessing: false,
        action: null,
        result: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const saveToHistory = async (action: string, originalText: string, result: string) => {
    try {
      const historyItem = {
        id: Date.now().toString(),
        action,
        originalText,
        result,
        timestamp: new Date().toISOString(),
      };

      const { history = [] } = await chrome.storage.local.get(['history']);
      const updatedHistory = [historyItem, ...history.slice(0, 49)]; // Garder 50 éléments max
      await chrome.storage.local.set({ history: updatedHistory });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
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

  return (
    <div className="w-96 bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <h1 className="font-semibold">Magic Button</h1>
        </div>
        <p className="text-xs text-blue-100 mt-1">Assistant IA pour votre texte</p>
      </div>

      {/* Contenu principal */}
      <div className="p-4">
        {/* Texte sélectionné */}
        {selectedText ? (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Texte sélectionné :</h3>
            <div className="p-3 bg-gray-50 rounded-lg border text-sm text-gray-600 max-h-20 overflow-y-auto">
              {selectedText}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Sélectionnez du texte sur la page pour commencer
            </p>
          </div>
        )}

        {/* Actions IA */}
        {!processing.result && !processing.error && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Actions disponibles :</h3>
            <div className="grid grid-cols-2 gap-2">
              {AI_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => processText(action.id)}
                  disabled={!selectedText || processing.isProcessing}
                  className={`p-3 rounded-lg text-white text-sm font-medium transition-colors
                    ${action.color} 
                    ${!selectedText || processing.isProcessing 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-md'
                    }
                  `}
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

        {/* Actions supplémentaires */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <Search className="w-4 h-4" />
              Recherche intelligente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}