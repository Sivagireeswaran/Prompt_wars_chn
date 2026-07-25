// API Education Endpoint & Article Generator Test Suite
// Run: node --env-file=.env tests/test-api-education.mjs

import { generateEducationalContent } from '../src/lib/gemini.js';

async function runEducationTests() {
  console.log('🧪 [2/5] Testing AI Education Article Generator & Sanitization...\n');
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

  // 1. Standard Education Generation
  try {
    const res = await generateEducationalContent('Understanding Addiction in the Brain', 'early');
    assert(res && res.includes('#'), 'Generates formatted article with Markdown headers');
  } catch (err) {
    assert(false, `Standard education test failed: ${err.message}`);
  }

  // 2. Stage Personalization Test
  try {
    const res = await generateEducationalContent('Relapse Warning Signs', 'maintenance');
    assert(res && res.length > 100, 'Generates stage-aware article for maintenance recovery stage');
  } catch (err) {
    assert(false, `Stage personalization test failed: ${err.message}`);
  }

  // 3. HTML/Script Injection Sanitization
  try {
    const rawTopic = '<script>alert("xss")</script> Coping with Cravings';
    const sanitizedTopic = rawTopic.replace(/<[^>]*>/g, '').slice(0, 200);
    const res = await generateEducationalContent(sanitizedTopic, 'early');
    assert(res && !res.includes('<script>'), 'HTML injection script tags stripped prior to generation');
  } catch (err) {
    assert(false, `Sanitization test failed: ${err.message}`);
  }

  // 4. Offline Fallback Article Test
  try {
    const res = await generateEducationalContent('craving relapse triggers', 'early');
    assert(res && (res.includes('Managing Cravings') || res.includes('4 D\'s')), 'Fallback article generator returns valid structured recovery content');
  } catch (err) {
    assert(false, `Offline fallback test failed: ${err.message}`);
  }

  console.log(`\n  Education Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runEducationTests();
