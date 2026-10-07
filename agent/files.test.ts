import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOCS, FILE_INDEX, seedFiles } from './files.ts';
import { EDUCATION, EXPERIENCE, PROFILE, PROJECTS } from '../src/content.js';

test('one file per project and job, plus the fixed pages', () => {
  const expected = ['/about.md', '/certifications.md', '/contact.md', '/education.md',
    ...PROJECTS.map((p: { id: string }) => `/projects/${p.id}.md`),
    ...EXPERIENCE.map((j: { id: string }) => `/experience/${j.id}.md`)];
  assert.deepEqual(Object.keys(DOCS).sort(), expected.sort());
});

test('files carry the facts visitors ask about', () => {
  assert.ok(DOCS['/education.md'].text.includes(EDUCATION[0].detail));
  assert.ok(DOCS['/projects/receipts.md'].text.includes(PROJECTS[1].result));
  assert.ok(DOCS['/contact.md'].text.includes(PROFILE.email));
  assert.match(DOCS['/projects/maira.md'].text, /open_link "code:maira"/);
  assert.match(DOCS['/experience/allcognix-intern.md'].text, /open_link "product:vantrex"/);
});

test('the prompt index lists every file exactly once', () => {
  for (const path of Object.keys(DOCS)) assert.equal(FILE_INDEX.split(`- ${path}:`).length - 1, 1, path);
});

test('seeded files use the v2 text format deepagents reads', () => {
  const f = seedFiles()['/about.md'];
  assert.equal(f.mimeType, 'text/markdown');
  assert.equal(typeof f.content, 'string');
  assert.ok(!Number.isNaN(Date.parse(f.created_at)));
});
