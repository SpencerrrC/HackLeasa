/**
 * Computes the cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Finds the most similar properties based on embedding similarity
 * @param {number[]} queryEmbedding - The embedding to search for
 * @param {Array} properties - Array of properties with embeddings
 * @param {number} topK - Number of results to return
 * @returns {Array} Top K most similar properties with similarity scores
 */
export function findSimilarProperties(queryEmbedding, properties, topK = 5) {
  // Calculate similarity scores for all properties
  const similarities = properties.map(property => ({
    ...property,
    similarity: cosineSimilarity(queryEmbedding, property.embedding)
  }));
  
  // Sort by similarity score in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return top K results
  return similarities.slice(0, topK);
}

/**
 * Filters properties by criteria before similarity search
 * @param {Array} properties - Array of properties
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered properties
 */
export function filterProperties(properties, filters = {}) {
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
 * Calculates the centroid (average) of multiple embeddings
 * Useful for combining multiple property preferences
 * @param {Array<number[]>} embeddings - Array of embedding vectors
 * @returns {number[]} Centroid embedding
 */
export function calculateCentroid(embeddings) {
  if (embeddings.length === 0) {
    throw new Error('Cannot calculate centroid of empty array');
  }
  
  const dimensions = embeddings[0].length;
  const centroid = new Array(dimensions).fill(0);
  
  // Sum all embeddings
  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += embedding[i];
    }
  }
  
  // Average
  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= embeddings.length;
  }
  
  // Normalize the centroid
  const magnitude = Math.sqrt(centroid.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= magnitude;
    }
  }
  
  return centroid;
} 