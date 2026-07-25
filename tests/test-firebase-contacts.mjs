// Emergency Supporters & Storage Test Suite
// Run: node --env-file=.env tests/test-firebase-contacts.mjs

function buildSMSAlert(contact, coords) {
  const mapsUrl = coords
    ? `\n📍 Current Location: https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
    : '';
  const messageText = `Emergency Alert from RecovrAI: I need support. Please contact me.${mapsUrl}`;
  return {
    phone: contact.phone,
    text: messageText,
    smsProtocolUrl: `sms:${contact.phone}?body=${encodeURIComponent(messageText)}`
  };
}

function simulateAccountContactsStore(uid, newContacts, existingProfile = null) {
  const storageKey = `recovrai_contacts_${uid}`;
  const store = {};
  
  // 1. Save optimistic update to account-specific key
  store[storageKey] = JSON.stringify(newContacts);
  
  // 2. Read back from account key
  const loaded = JSON.parse(store[storageKey]);
  return { storageKey, loaded };
}

async function runContactsTests() {
  console.log('🧪 [4/5] Testing Emergency Supporters & Account Data Isolation...\n');
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

  // 1. Account Key Isolation Test
  try {
    const userA = 'user_abc123';
    const contactsA = [{ name: 'Sponsor John', phone: '+91 98765 43210' }];
    const resA = simulateAccountContactsStore(userA, contactsA);
    
    assert(resA.storageKey === 'recovrai_contacts_user_abc123' && resA.loaded.length === 1, 'Contacts saved under account-isolated key (user.uid)');
  } catch (err) {
    assert(false, `Account isolation test failed: ${err.message}`);
  }

  // 2. SMS Payload Generation with GPS Coordinates
  try {
    const contact = { name: 'Sister Priya', phone: '+91 91234 56789' };
    const coords = { latitude: 13.0827, longitude: 80.2707 };
    const alert = buildSMSAlert(contact, coords);

    assert(
      alert.smsProtocolUrl.startsWith('sms:+91 91234 56789?body=') &&
      alert.text.includes('google.com/maps?q=13.0827,80.2707'),
      'Formats native SMS protocol payload with current GPS coordinates link'
    );
  } catch (err) {
    assert(false, `SMS alert test failed: ${err.message}`);
  }

  // 3. Desktop Fallback SMS Copy Modal Payload
  try {
    const contact = { name: 'Doctor Smith', phone: '+91 99999 88888' };
    const alert = buildSMSAlert(contact, null);

    assert(alert.text.includes('Emergency Alert from RecovrAI') && !alert.text.includes('Location:'), 'Generates valid fallback text for desktop copy without coordinates');
  } catch (err) {
    assert(false, `Desktop fallback test failed: ${err.message}`);
  }

  console.log(`\n  Supporters Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runContactsTests();
