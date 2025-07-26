import { pipeline } from '@xenova/transformers';
import { cosineSimilarity } from './embedding-utils.js';

/**
 * PropertySearchEngine - Client-side vector similarity search using WebAssembly
 * Uses @xenova/transformers for running models directly in the browser/Node.js
 */
export class PropertySearchEngine {
  constructor() {
    this.embedder = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the search engine by loading the embedding model
   * This model runs entirely in the browser using WebAssembly
   */
  async initialize() {
    try {
      console.log('Loading embedding model...');
      
      // Load a small embedding model that runs in the browser via WebAssembly
      this.embedder = await pipeline('feature-extraction', 
        'Xenova/all-MiniLM-L6-v2', {
          // Configure to use WebAssembly backend
          device: 'webgpu' // Falls back to WebAssembly if WebGPU not available
        });
      
      this.isInitialized = true;
      console.log('✅ PropertySearchEngine initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize PropertySearchEngine:', error);
      throw new Error(`Failed to load embedding model: ${error.message}`);
    }
  }

  /**
   * Generate embedding for a given text query
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    if (!this.isInitialized) {
      throw new Error('SearchEngine not initialized. Call initialize() first.');
    }

    try {
      const output = await this.embedder(text, { pooling: 'mean', normalize: true });
      
      // Convert tensor to array and flatten if needed
      let embedding = Array.from(output.data);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Search for properties similar to the query
   * @param {string} query - Search query text
   * @param {Array} properties - Array of properties with embeddings
   * @param {Object} options - Search options
   * @param {number} options.topK - Number of results to return (default: 5)
   * @param {Object} options.filters - Property filters (price, bedrooms, etc.)
   * @returns {Promise<Array>} Top K most similar properties with similarity scores
   */
  async search(query, properties, options = {}) {
    const { topK = 5, filters = {} } = options;

    if (!this.isInitialized) {
      throw new Error('SearchEngine not initialized. Call initialize() first.');
    }

    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    if (!Array.isArray(properties) || properties.length === 0) {
      throw new Error('Properties must be a non-empty array');
    }

    try {
      console.log(`🔍 Searching for: "${query}"`);
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Apply filters if provided
      let filteredProperties = properties;
      if (Object.keys(filters).length > 0) {
        filteredProperties = this.applyFilters(properties, filters);
        console.log(`📊 Filtered ${properties.length} properties to ${filteredProperties.length}`);
      }

      // Calculate cosine similarity with all filtered properties
      const results = filteredProperties.map(property => {
        if (!property.embedding || !Array.isArray(property.embedding)) {
          console.warn(`Property ${property.id} missing embedding, skipping`);
          return null;
        }

        return {
          ...property,
          similarity: cosineSimilarity(queryEmbedding, property.embedding)
        };
      }).filter(Boolean); // Remove null entries

      // Sort by similarity score in descending order and return top K
      const topResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      console.log(`✅ Found ${topResults.length} results`);
      return topResults;

    } catch (error) {
      console.error('Error during search:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Apply filters to properties
   * @param {Array} properties - Array of properties
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered properties
   */
  applyFilters(properties, filters) {
    return properties.filter(property => {
      // Price range filter
      if (filters.minPrice && property.price < filters.minPrice) return false;
      if (filters.maxPrice && property.price > filters.maxPrice) return false;
      
      // Bedroom filter
      if (filters.minBedrooms && property.bedrooms < filters.minBedrooms) return false;
      if (filters.maxBedrooms && property.bedrooms > filters.maxBedrooms) return false;
      
      // Bathroom filter
      if (filters.minBathrooms && property.bathrooms < filters.minBathrooms) return false;
      
      // Amenities filter
      if (filters.requiredAmenities && filters.requiredAmenities.length > 0) {
        const hasAllAmenities = filters.requiredAmenities.every(amenity =>
          property.amenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }
      
      return true;
    });
  }

  /**
   * Search for multiple queries and combine results
   * @param {string[]} queries - Array of search queries
   * @param {Array} properties - Array of properties with embeddings
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Combined and deduplicated results
   */
  async multiSearch(queries, properties, options = {}) {
    const { topK = 5 } = options;
    
    // Get embeddings for all queries
    const queryEmbeddings = await Promise.all(
      queries.map(query => this.generateEmbedding(query))
    );

    // Calculate average embedding (centroid)
    const avgEmbedding = this.calculateCentroid(queryEmbeddings);

    // Search using the combined embedding
    const results = properties.map(property => ({
      ...property,
      similarity: cosineSimilarity(avgEmbedding, property.embedding)
    }));

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Calculate centroid of multiple embeddings
   * @param {Array<number[]>} embeddings - Array of embedding vectors
   * @returns {number[]} Centroid embedding
   */
  calculateCentroid(embeddings) {
    if (embeddings.length === 0) return [];
    
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    // Sum all embeddings
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    // Average and normalize
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }
    
    return centroid;
  }

  /**
   * Get search engine status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      modelName: 'Xenova/all-MiniLM-L6-v2',
      backend: 'WebAssembly'
    };
  }
}

// Export a singleton instance for convenience
export const searchEngine = new PropertySearchEngine(); 