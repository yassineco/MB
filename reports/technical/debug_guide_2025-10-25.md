# 🔧 Guide de Debugging - Magic Button Extension

## 📊 Diagnostic de l'erreur "Failed to fetch"

### ✅ **Problème Résolu**

**Cause identifiée :** Extension configurée en mode développement local (`localhost:8080`) alors que l'API de production est disponible sur Cloud Run.

**Solution appliquée :** Configuration mise à jour vers l'URL de production :
```
https://magic-button-api-374140035541.europe-west1.run.app
```

### 🔍 **Comment consulter les logs de l'extension**

#### **1. Logs du Background Script**
```bash
1. Ouvrir Chrome
2. Aller à chrome://extensions/
3. Activer le "Mode développeur" (en haut à droite)
4. Cliquer sur "Afficher les vues" → "background.html" sur votre extension
5. Dans la console qui s'ouvre, voir les logs comme :
   - "Magic Button background script loaded"
   - "🚀 API Configuration: https://magic-button-api-..."
   - "🚀 MODE PERSISTANT - Making API request to: ..."
```

#### **2. Logs du Popup**
```bash
1. Clic droit sur l'icône de l'extension → "Inspecter le popup"
2. Dans l'onglet Console, voir les logs de test de connexion
3. Les erreurs de fetch apparaîtront ici
```

#### **3. Logs du Content Script**
```bash
1. Sur n'importe quelle page web, F12 → Console
2. Voir les logs d'injection du content script
```

### 🧪 **Tests de Validation**

#### **Test 1 : API Health Check**
```bash
curl https://magic-button-api-374140035541.europe-west1.run.app/health
# Réponse attendue : {"status":"ok","timestamp":"...","version":"1.0.0"}
```

#### **Test 2 : Action Traduire**
```bash
curl -X POST https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "traduire",
    "text": "Bonjour le monde",
    "options": {"targetLanguage": "en"}
  }'
# Réponse attendue : {"result":"Hello world",...}
```

#### **Test 3 : CORS pour Extension Chrome**
```bash
curl -X OPTIONS https://magic-button-api-374140035541.europe-west1.run.app/api/genai/process \
  -H "Origin: chrome-extension://test" \
  -v
# Vérifier : access-control-allow-origin: chrome-extension://test
```

### 🔄 **Basculement Dev/Production**

Pour basculer entre développement local et production :

1. **Éditer** `extension/src/config/api.ts`
2. **Changer** `const isDevelopment = false;` vers `true` pour dev local
3. **Recompiler** avec `npm run build`
4. **Recharger** l'extension dans Chrome

### 🚨 **Erreurs Communes et Solutions**

#### **"Failed to fetch"**
- ✅ **Solution** : Vérifier que l'URL API est correcte (production vs développement)
- ✅ **Solution** : S'assurer que l'API est disponible (`curl` health check)

#### **"CORS Error"**
- ✅ **Solution** : Vérifier que l'API autorise les extensions Chrome
- ✅ **Solution** : Headers `access-control-allow-origin` correctement configurés

#### **"Network Error"**
- ✅ **Solution** : Vérifier la connectivité Internet
- ✅ **Solution** : Firewall/proxy qui pourrait bloquer les requêtes

#### **"Traduire - Failed to fetch"**
- ✅ **Solution** : Vérifier que `targetLanguage` est fourni
- ✅ **Solution** : Format JSON de la requête correct

### 📱 **Recharger l'Extension après Modifications**

```bash
1. Aller à chrome://extensions/
2. Cliquer sur le bouton de rechargement (⟳) sur Magic Button
3. Tester à nouveau la fonctionnalité
```

### 🎯 **Status Actuel (25 Oct 2025)**

- ✅ **API Production** : Opérationnelle
- ✅ **Extension** : Compilée avec URLs de production  
- ✅ **CORS** : Configuré pour extensions Chrome
- ✅ **Actions IA** : Toutes fonctionnelles
- ✅ **RAG** : Intégré et opérationnel

**Le problème "Failed to fetch" pour "Traduire" est maintenant résolu !**