#!/bin/bash

echo "🧪 TEST VERTEX AI - Action Corriger"
echo "===================================="
echo ""

# Test de la fonction corriger avec Vertex AI
echo "📝 Test de correction avec erreurs d'orthographe..."
echo ""

# Texte avec erreurs intentionnelles
TEXT_TO_CORRECT="Antonio Guteres a egalement evoqué les resultat du recensement conduit par les authorité marocaines en september 2024. Cette indication, forte en sens, est revelateur de lattractivité et de la qualité de vie dans ces Province marocaine."

echo "Texte original (avec erreurs):"
echo "\"$TEXT_TO_CORRECT\""
echo ""

echo "🌐 Test API de production..."
RESPONSE=$(curl -s -X POST https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"corriger\",
    \"text\": \"$TEXT_TO_CORRECT\"
  }")

echo "Réponse API:"
echo "$RESPONSE" | jq -r '.result' 2>/dev/null || echo "$RESPONSE"
echo ""

# Vérifier si c'est Vertex AI ou simulation
if echo "$RESPONSE" | grep -q "**Texte corrigé" || echo "$RESPONSE" | grep -q "simulation"; then
    echo "❌ SIMULATION DÉTECTÉE - Vertex AI pas encore actif"
    echo ""
    echo "📋 Actions requises:"
    echo "   1. Commit et push des changements backend"
    echo "   2. Attendre le déploiement automatique"
    echo "   3. Re-tester dans 3-5 minutes"
else
    echo "✅ VERTEX AI ACTIF - Correction intelligente fonctionnelle"
fi

echo ""
echo "🔍 Indicateurs Vertex AI vs Simulation:"
echo "   Vertex AI: Correction naturelle, contextuelle"
echo "   Simulation: Format '**Texte corrigé:**' avec note explicative"
echo ""

# Test traduction pour comparaison
echo "🌍 Test traduction (référence fonctionnelle):"
TRANSLATE_RESPONSE=$(curl -s -X POST https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "traduire",
    "text": "Bonjour le monde",
    "options": {"targetLanguage": "en"}
  }')

echo "$TRANSLATE_RESPONSE" | jq -r '.result' 2>/dev/null || echo "$TRANSLATE_RESPONSE"