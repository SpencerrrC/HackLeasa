import { pipeline } from '@xenova/transformers';
import { readFile } from 'fs/promises';
import { findSimilarProperties, filterProperties } from './embedding-utils.js';

/**
 * Demo script showing how to search properties using natural language
 */
async function demoSearch() {
  console.log('🔍 Property Search Demo\n');
  
  try {
    // Load properties with embeddings
    const propertiesData = await readFile('./data/properties-with-embeddings.json', 'utf8');
    const properties = JSON.parse(propertiesData);
    console.log(`✅ Loaded ${properties.length} properties with embeddings\n`);
    
    // Initialize the embedding model
    console.log('🤖 Loading embedding model...');
    const extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Model loaded\n');
    
    // Example queries
    const queries = [
      {
        text: "I need a quiet studio apartment near a park for under $2500",
        filters: { maxPrice: 2500, maxBedrooms: 0 }
      },
      {
        text: "Looking for a pet-friendly place with outdoor space and parking",
        filters: { requiredAmenities: ['pet friendly'] }
      },
      {
        text: "Modern luxury apartment with amazing views and concierge service",
        filters: { minPrice: 4000 }
      },
      {
        text: "Student-friendly affordable housing near campus with utilities included",
        filters: { maxPrice: 2500 }
      },
      {
        text: "Family home with multiple bedrooms in a quiet neighborhood with good schools",
        filters: { minBedrooms: 2 }
      }
    ];
    
    // Process each query
    for (const query of queries) {
      console.log('━'.repeat(80));
      console.log(`\n🔍 Query: "${query.text}"`);
      if (query.filters) {
        console.log(`   Filters: ${JSON.stringify(query.filters)}`);
      }
      
      // Generate embedding for the query
      const queryOutput = await extractor(query.text, {
        pooling: 'mean',
        normalize: true
      });
      const queryEmbedding = Array.from(queryOutput.data);
      
      // Apply filters first
      const filteredProperties = filterProperties(properties, query.filters);
      console.log(`   Filtered to ${filteredProperties.length} properties`);
      
      // Find similar properties
      const results = findSimilarProperties(queryEmbedding, filteredProperties, 3);
      
      // Display results
      console.log(`\n   Top ${results.length} matches:\n`);
      results.forEach((property, index) => {
        console.log(`   ${index + 1}. ${property.title}`);
        console.log(`      📍 ${property.address}`);
        console.log(`      💰 $${property.price}/month | 🛏️ ${property.bedrooms}BR/${property.bathrooms}BA`);
        console.log(`      🎯 Similarity: ${(property.similarity * 100).toFixed(1)}%`);
        console.log(`      ✨ ${property.amenities.slice(0, 3).join(', ')}${property.amenities.length > 3 ? '...' : ''}`);
        console.log(`      📧 ${property.landlordEmail}`);
        console.log();
      });
    }
    
    console.log('━'.repeat(80));
    console.log('\n✅ Demo complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the demo
demoSearch(); 