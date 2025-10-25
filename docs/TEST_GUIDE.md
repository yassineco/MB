# 🧪 Guide de Test - Magic Button avec RAG

## 📋 Instructions pour tester l'extension

### 1. **Chargement de l'extension dans Chrome**

1. Ouvrez Chrome et allez à `chrome://extensions/`
2. Activez le "Mode développeur" (en haut à droite)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier : `/media/yassine/IA/Projects/konecta/magic_button_formation/extension/dist`
5. L'extension devrait apparaître avec l'icône Magic Button

### 2. **Test de l'onglet "Actions IA" (fonctionnalités existantes)**

1. Allez sur une page web avec du texte
2. Sélectionnez du texte sur la page
3. Cliquez sur l'icône Magic Button dans la barre d'outils
4. Vérifiez que vous êtes sur l'onglet "Actions IA"
5. Testez les 4 actions : Corriger, Résumer, Traduire, Optimiser

### 3. **Test de l'onglet "Assistant RAG" (nouvelles fonctionnalités)**

#### 🔄 **Test Upload de Document**
1. Sélectionnez du texte sur une page web
2. Cliquez sur l'onglet "Assistant RAG"
3. Cliquez sur "Upload Sélection"
4. Vérifiez le message de succès

#### 🔍 **Test Recherche Sémantique**
1. Dans le champ "Posez votre question...", tapez une requête
2. Cliquez sur "Chercher"
3. Vérifiez les résultats affichés

#### 🤖 **Test Génération de Réponse Augmentée**
1. Assurez-vous d'avoir une question dans le champ
2. Cliquez sur "Générer Réponse"
3. Vérifiez que la réponse s'affiche dans la section dédiée

### 4. **Points à vérifier**

#### ✅ **Interface**
- [ ] Deux onglets visibles : "Actions IA" et "Assistant RAG"
- [ ] Navigation fluide entre les onglets
- [ ] Icônes et couleurs appropriées
- [ ] Interface responsive et lisible

#### ✅ **Fonctionnalités Actions IA**
- [ ] Récupération du texte sélectionné
- [ ] 4 boutons d'action colorés
- [ ] Traitement et affichage des résultats
- [ ] Boutons Copier et Nouveau

#### ✅ **Fonctionnalités RAG**
- [ ] Upload de document fonctionne
- [ ] Recherche retourne des résultats
- [ ] Génération de réponse affiche le contenu
- [ ] États de chargement visibles
- [ ] Gestion d'erreurs appropriée

### 5. **Scénarios de test complets**

#### 📄 **Scénario 1 : Workflow RAG complet**
1. Sélectionner du texte technique/documentation
2. L'uploader via Magic Button → RAG
3. Poser une question liée au contenu
4. Chercher des informations
5. Générer une réponse augmentée
6. Copier le résultat

#### 🔄 **Scénario 2 : Comparaison Actions vs RAG**
1. Sélectionner le même texte
2. Utiliser "Résumer" dans Actions IA
3. Puis poser la question "résume ce texte" dans RAG
4. Comparer les deux approches

### 6. **API Endpoints testés**

L'extension communique avec :
- `https://magic-button-api-374140035541.europe-west1.run.app/rag/documents` (Upload)
- `https://magic-button-api-374140035541.europe-west1.run.app/rag/search` (Recherche)
- `https://magic-button-api-374140035541.europe-west1.run.app/rag/generate` (Génération)

### 7. **Débogage**

Si des erreurs surviennent :
1. Ouvrir la console développeur (F12) sur la popup
2. Vérifier les erreurs dans l'onglet Console
3. Tester les endpoints directement avec curl si nécessaire

---

## 🎯 **Objectif du Test**

Valider que Magic Button est maintenant un **assistant intelligent avec mémoire** capable de :
- Conserver et rechercher dans des documents
- Fournir des réponses contextuelles basées sur le contenu stocké
- Offrir une expérience utilisateur fluide entre actions rapides et intelligence augmentée

**Succès attendu :** Extension fonctionnelle avec deux modes complémentaires d'assistance IA !