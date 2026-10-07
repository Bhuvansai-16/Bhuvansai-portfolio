import { SKILLS } from '../content';
import { Icon } from './ui';

const PILL = { a: '#C9BEFF', b: '#D6F57A', c: '#A8E1FF', d: '#FFB3D6' };
const half = Math.ceil(SKILLS.length / 2);
const ROWS = [SKILLS.slice(0, half), SKILLS.slice(half).concat(SKILLS.slice(0, 3))];

export default function Marquee() {
  return (
    <section className="marquee" aria-label="Skills" id="skills">
      {ROWS.map((list, r) => (
        <div className="mq-row" data-dir={r ? -1 : 1} key={r}>
          {[0, 1].flatMap(k => list.map((s, i) => (
            <span className={`pill${k ? ' mq-copy' : ''}`} style={{ '--p': PILL[s.g] }} aria-hidden="true" key={`${k}-${i}`}><i><Icon id="plane" size={13} /></i>{s.name}</span>
          )))}
        </div>
      ))}
      <ul className="sr-list">{SKILLS.map(s => <li key={s.name}>{s.name}</li>)}</ul>
    </section>
  );
}
