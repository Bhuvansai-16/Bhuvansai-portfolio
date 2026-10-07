// What each of Pip's page actions does. `ui` is the page's toolbox (src/lib/page.js); this file only
// decides which tools to call and what Pip says, so it runs without a browser in tests.
import { PROFILE } from '../content.js';
import { LINKS, TARGETS, THEMES } from './links.js';

export async function runAction({ name, args = {}, say }, ui) {
  const line = fallback => ({ text: say || fallback });
  switch (name) {
    case 'navigate_to':
      if (!TARGETS[args.target]) return null;
      ui.closeChat();
      ui.scrollTo(TARGETS[args.target]);
      return line('Here it is!');
    case 'open_link': {
      const url = LINKS[args.link];
      if (!url) return null;
      if (url.startsWith('mailto:')) { ui.openMail(url); return line('Opening your email app.'); }
      return ui.openTab(url) ? line('Opened it in a new tab!') : { text: 'Your browser blocked the new tab.', button: { label: 'Open it ↗', href: url } };
    }
    case 'show_architecture':
      if (!TARGETS[`project:${args.project}`]) return null;
      ui.closeChat();
      await ui.scrollTo(TARGETS[`project:${args.project}`]);
      ui.showArchitecture(args.project);
      return line('Here is how it works!');
    case 'set_theme':
      if (!THEMES.includes(args.theme)) return null;
      ui.setTheme(args.theme);
      return line(`Switched to ${args.theme}!`);
    case 'start_tour':
      ui.closeChat();
      ui.startTour();
      return line('Buckle up!');
    case 'prefill_contact':
      ui.closeChat();
      await ui.scrollTo('#contact');
      ui.prefill({ name: args.name, email: args.email, message: String(args.message ?? '') });
      return line('Your message is ready. Just press Send!');
    case 'copy_email':
      return (await ui.copy(PROFILE.email)) ? line("Copied my boss's email!") : { text: PROFILE.email, button: { label: 'Copy', copy: PROFILE.email } };
    default:
      return null;
  }
}

// Sticky project cards report where they are stuck, not where they rest in the stack.
// Measure from the (non-sticky) stack instead: the scroll position that shows `el` at its sticky top.
export function restingScrollY(el, win = globalThis) {
  const stack = el.parentElement, gap = parseFloat(win.getComputedStyle(stack).rowGap) || 0;
  let y = stack.getBoundingClientRect().top + win.scrollY;
  for (const card of stack.children) {
    if (card === el) break;
    y += card.offsetHeight + gap;
  }
  return y - parseFloat(win.getComputedStyle(el).top);
}
