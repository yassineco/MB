# Session RAG System: Debugging & Deployment
**Date**: 27 octobre 2025
**Durée**: ~2 heures
**Objectif**: Résoudre les problèmes de recherche vectorielle RAG et déployer un système 100% fonctionnel

## 🎯 Problèmes Résolus

### 1. ❌ → ✅ Recherche Vectorielle Vide
**Symptôme**: `/rag/search` retournait toujours `[]` malgré documents uploadés
**Causes identifiées**:
- Firestore client initialisé **sans `databaseId`**
- Vertex AI embeddings utilisait mauvaise API (`getGenerativeModel` au lieu de REST API)
- Endpoint `/rag/generate` ne cherchait pas les sources avant de générer

**Solutions appliquées**:
```typescript
// 1. Ajout databaseId dans vector-db-real.ts
this.firestore = new Firestore({
  projectId: process.env.PROJECT_ID || 'magic-button-demo',
  databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
});

// 2. API REST pour embeddings dans embeddings-real.ts
private async callEmbeddingsAPI(
  instances: Array<{ content: string; task_type: string }>,
): Promise<any> {
  const client = await this.auth.getClient();
  const accessToken = await client.getAccessToken();
  const response = await fetch(this.apiEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instances }),
  });
  return response.json();
}

// 3. Recherche avant génération dans routes/rag.ts
const searchResults = await ragService.searchKnowledge(
  request.body.query,
  request.body.searchOptions || {}
);
const result = await ragService.generateAugmentedResponse(
  request.body.query,
  searchResults.results,
  request.body.searchOptions
);
```

### 2. ❌ → ✅ Échecs de Déploiement Cloud Build
**Symptôme**: `Error: Cannot find module '../lib/tsc.js'`
**Cause**: Buildpacks crée `/workspace/backend/` même en déployant depuis `backend/`
**Solution**: Build Docker local + push vers GCR

**Script créé** (`deploy-docker.sh`):
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

docker build -t gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest .
docker push gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
gcloud run deploy ${SERVICE_NAME} --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest ...
```

### 3. ❌ → ✅ Affichage "undefined" dans Réponses RAG
**Symptôme**: `1. undefined...` dans réponses générées
**Cause**: Mauvais chemin d'accès (`source.content` au lieu de `source.document.content`)
**Solution**:
```typescript
const content = source.document?.content || source.content || '';
response += `${index + 1}. ${content.substring(0, 200)}...\n\n`;
```

## 📊 Tests de Validation

### Upload Document
```bash
curl -X POST /rag/documents -d '{"fileName":"test.txt","mimeType":"text/plain","content":"Magic Button..."}'
```
**Résultat**: ✅ `{"success":true,"documentId":"doc_1761577797816","chunksCount":1,"embeddingsGenerated":1}`

### Recherche Vectorielle
```bash
curl '/rag/search?q=traduction+Chrome+extension&limit=5'
```
**Résultat**: ✅ `{"totalResults":1,"results":[{"similarity":0.6758628608245363,"rank":1}]}`

### Génération RAG
```bash
curl -X POST /rag/generate -d '{"query":"Comment fonctionne Magic Button ?","searchOptions":{"limit":5,"threshold":0.3}}'
```
**Résultat**: ✅ 
```json
{
  "confidence": 0.8,
  "sourcesCount": 1,
  "response": "Basé sur les informations trouvées :\n\n1. Magic Button est une extension Chrome pour la traduction et l analyse de texte. Elle utilise Google Vertex AI avec le modele Gemini 2.5 Flash..."
}
```

## 🏗️ Architecture Finale

### Stack Technique
- **Backend**: Node.js 18, Fastify, TypeScript
- **AI/ML**: 
  - Gemini 2.5 Flash (traduction)
  - text-embedding-004 (embeddings 768 dimensions)
- **Storage**:
  - Firestore Native (europe-west1, database: default)
  - Cloud Storage (magic-button-documents)
- **Hosting**: Cloud Run (revision 00027-kg5)
- **Build**: Docker multi-stage (alpine:18)

### Endpoints Fonctionnels
- ✅ `POST /rag/documents` - Upload & chunking
- ✅ `GET /rag/search?q=...` - Recherche vectorielle
- ✅ `POST /rag/generate` - Génération augmentée
- ✅ `POST /api/genai/process` - Traduction GenAI
- ✅ `GET /health` - Health check

### Performance Observée
- Upload: ~200-400ms
- Search: ~180-400ms (avec embeddings)
- Generate: ~2s (search + generation)
- Similarité: 57-67% pour requêtes pertinentes

## 📝 Commits Créés

1. `b01df908` - 🔧 FIX: Add databaseId to Firestore client initialization
2. `86f56a57` - 🔧 FIX: Use correct Vertex AI REST API for embeddings
3. `29c466e0` - 🔧 FIX: Add search step to /rag/generate endpoint
4. `c8d51a64` - 🐛 FIX: Correct source content path in RAG response generation
5. Création Dockerfile, .dockerignore, deploy-docker.sh

## 🎯 État Final

### ✅ Fonctionnalités Validées
- [x] Upload de documents (texte, PDF simulé)
- [x] Génération embeddings (Vertex AI text-embedding-004)
- [x] Stockage vectoriel (Firestore avec databaseId)
- [x] Recherche par similarité cosinus
- [x] Génération réponses RAG avec sources
- [x] Logging complet (Pino → Cloud Logging)
- [x] Déploiement Cloud Run via Docker

### 🔧 Configuration Environnement
```env
NODE_ENV=production
PROJECT_ID=magic-button-demo
REGION=europe-west1
VERTEX_LOCATION=europe-west1
GENAI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
BUCKET_NAME=magic-button-documents
FIRESTORE_DATABASE_ID=(default)
USE_REAL_EMBEDDINGS=true
USE_REAL_VECTOR_DB=true
LOG_LEVEL=info
```

### 📈 Métriques
- **Documents testés**: 7 (dans Firestore)
- **Révisions déployées**: 00020 → 00027 (8 déploiements)
- **Logs débug ajoutés**: ~50 lignes
- **Fichiers modifiés**: 8
- **Build time**: ~2min (Docker local)

## 🚀 Prochaines Étapes Suggérées

1. **Amélioration génération**: Intégrer Gemini pour réponses naturelles (pas juste copie sources)
2. **UI Extension**: Tester depuis Chrome extension popup
3. **Batch upload**: Support upload multiple documents
4. **Filtres avancés**: Par langue, userId, dateRange
5. **Monitoring**: Alertes sur taux d'erreur embeddings
6. **Cache**: Redis pour embeddings de requêtes fréquentes
7. **Tests**: Suite Jest pour RAG endpoints

## 📚 Documentation Ajoutée

- `backend/deploy-docker.sh` - Script déploiement automatisé
- `backend/.dockerignore` - Optimisation build
- `backend/.gcloudignore` - Exclusions Cloud Build
- Logs détaillés dans code pour debugging production

---

**Conclusion**: Système RAG maintenant 100% fonctionnel avec recherche vectorielle opérationnelle, génération de réponses avec sources, et déploiement Cloud Run stable via Docker.

**Service URL**: https://magic-button-api-374140035541.europe-west1.run.app
**Révision**: magic-button-api-00027-kg5
**Status**: ✅ Healthy & Serving Traffic
