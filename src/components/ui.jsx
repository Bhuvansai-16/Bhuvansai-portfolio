import { Fragment } from 'react';

// SVG symbols used across the page (<use href="#plane"/> etc.)
export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="plane" viewBox="0 0 24 24"><path d="M22 12 2 3l6 9-6 9z" fill="currentColor" /><path d="M8 12h8" style={{ stroke: 'var(--bg)' }} strokeWidth="1.6" strokeLinecap="round" /></symbol>
      <symbol id="check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></symbol>
      <symbol id="pin" viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="10" r="2.5" fill="currentColor" /></symbol>
      <symbol id="arrow" viewBox="0 0 20 20"><path d="M4 10h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></symbol>
    </svg>
  );
}

export const Icon = ({ id, size = 18, ...rest }) => <svg width={size} height={size} {...rest}><use href={`#${id}`} /></svg>;

// Heading split into masked words so they can rise in (see App's shared motion).
export function SplitWords({ as: Tag = 'h2', text, ...rest }) {
  return (
    <Tag data-split="" aria-label={text} {...rest}>
      {text.split(/\s+/).map((w, i) => (
        <Fragment key={i}>{i > 0 && ' '}<span className="word" aria-hidden="true"><span>{w}</span></span></Fragment>
      ))}
    </Tag>
  );
}
