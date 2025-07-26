Phase 1: Data Layer
Clever Move: Embed everything in JSON with vector embeddings pre-computed

1. Create Mock Property Database

2. Pre-compute Embeddings Locally
    - Use Transformers.js to generate embeddings offline
    - Store them directly in the JSON
    - This eliminates API calls during the demo!