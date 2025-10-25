# 🚨 GUIDE URGENT - Résolution "Failed to fetch"

## ⚡ Actions Immédiates à Effectuer

### 1. **Recharger l'Extension dans Chrome**

```
1. Ouvrir un nouvel onglet Chrome
2. Aller à : chrome://extensions/
3. Activer le "Mode développeur" (toggle en haut à droite)
4. Localiser "Magic Button" dans la liste
5. Cliquer sur le bouton de rechargement (⟳) à côté de l'extension
6. Vérifier que l'extension affiche "Activer" (pas "Recharger")
```

### 2. **Si l'Extension n'est pas Visible**

```
1. Cliquer sur "Charger l'extension non empaquetée"
2. Naviguer vers : /media/yassine/IA/Projects/konecta/magic_button_formation/extension/dist
3. Sélectionner le dossier dist/
4. Cliquer "Sélectionner un dossier"
```

### 3. **Vérification des Logs**

```
1. Sur chrome://extensions/, cliquer "Détails" sur Magic Button
2. Cliquer "Afficher les vues" → "background.html"
3. Dans la console qui s'ouvre, vous devriez voir :
   "🚀 API Configuration: https://magic-button-api-374140035541.europe-west1.run.app"
```

### 4. **Test Final**

```
1. Aller sur n'importe quelle page web
2. Sélectionner du texte
3. Cliquer sur l'icône Magic Button
4. Essayer "Traduire" → L'erreur devrait disparaître
```

## 🔍 **Si l'Erreur Persiste**

Ouvrir la console de debugging :
1. Clic droit sur l'icône Magic Button → "Inspecter le popup"
2. Dans Console, chercher les logs d'erreur
3. Vérifier l'URL utilisée dans les requêtes

## ⚠️ **Point Critique**

L'extension DOIT être rechargée manuellement après chaque recompilation !
Chrome ne détecte pas automatiquement les changements.