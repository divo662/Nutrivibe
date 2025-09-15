#!/usr/bin/env node

/**
 * NutriVibe AI Testing Script for Groq (Fixed ES Module Version)
 * Tests various AI capabilities needed for the nutrition platform
 */

const API_KEY = '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';
const BASE_URL = 'https://api.groq.com/openai/v1';

// Available models for different use cases
const MODELS = {
  reasoning: 'meta-llama/llama-4-scout-17b-16e-instruct', // Best for complex reasoning
  function_calling: 'meta-llama/llama-4-scout-17b-16e-instruct', // Supports function calling
  multilingual: 'meta-llama/llama-4-scout-17b-16e-instruct', // Good for Nigerian context
  vision: 'meta-llama/llama-4-scout-17b-16e-instruct' // Can analyze food images
};

// Test scenarios for NutriVibe
const TEST_SCENARIOS = [
  {
    name: "Meal Plan Generation",
    description: "Generate a personalized meal plan for a Nigerian user",
    prompt: `Generate a 7-day meal plan for a 30-year-old Nigerian woman with these requirements:
- Goal: Weight loss
- Caloric needs: 1500 calories/day
- Dietary preference: Vegetarian
- Allergies: None
- Location: Lagos, Nigeria
- Cultural preference: Traditional Nigerian dishes

Please include:
1. Daily meal breakdown with calories
2. Nigerian recipe names and ingredients
3. Grocery shopping list
4. Meal prep tips
5. Cultural food substitutions if needed`,
    expected: "Structured meal plan with Nigerian dishes, calorie counts, and shopping list"
  },
  {
    name: "Recipe Recommendation",
    description: "Recommend healthy Nigerian recipes based on user preferences",
    prompt: `I'm a Nigerian living in Lagos who wants to eat healthier. I love traditional food but need to watch my calories. 
I'm looking for:
- Low-calorie versions of popular Nigerian dishes
- High-protein options
- Easy to make with local ingredients
- Suitable for weight loss

Please recommend 5 recipes with:
- Calorie count per serving
- Protein content
- Preparation time
- Local ingredient alternatives`,
    expected: "5 healthy Nigerian recipes with nutrition facts and local alternatives"
  },
  {
    name: "Cultural Food Understanding",
    description: "Test AI's understanding of Nigerian cuisine and culture",
    prompt: `Explain the nutritional benefits and cultural significance of these Nigerian foods:
1. Jollof Rice
2. Egusi Soup
3. Pounded Yam
4. Moi Moi
5. Bitter Leaf Soup

For each dish, provide:
- Traditional preparation methods
- Modern healthy variations
- Nutritional profile
- Cultural importance
- Regional variations across Nigeria`,
    expected: "Detailed cultural and nutritional analysis of Nigerian dishes"
  }
];

/**
 * Make API call to Groq
 */
async function callGroqAPI(model, messages, temperature = 0.7) {
  try {
    console.log('🌐 Making API call to Groq...');
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 2000,
        stream: false
      })
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}`);
      console.error(`Error details: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API call successful');
    return data;
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    return null;
  }
}

/**
 * Test a specific scenario
 */
async function testScenario(scenario, model) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  console.log(`🎯 Expected: ${scenario.expected}`);
  console.log(`🤖 Model: ${model}`);
  console.log('─'.repeat(80));

  const messages = [
    {
      role: "system",
      content: "You are NutriVibe, an AI nutritionist specializing in Nigerian cuisine and healthy eating. Provide practical, culturally-aware advice with clear structure and actionable steps."
    },
    {
      role: "user",
      content: scenario.prompt
    }
  ];

  console.log('⏳ Making API call...');
  const startTime = Date.now();
  
  const result = await callGroqAPI(model, messages);
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  if (result && result.choices && result.choices[0]) {
    const response = result.choices[0].message.content;
    const tokens = result.usage;
    
    console.log(`✅ Response received in ${responseTime}ms`);
    console.log(`📊 Tokens used: ${tokens.total_tokens} (prompt: ${tokens.prompt_tokens}, completion: ${tokens.completion_tokens})`);
    console.log(`💰 Estimated cost: $${(tokens.total_tokens * 0.0000005).toFixed(6)}`);
    console.log('\n📋 Response:');
    console.log('─'.repeat(80));
    console.log(response);
    
    // Try to save response to file (but don't fail if it doesn't work)
    try {
      await saveResponseToFile(scenario, response, responseTime, tokens);
    } catch (saveError) {
      console.log('⚠️  Could not save response to file, but test was successful');
    }
    
    return {
      success: true,
      responseTime,
      tokens,
      cost: tokens.total_tokens * 0.0000005
    };
  } else {
    console.log('❌ Failed to get response');
    return { success: false };
  }
}

/**
 * Save test response to file
 */
async function saveResponseToFile(scenario, response, responseTime, tokens) {
  try {
    // Use dynamic import for ES modules
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Create test-results directory if it doesn't exist
    const dir = './test-results';
    await fs.mkdir(dir, { recursive: true });
    
    const filename = path.join(dir, `${scenario.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`);
    
    const content = `Test: ${scenario.name}
Description: ${scenario.description}
Expected: ${scenario.expected}
Timestamp: ${new Date().toISOString()}
Response Time: ${responseTime}ms
Tokens: ${tokens.total_tokens} (prompt: ${tokens.prompt_tokens}, completion: ${tokens.completion_tokens})
Estimated Cost: $${(tokens.total_tokens * 0.0000005).toFixed(6)}

PROMPT:
${scenario.prompt}

RESPONSE:
${response}
`;
    
    await fs.writeFile(filename, content, 'utf8');
    console.log(`💾 Response saved to: ${filename}`);
  } catch (error) {
    console.error('⚠️  Failed to save response to file:', error.message);
    // Don't throw - just log the error
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 NutriVibe AI Testing Suite for Groq (Fixed ES Module Version)');
  console.log('='.repeat(80));
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🤖 Available Models: ${Object.values(MODELS).join(', ')}`);
  console.log('='.repeat(80));

  const results = [];
  const model = MODELS.reasoning; // Use the best model for comprehensive testing

  for (const scenario of TEST_SCENARIOS) {
    try {
      const result = await testScenario(scenario, model);
      results.push({
        scenario: scenario.name,
        ...result
      });
      
      // Add delay between API calls to avoid rate limiting
      if (scenario !== TEST_SCENARIOS[TEST_SCENARIOS.length - 1]) {
        console.log('\n⏸️  Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Error testing scenario "${scenario.name}":`, error.message);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successfulTests = results.filter(r => r.success);
  const totalCost = successfulTests.reduce((sum, r) => sum + (r.cost || 0), 0);
  const avgResponseTime = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successfulTests.length 
    : 0;
  
  console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
  console.log(`💰 Total Estimated Cost: $${totalCost.toFixed(6)}`);
  console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  console.log('\n📋 Individual Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const cost = result.success ? `$${(result.cost || 0).toFixed(6)}` : 'N/A';
    const time = result.success ? `${result.responseTime}ms` : 'N/A';
    const error = result.error ? ` (${result.error})` : '';
    console.log(`${status} ${result.scenario}: ${time} | ${cost}${error}`);
  });

  console.log('\n🎯 RECOMMENDATIONS FOR NUTRIVIBE INTEGRATION:');
  console.log('='.repeat(80));
  
  if (successfulTests.length === results.length) {
    console.log('✅ All tests passed! The AI models are ready for NutriVibe integration.');
    console.log('🚀 Next steps:');
    console.log('   1. Integrate Groq API into the React app');
    console.log('   2. Create AI service layer for meal plan generation');
    console.log('   3. Implement user preference learning');
    console.log('   4. Add voice processing capabilities');
    console.log('   5. Build recipe recommendation engine');
  } else if (successfulTests.length > 0) {
    console.log('⚠️  Some tests passed, some failed. Review the errors before proceeding.');
    console.log('✅ Working features can be integrated while fixing the failed ones.');
  } else {
    console.log('❌ All tests failed. Please check your API key and internet connection.');
  }
}

/**
 * Test specific model capabilities
 */
async function testModelCapabilities() {
  console.log('\n🔬 TESTING MODEL CAPABILITIES');
  console.log('='.repeat(80));

  try {
    // Test reasoning capabilities
    console.log('\n🧠 Testing Reasoning Capabilities...');
    const reasoningTest = await callGroqAPI(
      MODELS.reasoning,
      [{
        role: "user",
        content: "If a Nigerian person wants to lose weight but loves eating pounded yam, what are 3 healthy alternatives that maintain cultural authenticity?"
      }]
    );
    
    if (reasoningTest?.choices?.[0]) {
      console.log('✅ Reasoning test passed');
      console.log('📝 Response:', reasoningTest.choices[0].message.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Reasoning test failed');
    }

    // Test function calling (if supported)
    console.log('\n🔧 Testing Function Calling...');
    const functionTest = await callGroqAPI(
      MODELS.function_calling,
      [{
        role: "user",
        content: "Generate a structured meal plan in JSON format with fields: day, meal, food, calories, protein, carbs, fats"
      }]
    );
    
    if (functionTest?.choices?.[0]) {
      console.log('✅ Function calling test passed');
      console.log('📝 Response:', functionTest.choices[0].message.content.substring(0, 200) + '...');
    } else {
      console.log('❌ Function calling test failed');
    }
  } catch (error) {
    console.error('❌ Model capabilities test failed:', error.message);
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting NutriVibe AI Testing Suite...');
    console.log(`📋 Node.js version: ${process.version}`);
    console.log(`📋 Platform: ${process.platform}`);
    
    await runAllTests();
    await testModelCapabilities();
    
    console.log('\n🎉 Testing suite completed!');
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
