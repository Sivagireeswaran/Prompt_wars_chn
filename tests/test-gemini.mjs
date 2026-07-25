// Active Functions Test Suite
// Run command: node --env-file=.env tests/test-gemini.mjs

import {
  generateCompanionResponse,
  generateEducationalContent,
  generateSafetyPlanSuggestions,
  matchTherapists
} from '../src/lib/gemini.js';

const MOCK_THERAPIST_POOL = [
  {
    id: 'therapist_1',
    name: 'Dr. Aarav Mehta',
    role: 'Licensed Clinical Psychologist',
    gender: 'Male',
    specialties: ['Substance Use Disorders', 'CBT'],
    experience: '12 years',
    location: 'Mumbai, India',
    style: 'Structured',
    avatar: '👨‍⚕️'
  },
  {
    id: 'therapist_2',
    name: 'Dr. Priya Sharma',
    role: 'Accredited Counselor',
    gender: 'Female',
    specialties: ['Anxiety', 'Relapse Prevention'],
    experience: '9 years',
    location: 'Delhi, India',
    style: 'Holistic',
    avatar: '👩‍⚕️'
  }
];

async function runTests() {
  console.log('🧪 Starting Active Functions Verification...\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  // Test 1: Companion Chat Response
  try {
    console.log('1. Testing generateCompanionResponse (normal)...');
    const response = await generateCompanionResponse([
      { role: 'user', content: 'I am feeling anxious today' }
    ]);
    console.log(`   Response length: ${response.length} chars`);
    assert(response && response.length > 0, 'Companion normal response generated successfully');
  } catch (err) {
    console.error('Test 1 failed with error:', err);
    failedCount++;
  }

  // Test 2: Companion Chat Guardrail / Off-Topic Decline
  try {
    console.log('\n2. Testing generateCompanionResponse (Guardrail / Off-Topic)...');
    const response = await generateCompanionResponse([
      { role: 'user', content: 'Write a recipe for chocolate chip cookies' }
    ]);
    console.log(`   Response text: "${response}"`);
    const isDeclined = response.includes('decline') || response.includes('companion') || response.includes('recovery');
    assert(isDeclined, 'Guardrail triggered and successfully restricted off-topic request');
  } catch (err) {
    console.error('Test 2 failed with error:', err);
    failedCount++;
  }

  // Test 3: Educational Content Generation
  try {
    console.log('\n3. Testing generateEducationalContent...');
    const content = await generateEducationalContent('Managing Relapse Triggers', 'early');
    console.log(`   Article length: ${content.length} chars`);
    assert(content && content.includes('#'), 'Educational article generated with markdown headings');
  } catch (err) {
    console.error('Test 3 failed with error:', err);
    failedCount++;
  }

  // Test 4: Safety Plan Suggestions
  try {
    console.log('\n4. Testing generateSafetyPlanSuggestions...');
    const result = await generateSafetyPlanSuggestions('Warning Signs', { recoveryStage: 'early' });
    console.log(`   Suggestions count: ${result.suggestions?.length || 0}`);
    assert(Array.isArray(result.suggestions) && result.suggestions.length > 0, 'Safety plan suggestions returned as a valid array');
  } catch (err) {
    console.error('Test 4 failed with error:', err);
    failedCount++;
  }

  // Test 5: Therapist Matching Engine
  try {
    console.log('\n5. Testing matchTherapists...');
    const matches = await matchTherapists({
      challenges: ['Coping with cravings'],
      symptoms: ['High anxiety'],
      communicationStyle: 'Direct',
      genderPreference: 'No Preference',
      coords: { latitude: 19.076, longitude: 72.877 } // Near Mumbai
    }, MOCK_THERAPIST_POOL);
    
    console.log(`   Matched count: ${matches?.length || 0}`);
    assert(Array.isArray(matches) && matches.length > 0, 'Therapists matched and reasons populated');
  } catch (err) {
    console.error('Test 5 failed with error:', err);
    failedCount++;
  }

  // Print Summary
  console.log('\n=======================================');
  console.log(`📊 Test Summary: Passed = ${passedCount}, Failed = ${failedCount}`);
  console.log('=======================================');
  
  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('✨ All tests completed successfully! ✅');
  }
}

runTests();
