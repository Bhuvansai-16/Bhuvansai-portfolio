import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerLocal } from './kb.js';
import { KB } from '../content.js';

test('a question about location finds the about answer', () => {
  const a = answerLocal('where is he based?');
  assert.equal(a.hit, true);
  assert.ok(a.src.includes('about'));
});

test('gibberish gets the polite default, not a random answer', () => {
  assert.equal(answerLocal('qwzx vbnm plkj').hit, false);
});

test('a command with no matching topic gets the default, not a wrong answer', () => {
  assert.equal(answerLocal('switch to grape mode').hit, false); // scored 0.23 against the projects answer
});

test('real topics still match offline', () => {
  for (const [q, src] of [['what are his skills', 'skills'], ['show me projects', 'work'], ['which certifications does he have', 'certifications']]) assert.ok(answerLocal(q).src.includes(src), q);
});

test('no offline answer still contains a [placeholder]', () => {
  for (const k of KB) assert.doesNotMatch(k.a, /\[[^\]]+\]/, k.t);
});

test('greetings get a warm, friendly response in character', () => {
  for (const q of ['Hello pip!', 'hi', 'hey pip', 'good morning', 'hello']) {
    const a = answerLocal(q);
    assert.equal(a.hit, true, `greeting failed for: ${q}`);
    assert.match(a.text, /Pip/i, `should mention Pip for: ${q}`);
    assert.ok(a.src.length > 0, `should provide suggested sections for: ${q}`);
  }
});

test('a greeting with a specific topic query still matches the topic', () => {
  const a = answerLocal('hey pip, what are your skills?');
  assert.equal(a.hit, true);
  assert.ok(a.src.includes('skills'));
});

