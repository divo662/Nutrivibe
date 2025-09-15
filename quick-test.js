#!/usr/bin/env node

/**
 * Quick Test Script for Groq API
 * Simple test to verify API connection works
 */

const API_KEY = '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';
const BASE_URL = 'https://api.groq.com/openai/v1';
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function quickTest() {
  console.log('🚀 Quick Groq API Test for NutriVibe');
  console.log('='.repeat(50));
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`🤖 Model: ${MODEL}`);
  console.log('='.repeat(50));

  try {
    console.log('⏳ Testing API connection...');
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: "Hello! I'm testing the Groq API for a Nigerian nutrition app called NutriVibe. Can you give me a brief greeting and tell me one interesting fact about Nigerian cuisine?"
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      console.log('✅ API connection successful!');
      console.log('📝 Response:');
      console.log('─'.repeat(50));
      console.log(data.choices[0].message.content);
      console.log('─'.repeat(50));
      
      if (data.usage) {
        console.log(`📊 Tokens used: ${data.usage.total_tokens}`);
        console.log(`💰 Estimated cost: $${(data.usage.total_tokens * 0.0000005).toFixed(6)}`);
      }
      
      console.log('\n🎯 Ready to run full test suite!');
      console.log('Run: node test-groq-ai.js');
      
    } else {
      console.log('❌ Unexpected response format:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 Tip: Check if your API key is valid');
    } else if (error.message.includes('429')) {
      console.log('💡 Tip: You might have hit rate limits');
    } else if (error.message.includes('fetch')) {
      console.log('💡 Tip: Make sure you have internet connection');
    }
  }
}

// Run the test
quickTest();
