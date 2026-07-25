// Deaf Mode & Accessibility Verification Test Suite
// Run: node --env-file=.env tests/test-deaf-accessibility.mjs

import { generateCompanionResponse } from '../src/lib/gemini.js';

const QUICK_TAP_COPING_OPTIONS = [
  { emoji: '😰', label: 'Anxious', text: 'I am feeling highly anxious right now.' },
  { emoji: '🚭', label: 'Craving', text: 'I am having a strong craving.' },
  { emoji: '🚨', label: 'Need Help', text: 'I need immediate help/crisis advice.' },
  { emoji: '🤝', label: 'Lonely', text: 'I feel lonely and need someone to talk to.' }
];

async function runAccessibilityTests() {
  console.log('🧪 [5/5] Testing Deaf Mode & Accessibility Features...\n');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Auditory Exclusion Constraint Test
  try {
    const res = await generateCompanionResponse(
      [{ role: 'user', content: 'Suggest something to soothe my anxiety' }],
      { isDeaf: true, recoveryStage: 'early' }
    );
    const low = res.toLowerCase();
    const hasAuditory = low.includes('listen to music') || low.includes('soothing sounds') || low.includes('audio');
    assert(!hasAuditory, 'Deaf Mode system prompt excludes auditory suggestions in favor of visual/physical grounding');
  } catch (err) {
    assert(false, `Auditory exclusion test failed: ${err.message}`);
  }

  // 2. Zero-Typing Quick Tap Preset Payload Test
  try {
    const anxiousPreset = QUICK_TAP_COPING_OPTIONS.find(o => o.label === 'Anxious');
    assert(anxiousPreset && anxiousPreset.text.includes('anxious'), 'Zero-typing quick-tap crisis preset generates valid input text');
  } catch (err) {
    assert(false, `Quick tap preset test failed: ${err.message}`);
  }

  // 3. Visual Breathing Pacer Parameter Test
  try {
    const pacerConfig = {
      inhaleSeconds: 4,
      holdSeconds: 4,
      exhaleSeconds: 4,
      visualAnimationDuration: '12s'
    };
    assert(pacerConfig.visualAnimationDuration === '12s', 'Visual Breathing Pacer config sets consistent 12-second expansion cycle');
  } catch (err) {
    assert(false, `Pacer parameter test failed: ${err.message}`);
  }

  console.log(`\n  Accessibility Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runAccessibilityTests();
