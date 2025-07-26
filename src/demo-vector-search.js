import { readFile } from 'fs/promises';
import { PropertySearchEngine } from './vectorSearch.js';

/**
 * Demo script showcasing the PropertySearchEngine with WebAssembly
 */
async function demoVectorSearch() {
  console.log('🚀 PropertySearchEngine Demo - WebAssembly Vector Search\n');
  
  try {
    // Load properties with embeddings
    console.log('📄 Loading property data...');
    const propertiesData = await readFile('./data/properties-with-embeddings.json', 'utf8');
    const properties = JSON.parse(propertiesData);
    console.log(`✅ Loaded ${properties.length} properties with embeddings\n`);
    
    // Initialize the PropertySearchEngine
    console.log('🤖 Initializing PropertySearchEngine...');
    const searchEngine = new PropertySearchEngine();
    
    // Measure initialization time
    const initStart = performance.now();
    await searchEngine.initialize();
    const initTime = performance.now() - initStart;
    console.log(`✅ Initialized in ${initTime.toFixed(2)}ms\n`);
    
    // Check engine status
    const status = searchEngine.getStatus();
    console.log('📊 Engine Status:', status);
    console.log();
    
    // Demo searches with various scenarios
    const searchScenarios = [
      {
        name: "🏡 Basic Property Search",
        query: "Cozy apartment with natural light near park",
        options: { topK: 3 }
      },
      {
        name: "💰 Budget-Conscious Search",
        query: "Affordable student housing with good transportation",
        options: { 
          topK: 3,
          filters: { maxPrice: 2500 }
        }
      },
      {
        name: "🏖️ Luxury Property Search", 
        query: "Luxury penthouse with ocean views and modern amenities",
        options: {
          topK: 3,
          filters: { minPrice: 4000, requiredAmenities: ['balcony'] }
        }
      },
      {
        name: "👨‍👩‍👧‍👦 Family-Friendly Search",
        query: "Spacious family home in quiet neighborhood with parking",
        options: {
          topK: 3,
          filters: { minBedrooms: 2, minBathrooms: 2 }
        }
      },
      {
        name: "🐕 Pet-Owner Search",
        query: "Pet-friendly apartment with outdoor space",
        options: {
          topK: 3,
          filters: { requiredAmenities: ['pet friendly'] }
        }
      }
    ];
    
    // Execute search scenarios
    for (const scenario of searchScenarios) {
      await runSearchScenario(searchEngine, scenario, properties);
    }
    
    // Demo multi-search functionality
    console.log('\n' + '═'.repeat(80));
    console.log('🔍 Multi-Query Search Demo');
    console.log('═'.repeat(80));
    
    const multiQueries = [
      "modern apartment downtown",
      "close to restaurants and nightlife", 
      "good public transportation access"
    ];
    
    console.log(`\n🎯 Combining queries: ${multiQueries.map(q => `"${q}"`).join(', ')}`);
    
    const multiStart = performance.now();
    const multiResults = await searchEngine.multiSearch(multiQueries, properties, { topK: 3 });
    const multiTime = performance.now() - multiStart;
    
    console.log(`⚡ Multi-search completed in ${multiTime.toFixed(2)}ms\n`);
    
    displayResults(multiResults, "Combined Query Results");
    
    // Performance benchmark
    console.log('\n' + '═'.repeat(80));
    console.log('⚡ Performance Benchmark');
    console.log('═'.repeat(80));
    
    await performanceBenchmark(searchEngine, properties);
    
    console.log('\n✅ Demo complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  }
}

/**
 * Run a single search scenario
 */
async function runSearchScenario(searchEngine, scenario, properties) {
  console.log('\n' + '═'.repeat(80));
  console.log(scenario.name);
  console.log('═'.repeat(80));
  
  console.log(`\n🔍 Query: "${scenario.query}"`);
  
  if (scenario.options.filters) {
    console.log(`🎛️  Filters: ${JSON.stringify(scenario.options.filters)}`);
  }
  
  // Measure search time
  const searchStart = performance.now();
  const results = await searchEngine.search(scenario.query, properties, scenario.options);
  const searchTime = performance.now() - searchStart;
  
  console.log(`⚡ Search completed in ${searchTime.toFixed(2)}ms\n`);
  
  displayResults(results, `Top ${scenario.options.topK} Results`);
}

/**
 * Display search results in a formatted way
 */
function displayResults(results, title) {
  console.log(`📋 ${title}:\n`);
  
  if (results.length === 0) {
    console.log('   No results found.');
    return;
  }
  
  results.forEach((property, index) => {
    console.log(`   ${index + 1}. ${property.title}`);
    console.log(`      📍 ${property.address}`);
    console.log(`      💰 $${property.price.toLocaleString()}/month | 🛏️ ${property.bedrooms}BR/${property.bathrooms}BA`);
    console.log(`      🎯 Similarity: ${(property.similarity * 100).toFixed(1)}%`);
    console.log(`      ✨ Amenities: ${property.amenities.slice(0, 4).join(', ')}${property.amenities.length > 4 ? '...' : ''}`);
    console.log(`      📧 Contact: ${property.landlordEmail}`);
    console.log();
  });
}

/**
 * Run performance benchmarks
 */
async function performanceBenchmark(searchEngine, properties) {
  const benchmarkQueries = [
    "studio apartment with parking",
    "luxury condo with gym access", 
    "affordable housing near transit",
    "pet-friendly place with yard",
    "modern apartment downtown"
  ];
  
  console.log(`\n🏃‍♂️ Running ${benchmarkQueries.length} search queries...\n`);
  
  const times = [];
  
  for (let i = 0; i < benchmarkQueries.length; i++) {
    const query = benchmarkQueries[i];
    
    const start = performance.now();
    await searchEngine.search(query, properties, { topK: 5 });
    const time = performance.now() - start;
    
    times.push(time);
    console.log(`   Query ${i + 1}: ${time.toFixed(2)}ms - "${query}"`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log('\n📊 Performance Summary:');
  console.log(`   Average: ${avgTime.toFixed(2)}ms`);
  console.log(`   Fastest: ${minTime.toFixed(2)}ms`);
  console.log(`   Slowest: ${maxTime.toFixed(2)}ms`);
  console.log(`   Total properties: ${properties.length}`);
  console.log(`   Searches per second: ~${(1000 / avgTime).toFixed(1)}`);
}

/**
 * Interactive search function (can be called from other modules)
 */
export async function interactiveSearch(query, filters = {}) {
  const searchEngine = new PropertySearchEngine();
  await searchEngine.initialize();
  
  const propertiesData = await readFile('./data/properties-with-embeddings.json', 'utf8');
  const properties = JSON.parse(propertiesData);
  
  return await searchEngine.search(query, properties, { 
    topK: 5, 
    filters 
  });
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoVectorSearch();
} 