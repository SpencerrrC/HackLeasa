import { pipeline, env } from '@xenova/transformers';
import { MOCK_PROPERTIES } from '../data/mock-properties.js';
import fs from 'fs/promises';
import path from 'path';

// Configure Transformers.js to use local models
env.localURL = './models/';
env.allowRemoteModels = true;

/**
 * Creates a comprehensive text representation of a property for embedding
 */
function createPropertyText(property) {
  const parts = [
    property.title,
    property.description,
    `${property.bedrooms} bedroom${property.bedrooms !== 1 ? 's' : ''}`,
    `${property.bathrooms} bathroom${property.bathrooms !== 1 ? 's' : ''}`,
    `$${property.price} per month`,
    `Located at ${property.address}`,
    property.amenities.join(', ')
  ];
  
  return parts.join('. ');
}

/**
 * Generates embeddings for all properties
 */
async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation...');
  
  try {
    // Initialize the feature extraction pipeline
    // Using all-MiniLM-L6-v2 which generates 384-dimensional embeddings
    const extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    
    console.log('✅ Model loaded successfully');
    
    // Process each property
    const propertiesWithEmbeddings = [];
    
    for (let i = 0; i < MOCK_PROPERTIES.length; i++) {
      const property = MOCK_PROPERTIES[i];
      console.log(`\n📍 Processing property ${i + 1}/${MOCK_PROPERTIES.length}: ${property.title}`);
      
      // Create comprehensive text representation
      const propertyText = createPropertyText(property);
      console.log(`   Text length: ${propertyText.length} characters`);
      
      // Generate embeddings
      const output = await extractor(propertyText, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert tensor to array
      const embedding = Array.from(output.data);
      console.log(`   ✅ Generated ${embedding.length}-dimensional embedding`);
      
      // Add embedding to property
      propertiesWithEmbeddings.push({
        ...property,
        embedding: embedding,
        embeddingText: propertyText // Store the text used for debugging
      });
    }
    
    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'data', 'properties-with-embeddings.json');
    await fs.writeFile(
      outputPath,
      JSON.stringify(propertiesWithEmbeddings, null, 2)
    );
    
    console.log(`\n✅ Successfully saved ${propertiesWithEmbeddings.length} properties with embeddings to:`);
    console.log(`   ${outputPath}`);
    
    // Generate a summary
    console.log('\n📊 Summary:');
    console.log(`   Total properties: ${propertiesWithEmbeddings.length}`);
    console.log(`   Embedding dimensions: ${propertiesWithEmbeddings[0].embedding.length}`);
    console.log(`   Average embedding generation time: ~${Math.round(1000 / MOCK_PROPERTIES.length)}ms per property`);
    
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  }
}

// Run the script
generateEmbeddings(); 