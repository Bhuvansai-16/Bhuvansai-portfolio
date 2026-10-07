import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE } from '../content.js';
import { sendContactMessage } from './contact.js';

test('email sending validates the reviewed draft and posts it to Formspree', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (...args) => { request = args; return { ok: true }; };

  try {
    await assert.rejects(sendContactMessage({ name: '', email: 'bad', message: 'Hi' }));
    assert.equal(request, undefined);

    const draft = { name: 'Sam', email: 'sam@example.com', message: 'I would like to discuss an AI project.' };
    await sendContactMessage(draft);
    assert.equal(request[0], PROFILE.formEndpoint);
    assert.deepEqual(JSON.parse(request[1].body), draft);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
