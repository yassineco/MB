#!/bin/bash

echo "🔍 VÉRIFICATION DU DÉPLOIEMENT VERTEX AI"
echo "========================================"
echo ""

echo "📅 Status du commit..."
git log --oneline -n 3

echo ""
echo "🌐 Test API Health..."
curl -s https://magic-button-api-374140035541.europe-west1.run.app/health | jq .

echo ""
echo "🧪 Test Correction (doit corriger 'Bonjer le mond')..."
RESPONSE=$(curl -s -X POST https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "corriger", 
    "text": "Bonjer le mond"
  }')

echo "Résultat: $(echo "$RESPONSE" | jq -r '.result')"
echo "Réponse complète: $RESPONSE"

echo ""
echo "🌍 Test Traduction (référence qui fonctionne)..."
TRANSLATE_RESPONSE=$(curl -s -X POST https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "traduire",
    "text": "Bonjour le monde",
    "options": {"targetLanguage": "en"}
  }')

echo "Traduction: $(echo "$TRANSLATE_RESPONSE" | jq -r '.result')"

echo ""
echo "🔍 ANALYSE:"
if echo "$RESPONSE" | jq -r '.result' | grep -q "Bonjer le mond"; then
    echo "❌ VERTEX AI PAS ENCORE ACTIF - Retourne texte original"
    echo "⏰ Attendre encore 2-3 minutes pour déploiement complet"
else
    echo "✅ VERTEX AI ACTIF - Correction détectée"
fi

echo ""
echo "📋 Prochaines étapes:"
echo "   1. Attendre le déploiement complet (5-10 min total)"
echo "   2. Re-exécuter ce script: ./check-deployment.sh"
echo "   3. Si toujours pas actif, vérifier logs Cloud Run"