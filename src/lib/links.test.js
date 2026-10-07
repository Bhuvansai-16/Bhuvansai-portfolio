import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LINKS, SECTIONS, TARGETS } from './links.js';
import { EXPERIENCE, PROJECTS } from '../content.js';

test('every link is an https or mailto URL', () => {
  for (const [key, url] of Object.entries(LINKS)) assert.match(String(url), /^(https:\/\/|mailto:)/, key);
});

test('the keys the design names exist', () => {
  for (const key of ['linkedin', 'github', 'resume', 'email', 'code:maira', 'cert:aws', 'product:vantrex', 'post:geonius']) assert.ok(LINKS[key], key);
});

test('every section, project and job has a scroll target', () => {
  for (const s of SECTIONS) assert.equal(TARGETS[`section:${s}`], `#${s}`);
  for (const p of PROJECTS) assert.equal(TARGETS[`project:${p.id}`], `#project-${p.id}`);
  for (const j of EXPERIENCE) assert.equal(TARGETS[`job:${j.id}`], `#job-${j.id}`);
});

test('project ids are unique slugs', () => {
  const ids = PROJECTS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});
