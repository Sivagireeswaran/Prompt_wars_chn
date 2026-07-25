// API Chat Endpoint & Companion Engine Test Suite
// Run: node --env-file=.env tests/test-api-chat.mjs

import { generateCompanionResponse } from '../src/lib/gemini.js';

async function runChatTests() {
  console.log('🧪 [1/5] Testing AI Chat Companion Engine & API Logic...\n');
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

  // 1. Normal Conversation Turn
  try {
    const res = await generateCompanionResponse([
      { role: 'user', content: 'I need coping strategies for stress' }
    ]);
    assert(res && res.length > 20, 'Generates valid companion response for coping strategies');
  } catch (err) {
    assert(false, `Normal chat failed: ${err.message}`);
  }

  // 2. Affirmative Short Turn ("yes")
  try {
    const res = await generateCompanionResponse([
      { role: 'user', content: 'I need coping strategies' },
      { role: 'assistant', content: 'Great! Here is a simple, evidence-based exercise called Box Breathing. Try one cycle right now — how does your body feel?' },
      { role: 'user', content: 'yes' }
    ]);
    assert(res && !res.includes('Recovery is a journey of small'), 'Short affirmative ("yes") returns dynamic next step instead of repeated greeting');
  } catch (err) {
    assert(false, `Affirmative turn failed: ${err.message}`);
  }

  // 3. Positive Progress Turn ("now i feel better")
  try {
    const res = await generateCompanionResponse([
      { role: 'user', content: 'I need coping strategies' },
      { role: 'assistant', content: 'Try Box Breathing: Inhale for 4s, hold for 4s, exhale for 4s. How do you feel?' },
      { role: 'user', content: 'now i feel better' }
    ]);
    assert(res && (res.includes('glad') || res.includes('better') || res.includes('calm')), 'Progress update ("now i feel better") responds with empathetic celebration');
  } catch (err) {
    assert(false, `Progress turn failed: ${err.message}`);
  }

  // 4. Off-Topic Guardrail Test
  try {
    const res = await generateCompanionResponse([
      { role: 'user', content: 'Write a Python script to scrape a website' }
    ]);
    assert(res && res.includes('recovery companion'), 'Off-topic programming request correctly blocked by domain guardrail');
  } catch (err) {
    assert(false, `Guardrail test failed: ${err.message}`);
  }

  // 5. Empty / Whitespace Input Test
  try {
    const res = await generateCompanionResponse([
      { role: 'user', content: '   ' }
    ]);
    assert(res && res.length > 0, 'Whitespace input handled gracefully without crashing');
  } catch (err) {
    assert(false, `Empty input test failed: ${err.message}`);
  }

  console.log(`\n  Chat Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runChatTests();
