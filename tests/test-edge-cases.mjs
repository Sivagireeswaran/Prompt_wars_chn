// Edge Cases & Sanitization Test Suite
// Run command: node --env-file=.env tests/test-edge-cases.mjs

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
  }
];

async function runEdgeCaseTests() {
  console.log('🧪 Starting Edge Cases & Safety Guardrail Verification...\n');
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

  // Edge Case 1: HTML & XSS Injection Sanitization
  try {
    console.log('1. Testing XSS/HTML Injection Sanitization...');
    const xssTopic = "<script>alert('xss')</script> Managing Cravings";
    const content = await generateEducationalContent(xssTopic, 'early');
    
    // The fallback or API should generate normal content and not execute/echo script tags
    console.log(`   Sanitized article length: ${content.length} chars`);
    assert(content && !content.includes('<script>'), 'HTML injection tag stripped or handled safely');
  } catch (err) {
    console.error('Edge Case 1 failed:', err);
    failedCount++;
  }

  // Edge Case 2: Deaf Mode Prompt Constraints (Auditory vs Visual)
  try {
    console.log('\n2. Testing Deaf Mode Auditory Bypass Constraints...');
    const response = await generateCompanionResponse(
      [{ role: 'user', content: 'I am highly anxious, please suggest something to listen to or do' }],
      { isDeaf: true, recoveryStage: 'early' }
    );
    
    console.log(`   Response text: "${response}"`);
    const containsAuditoryRecommendations = 
      response.toLowerCase().includes('listen to music') || 
      response.toLowerCase().includes('soothing sounds') || 
      response.toLowerCase().includes('auditory');
      
    assert(!containsAuditoryRecommendations, 'Deaf mode correctly bypassed auditory exercises and recommended physical/visual techniques');
  } catch (err) {
    console.error('Edge Case 2 failed:', err);
    failedCount++;
  }

  // Edge Case 3: Geolocation Match with Invalid/Missing Coordinates
  try {
    console.log('\n3. Testing Geolocation Match with Invalid Coordinates...');
    const matches = await matchTherapists({
      challenges: ['Anxiety'],
      symptoms: ['Stress'],
      communicationStyle: 'Compassionate',
      genderPreference: 'No Preference',
      // Send malformed coordinate structures
      coords: { latitude: 'not-a-number', longitude: {} }
    }, MOCK_THERAPIST_POOL);
    
    console.log(`   Matched count: ${matches?.length || 0}`);
    assert(Array.isArray(matches) && matches.length > 0, 'Malformed coordinates parsed or bypassed gracefully without engine failure');
  } catch (err) {
    console.error('Edge Case 3 failed:', err);
    failedCount++;
  }

  // Edge Case 4: Empty / Whitespace-Only input handling
  try {
    console.log('\n4. Testing Empty / Whitespace inputs...');
    const response = await generateCompanionResponse(
      [{ role: 'user', content: '    ' }],
      { isDeaf: false }
    );
    console.log(`   Response text: "${response}"`);
    assert(response && response.length > 0, 'Empty message input resolved gracefully without breaking');
  } catch (err) {
    console.error('Edge Case 4 failed:', err);
    failedCount++;
  }

  // Print Summary
  console.log('\n=======================================');
  console.log(`📊 Edge Case Summary: Passed = ${passedCount}, Failed = ${failedCount}`);
  console.log('=======================================');
  
  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('✨ All edge case tests completed successfully! ✅');
  }
}

runEdgeCaseTests();
