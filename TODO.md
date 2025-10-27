# TODO - Magic Button Extension

**Date de création** : 25 octobre 2025
**Dernière mise à jour** : 27 octobre 2025 - Session de résolution traduction
**Statut** : 🔄 EN COURS - Résolution problème traduction critique

## 🚨 PROBLÈMES CRITIQUES À RÉSOUDRE

### 1. Traduction Mixte Français/Anglais
- **Statut** : ❌ NON RÉSOLU
- **Problème** : La traduction contient encore du français
  - "qui fait ressortir" reste en français
  - "l'installation d'a plus grand nombre" (mélange)
- **Impact** : Utilisateurs reçoivent des traductions incomplètes
- **Priorité** : CRITIQUE

### 2. Serveur Local Non Fonctionnel
- **Statut** : ❌ NON RÉSOLU
- **Problème** : Le serveur backend local ne répond pas
  - Port 8080 semble occupé mais aucun processus trouvé
  - Erreur "EADDRINUSE" lors des tests
- **Impact** : Impossible de tester les améliorations localement
- **Priorité** : HAUTE

## 🔧 SOLUTIONS IMPLÉMENTÉES (À DÉPLOYER)

### 1. Traduction Renforcée 3 Étapes
- **Statut** : ✅ CODÉ, ⏳ À DÉPLOYER
- **Description** : Nouveau processus de traduction en 3 étapes
  1. Traduction directe ultra-stricte
  2. Détection et correction des mots français
  3. Polissage final et validation
- **Fichier** : `backend/src/services/vertex/geminiClient.ts`
- **Horodatage** : 25 oct 2025 - 19:35 UTC

### 2. Logging Détaillé
- **Statut** : ✅ IMPLÉMENTÉ
- **Description** : Logs complets pour diagnostic
  - Logs de requêtes d'extension
  - Logs de traduction étape par étape
  - Logs d'appels Vertex AI
- **Fichiers** : `backend/src/routes/genai.ts`, `geminiClient.ts`

## 📋 TÂCHES À FAIRE DEMAIN

### PRIORITÉ 1 - Résoudre la Traduction
- [ ] **Déployer la version améliorée en production**
  - Mettre à jour le serveur Google Cloud Run
  - Tester avec la nouvelle logique 3 étapes
  
- [ ] **Tester modèles alternatifs**
  - Essayer Gemini 1.5 Pro (plus puissant)
  - Évaluer OpenAI GPT-4 comme alternative
  - Comparer les performances de traduction

- [ ] **Post-traitement programmatique**
  - Ajouter nettoyage par regex/règles
  - Créer dictionnaire français→anglais
  - Validation automatique avant retour

### PRIORITÉ 2 - Infrastructure
- [ ] **Réparer le serveur local**
  - Identifier pourquoi le port 8080 pose problème
  - Configurer un port alternatif si nécessaire
  - Permettre les tests locaux

- [ ] **Configuration d'environnement**
  - Simplifier le basculement dev/prod
  - Variables d'environnement plus claires
  - Documentation de déploiement

### PRIORITÉ 3 - Tests et Validation
- [ ] **Tests unitaires pour traduction**
  - Cas de test avec textes français problématiques
  - Validation automatique de sortie 100% anglaise
  - Métriques de qualité de traduction

- [ ] **Interface de débogage**
  - Panel d'admin pour voir les logs en temps réel
  - Historique des traductions problématiques
  - Outils de diagnostic utilisateur

## 🔍 INVESTIGATIONS NÉCESSAIRES

### Analyse du Modèle Gemini
- [ ] Tester différents prompts avec Gemini 1.5 Flash
- [ ] Analyser les limitations du modèle pour le français
- [ ] Documenter les patterns qui échouent

### Performance et Coûts
- [ ] Mesurer l'impact de la traduction 3 étapes sur les coûts
- [ ] Optimiser les appels API pour réduire la latence
- [ ] Monitoring des quotas Vertex AI

## 📊 MÉTRIQUES À SUIVRE

### Qualité de Traduction
- **Objectif** : 100% de traductions pures (sans mélange)
- **Actuel** : ~70% (estimation basée sur les tests)
- **Mesure** : Pourcentage de traductions sans mots français

### Performance Technique
- **Latence de traduction** : Cible < 5 secondes
- **Taux d'erreur serveur** : Cible < 1%
- **Disponibilité** : Cible 99.9%

## 🚀 AMÉLIORATIONS FUTURES

### Fonctionnalités
- [ ] Support de plus de langues (espagnol, allemand, italien)
- [ ] Détection automatique de la langue source
- [ ] Historique des traductions utilisateur
- [ ] Mode hors ligne avec cache

### UX/UI
- [ ] Indicateur de progression pour traduction 3 étapes
- [ ] Options de style de traduction (formel/informel)
- [ ] Raccourcis clavier personnalisables

## 📝 NOTES TECHNIQUES

### Problèmes Identifiés
1. **Vertex AI Gemini 1.5 Flash** semble avoir des difficultés avec les traductions français→anglais complexes
2. **Prompts actuels** pas assez efficaces malgré les améliorations
3. **Architecture serveur** stable mais problèmes de connectivité locale

### Solutions Potentielles
1. **Hybrid approach** : Gemini + post-processing programmatique
2. **Model switching** : Utiliser GPT-4 pour traduction, Gemini pour autres tâches
3. **Prompt engineering avancé** : Templates spécialisés par type de contenu

---

**Rappel** : L'objectif est d'avoir une extension 100% fonctionnelle pour la démo N+1 avec traductions parfaites.