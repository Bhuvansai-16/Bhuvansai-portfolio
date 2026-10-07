import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PROFILE } from '../content';
import { Icon } from './ui';

const LINKS = [['about', 'About'], ['work', 'Work'], ['experience', 'Experience'], ['education', 'Education']];
const MOBILE_LINKS = [['about', 'About'], ['work', 'Work'], ['github', 'Shipping'], ['experience', 'Experience'], ['education', 'Education'], ['certifications', 'Checks'], ['contact', 'Contact']];
const THEMES = [['daylight', '#F4F4F6', 'Daylight'], ['midnight', '#0A0A0F', 'Midnight'], ['citrus', '#DDF84A', 'Citrus'], ['grape', '#3B1FD6', 'Grape']];

export default function Nav({ active, theme, onTheme, onPalette }) {
  const [hidden, setHidden] = useState(false);
  const [atHero, setAtHero] = useState(true);
  const links = useRef({}), pill = useRef(null), menu = useRef(null);

  // hide on scroll down, show on scroll up
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = scrollY;
      setHidden(y > last && y > 240);
      setAtHero(document.getElementById('top')?.getBoundingClientRect().bottom > 0);
      last = y;
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, []);

  useEffect(() => {
    const closeOutside = e => { if (menu.current?.open && !menu.current.contains(e.target)) menu.current.open = false; };
    const closeEscape = e => { if (e.key === 'Escape' && menu.current?.open) menu.current.open = false; };
    addEventListener('pointerdown', closeOutside);
    addEventListener('keydown', closeEscape);
    return () => { removeEventListener('pointerdown', closeOutside); removeEventListener('keydown', closeEscape); };
  }, []);

  // sliding pill under the active section's link
  useLayoutEffect(() => {
    const a = links.current[atHero ? '' : active], p = pill.current;
    if (!a?.offsetWidth) { p.style.opacity = 0; return; }
    p.style.opacity = 1;
    p.style.width = a.offsetWidth + 'px';
    p.style.transform = `translateX(${a.offsetLeft}px)`;
  }, [active, atHero]);

  const closeMenu = e => { e.currentTarget.closest('details').open = false; };

  return (
    <header className={`nav${hidden ? ' hide' : ''}`} id="nav">
      <a className="logo" href="#top" aria-label={`${PROFILE.name}, home`}><span className="logo-mark"><Icon id="plane" size={16} /></span>{PROFILE.name}</a>
      <nav className="nav-links" aria-label="Primary">
        {LINKS.map(([id, label]) => (
          <a key={id} href={`#${id}`} ref={el => (links.current[id] = el)} aria-current={!atHero && active === id ? 'location' : undefined}>{label}</a>
        ))}
        <span className="nav-pill" ref={pill} aria-hidden="true" />
      </nav>
      <details className="mobile-menu" data-lenis-prevent ref={menu}>
        <summary aria-label="Open navigation menu" title="Menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
        </summary>
        <nav aria-label="Mobile sections">
          {MOBILE_LINKS.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={!atHero && active === id ? 'location' : undefined} onClick={closeMenu}>{label}</a>)}
          <div className="mobile-theme">
            <span>Theme</span>
            <div role="group" aria-label="Theme">
              {THEMES.map(([t, sw, label]) => <button key={t} type="button" data-t={t} style={{ '--sw': sw }} aria-label={`${label} theme`} title={label} aria-pressed={theme === t} onClick={e => { onTheme(t, e.currentTarget); closeMenu(e); }} />)}
            </div>
          </div>
        </nav>
      </details>
      <div className="themes" id="themes" role="group" aria-label="Theme">
        {THEMES.map(([t, sw, label]) => (
          <button key={t} type="button" data-t={t} style={{ '--sw': sw }} aria-label={`${label} theme`} title={label} aria-pressed={theme === t} onClick={e => onTheme(t, e.currentTarget)} />
        ))}
      </div>
      <button className="nav-icon" id="paletteBtn" type="button" aria-label="Open command menu (Ctrl K)" onClick={onPalette}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="5.5" /><path d="m13.5 13.5 4 4" /></svg>
      </button>
      <a className="btn dark sm" href="#contact" data-magnet>Let's talk</a>
    </header>
  );
}
