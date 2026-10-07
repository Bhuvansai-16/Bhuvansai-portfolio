// The page's toolbox for Pip's actions: scroll, open, theme, tour, diagram, contact form, clipboard.
import { scroller, scrollToEl } from './motion';
import { restingScrollY } from './actions';
import { sendContactMessage } from './contact';

const heading = el => (el.matches('h1, h2, h3') ? el : el.querySelector('h1, h2, h3'));
const fill = (selector, value) => { const field = document.querySelector(selector); if (field && value) field.value = value; };

export function pageUi({ setChatOpen, pickTheme, startTour }) {
  return {
    closeChat() {
      setChatOpen(false);
      scroller.lenis?.start(); // the open chat stops Lenis; restart it before this action scrolls
    },
    async scrollTo(selector) {
      const el = document.querySelector(selector);
      if (!el) return;
      const sticky = getComputedStyle(el).position === 'sticky';
      await scrollToEl(sticky ? restingScrollY(el) : el, sticky || el.matches('section') ? 0 : -110);
      const h = heading(el);
      if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } // keyboard users land where Pip took them
    },
    // 'noopener' as a window feature makes open() return null even when the tab opens, so drop the opener by hand
    openTab(url) {
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      return win;
    },
    openMail(url) { location.href = url; },
    setTheme: theme => pickTheme(theme),
    startTour: () => startTour(null),
    showArchitecture: project => dispatchEvent(new CustomEvent('pip:architecture', { detail: { project } })),
    prefill({ name, email, message }) {
      fill('#cName', name);
      fill('#cEmail', email);
      fill('#cMsg', message);
      document.querySelector('#cMsg')?.focus({ preventScroll: true });
    },
    sendEmail: draft => sendContactMessage(draft),
    copy: text => (navigator.clipboard ? navigator.clipboard.writeText(text).then(() => true, () => false) : Promise.resolve(false)),
  };
}
