import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restingScrollY, runAction } from './actions.js';
import { LINKS } from './links.js';
import { PROFILE } from '../content.js';

// A stand-in page toolbox that records what Pip asked it to do.
function fakeUi(overrides = {}) {
  const calls = [];
  const rec = name => (...args) => { calls.push([name, ...args]); };
  const ui = {
    closeChat: rec('closeChat'), openMail: rec('openMail'), setTheme: rec('setTheme'), startTour: rec('startTour'),
    showArchitecture: rec('showArchitecture'), prefill: rec('prefill'),
    scrollTo: async sel => { calls.push(['scrollTo', sel]); },
    openTab: url => { calls.push(['openTab', url]); return {}; },
    copy: async text => { calls.push(['copy', text]); return true; },
    ...overrides,
  };
  return { ui, calls };
}

test("navigate_to closes the chat, scrolls to the card and shows Pip's line", async () => {
  const { ui, calls } = fakeUi();
  assert.deepEqual(await runAction({ name: 'navigate_to', args: { target: 'project:maira' }, say: "Here's MAIRA!" }, ui), { text: "Here's MAIRA!" });
  assert.deepEqual(calls, [['closeChat'], ['scrollTo', '#project-maira']]);
});

test('unknown targets, links, themes and actions do nothing at all', async () => {
  const { ui, calls } = fakeUi();
  for (const a of [
    { name: 'navigate_to', args: { target: 'section:admin' } },
    { name: 'open_link', args: { link: 'https://evil.example' } },
    { name: 'show_architecture', args: { project: 'nope' } },
    { name: 'set_theme', args: { theme: 'neon' } },
    { name: 'delete_everything', args: {} },
  ]) assert.equal(await runAction(a, ui), null, a.name);
  assert.deepEqual(calls, []);
});

test('a blocked popup becomes a tap-to-open button instead of a false "opened"', async () => {
  const { ui } = fakeUi({ openTab: () => null });
  assert.deepEqual(await runAction({ name: 'open_link', args: { link: 'linkedin' }, say: 'Opening LinkedIn!' }, ui),
    { text: 'Your browser blocked the new tab.', button: { label: 'Open it ↗', href: LINKS.linkedin } });
});

test('the email link opens the mail app, not a tab', async () => {
  const { ui, calls } = fakeUi();
  await runAction({ name: 'open_link', args: { link: 'email' }, say: '' }, ui);
  assert.deepEqual(calls, [['openMail', `mailto:${PROFILE.email}`]]);
});

test('a blocked clipboard shows the email with a Copy button', async () => {
  const { ui } = fakeUi({ copy: async () => false });
  assert.deepEqual(await runAction({ name: 'copy_email', args: {}, say: 'Copied!' }, ui), { text: PROFILE.email, button: { label: 'Copy', copy: PROFILE.email } });
});

test('prefill_contact scrolls to the form, fills it, and never sends', async () => {
  const { ui, calls } = fakeUi();
  await runAction({ name: 'prefill_contact', args: { message: 'Hi!', email: 'sam@example.com' }, say: 'Ready!' }, ui);
  assert.deepEqual(calls, [['closeChat'], ['scrollTo', '#contact'], ['prefill', { name: undefined, email: 'sam@example.com', message: 'Hi!' }]]);
});

test('show_architecture waits for the scroll before opening the diagram', async () => {
  const { ui, calls } = fakeUi();
  await runAction({ name: 'show_architecture', args: { project: 'receipts' }, say: '' }, ui);
  assert.deepEqual(calls, [['closeChat'], ['scrollTo', '#project-receipts'], ['showArchitecture', 'receipts']]);
});

test('without a say line Pip still says something', async () => {
  const { ui } = fakeUi();
  assert.deepEqual(await runAction({ name: 'set_theme', args: { theme: 'midnight' } }, ui), { text: 'Switched to midnight!' });
});

test('a sticky card is scrolled to where it rests in the stack, not where it is stuck', () => {
  const [a, b, c] = [700, 760, 680].map(h => ({ offsetHeight: h }));
  const stack = { children: [a, b, c], getBoundingClientRect: () => ({ top: 100 }) };
  for (const card of [a, b, c]) card.parentElement = stack;
  const win = { scrollY: 3000, getComputedStyle: el => (el === stack ? { rowGap: '28px' } : { top: '124px' }) };
  assert.equal(restingScrollY(a, win), 3000 + 100 - 124);
  assert.equal(restingScrollY(c, win), 3000 + 100 + 700 + 28 + 760 + 28 - 124);
});
