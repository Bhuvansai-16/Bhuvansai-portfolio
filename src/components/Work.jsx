import { useEffect, useRef, useState } from 'react';
import { gsap, motion, useGsap } from '../lib/motion';
import { PROJECTS } from '../content';
import { SplitWords } from './ui';

// The animated pipeline drawn in each project card: boxes on a zigzag, packets running through.
function FlowDiagram({ labels, ci }) {
  const n = labels.length, W = 460, H = 300;
  const pts = labels.map((l, i) => ({ l, x: 64 + (i * (W - 128)) / (n - 1), y: (i + ci) % 2 ? 206 : 112 }));
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < n; i++) { const a = pts[i - 1], b = pts[i], mx = (a.x + b.x) / 2; d += ` C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`; }
  const dur = (n * 0.85).toFixed(2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Flow: ${labels.join(' to ')}`}>
      <text x="26" y="38" fontFamily="Geist Mono, monospace" fontSize="12" fill="#0E0E12" opacity=".6">run · {n} steps · ok</text>
      <circle cx={W - 32} cy="34" r="5" fill="#2FB344"><animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite" /></circle>
      <path className="edge" d={d} />
      {motion && <circle className="pkt" r="8"><animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} /></circle>}
      {motion && <circle className="pkt" r="5" opacity=".5"><animateMotion dur={`${dur}s`} begin={`-${(dur / 2).toFixed(2)}s`} repeatCount="indefinite" path={d} /></circle>}
      {pts.map(p => {
        const w = p.l.length * 7.8 + 30;
        return <g className="nd" key={p.l}><rect x={p.x - w / 2} y={p.y - 19} width={w} height="38" rx="12" /><text x={p.x} y={p.y + 4.5}>{p.l}</text></g>;
      })}
    </svg>
  );
}

function ArchitectureNode({ x, y, w, h, lines, detail, kind = '' }) {
  const blockHeight = lines.length * 14 + (detail ? 13 : 0);
  return (
    <g className={`architecture-node ${kind}`}>
      <rect x={x} y={y} width={w} height={h} rx="12" />
      <text x={x + w / 2} y={y + (h - blockHeight) / 2 + 11}>
        {lines.map((line, i) => <tspan key={line} x={x + w / 2} dy={i ? 14 : 0}>{line}</tspan>)}
        {detail && <tspan className="architecture-detail" x={x + w / 2} dy="13">{detail}</tspan>}
      </text>
    </g>
  );
}

function MairaDiagram({ idPrefix = '' }) {
  return (
    <svg className="maira-diagram" viewBox="0 0 780 380" role="img" aria-label="MAIRA architecture: a client sends a request through the API to the main orchestrator, which coordinates web search, academic retrieval, fact checking and citation, and report generation agents connected to Vector DB, PostgreSQL, and Redis.">
      <defs><marker id={`${idPrefix}maira-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" /></marker></defs>
      <path className="maira-link" d="M100 190h25M225 190h45" markerEnd={`url(#${idPrefix}maira-arrow)`} />
      <path className="maira-link" d="M400 190h30M430 45v285" />
      <path className="maira-link" d="M430 45h25M430 140h25M430 235h25M430 330h25" markerEnd={`url(#${idPrefix}maira-arrow)`} />
      <path className="maira-link" d="M605 45h25M605 140h12v45h13M605 235h12v-50h13M605 330h25" markerEnd={`url(#${idPrefix}maira-arrow)`} />
      {motion && <g className="maira-packets">
        {[
          ['M100 190H125', '1.2s', '0s'], ['M225 190H270', '1.2s', '-.5s'],
          ['M400 190H430V45H455', '3.2s', '-.4s'], ['M400 190H430V140H455', '3.2s', '-1.2s'],
          ['M400 190H430V235H455', '3.2s', '-.8s'], ['M400 190H430V330H455', '3.2s', '-2s'],
          ['M605 45H630', '1.2s', '-.2s'], ['M605 140H617V185H630', '1.8s', '-.9s'],
          ['M605 235H617V185H630', '1.8s', '-.4s'], ['M605 330H630', '1.2s', '-.6s'],
        ].map(([path, dur, begin], i) => <circle className="maira-packet" r="4" key={i}><animateMotion path={path} dur={dur} begin={begin} repeatCount="indefinite" /></circle>)}
      </g>}

      <ArchitectureNode x={10} y={162} w={90} h={56} lines={['User / Client']} kind="client" />
      <ArchitectureNode x={125} y={162} w={100} h={56} lines={['API Layer']} />
      <ArchitectureNode x={270} y={157} w={130} h={66} lines={['Main Agent', 'Orchestration']} kind="agent" />
      <ArchitectureNode x={455} y={15} w={150} h={60} lines={['Web Search']} detail="Agent" kind="agent" />
      <ArchitectureNode x={455} y={110} w={150} h={60} lines={['Academic Retrieval']} detail="Agent" kind="agent" />
      <ArchitectureNode x={455} y={205} w={150} h={60} lines={['Fact Checking &', 'Citation Agent']} kind="agent" />
      <ArchitectureNode x={455} y={300} w={150} h={60} lines={['Report Generation']} detail="Agent" kind="agent" />
      <ArchitectureNode x={630} y={15} w={140} h={60} lines={['Vector DB']} detail="Embeddings + Index" kind="store" />
      <ArchitectureNode x={630} y={155} w={140} h={60} lines={['PostgreSQL']} detail="Long-term Storage" kind="store" />
      <ArchitectureNode x={630} y={300} w={140} h={60} lines={['Redis']} detail="Short-term Memory" kind="store" />
    </svg>
  );
}

function ReceiptsDiagram({ idPrefix = '' }) {
  const paths = [
    ['M125 100H140V145H155', '1.8s', '0s'], ['M125 233H140V145H155', '2.2s', '-.8s'],
    ['M295 145H340', '1.2s', '-.4s'], ['M295 287H320V190H350', '2.4s', '-1s'],
    ['M455 287H480V180H500', '2.5s', '-.6s'], ['M500 145H535', '1.2s', '-.3s'],
    ['M600 190V225', '1.2s', '-.7s'], ['M665 260H680V205H700', '2s', '-1.1s'],
    ['M800 205H820', '1.2s', '-.5s'],
  ];
  return (
    <svg className="receipts-diagram" viewBox="0 0 930 360" role="img" aria-label="Receipts architecture: GitHub pull requests and repository base commits feed claim classification. Environment setup leads to Tavily research. These inputs go to a blind test writer, then sandbox runs, gated verification, a deterministic verdict, and an evidence receipt.">
      <defs><marker id={`${idPrefix}receipts-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" /></marker></defs>
      <path className="receipts-link" d="M125 100H140V145H155M125 233H140V145H155M295 145H340M295 287H320V190H350M455 287H480V180H500M500 145H535M600 190V225M665 260H680V205H700M800 205H820" markerEnd={`url(#${idPrefix}receipts-arrow)`} />
      {motion && paths.map(([path, dur, begin], i) => <circle className="receipts-packet" r="4" key={i}><animateMotion path={path} dur={dur} begin={begin} repeatCount="indefinite" /></circle>)}
      <text className="receipts-stage" x="160" y="48">CLAIM UNDERSTANDING</text>
      <text className="receipts-stage" x="340" y="48">TEST GENERATION</text>
      <text className="receipts-stage" x="535" y="48">EXECUTE & VERIFY</text>
      <ArchitectureNode x={15} y={70} w={110} h={60} lines={['GitHub']} detail="PR + linked issue" kind="client" />
      <ArchitectureNode x={15} y={203} w={110} h={60} lines={['Repository']} detail="Base commit" kind="client" />
      <ArchitectureNode x={155} y={100} w={140} h={90} lines={['Claim Classification']} detail="Nemotron Nano · 3 votes" kind="agent" />
      <ArchitectureNode x={155} y={250} w={140} h={75} lines={['Environment Setup']} detail="Nebius Token Factory" kind="store" />
      <ArchitectureNode x={320} y={250} w={135} h={75} lines={['Research', 'Tavily']} detail="Official API docs" kind="client" />
      <ArchitectureNode x={350} y={100} w={150} h={90} lines={['Blind Test Writer', 'Never sees PR']} detail="Nemotron Super · issue only" kind="agent" />
      <ArchitectureNode x={535} y={90} w={130} h={100} lines={['Run Tests', 'in Sandboxes']} detail="3 base + 3 PR + tests" kind="client" />
      <ArchitectureNode x={535} y={225} w={130} h={70} lines={['Gated Verification', 'Super scope check']} detail="Ultra after-fix review" kind="agent" />
      <ArchitectureNode x={700} y={150} w={100} h={110} lines={['Verdict', 'Deterministic', 'rules', 'Refuted? second', 'opinion']} kind="store" />
      <ArchitectureNode x={820} y={160} w={100} h={90} lines={['Receipt', 'Test + verdict', 'Runs + commands']} kind="client" />
    </svg>
  );
}

function VoiceAgentDiagram({ idPrefix = '' }) {
  const paths = [
    ['M390 62V95', '1.2s', '0s'], ['M390 153V195', '1.2s', '-.5s'],
    ['M390 263V280H140V305', '2.5s', '-.8s'], ['M390 263V305', '1.5s', '-.3s'],
    ['M390 263V280H640V305', '2.5s', '-1.2s'],
    ['M140 357V373H390V390', '2.5s', '-.4s'], ['M390 357V390', '1.2s', '-.9s'],
    ['M640 357V373H390V390', '2.5s', '-1.5s'],
  ];
  return (
    <svg className="voice-diagram" viewBox="0 0 780 450" role="img" aria-label="Voice Agent Harness architecture: Browser or Phone connects through LiveKit WebRTC or SIP to a Voice Worker running STT, LLM, and TTS. The worker branches to Tools, Memory, and RAG, which connect to PostgreSQL for traces and data.">
      <defs><marker id={`${idPrefix}voice-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" /></marker></defs>
      <path className="voice-link" d="M390 62V95M390 153V195" markerEnd={`url(#${idPrefix}voice-arrow)`} />
      <path className="voice-link" d="M390 263V280M140 280H640M140 357V373H640M390 357V373M640 357V373" />
      <path className="voice-link" d="M140 280V305M390 280V305M640 280V305M390 373V390" markerEnd={`url(#${idPrefix}voice-arrow)`} />
      {motion && paths.map(([path, dur, begin], i) => <circle className="voice-packet" r="4" key={i}><animateMotion path={path} dur={dur} begin={begin} repeatCount="indefinite" /></circle>)}
      <ArchitectureNode x={305} y={10} w={170} h={52} lines={['Browser / Phone']} kind="client" />
      <ArchitectureNode x={305} y={95} w={170} h={58} lines={['LiveKit']} detail="WebRTC / SIP" kind="agent" />
      <ArchitectureNode x={270} y={195} w={240} h={68} lines={['Voice Worker']} detail="STT → LLM → TTS" kind="agent" />
      <ArchitectureNode x={70} y={305} w={140} h={52} lines={['Tools']} />
      <ArchitectureNode x={320} y={305} w={140} h={52} lines={['Memory']} />
      <ArchitectureNode x={570} y={305} w={140} h={52} lines={['RAG']} />
      <ArchitectureNode x={300} y={390} w={180} h={52} lines={['Postgres']} detail="Traces / Data" kind="store" />
    </svg>
  );
}

function MediAssistDiagram({ idPrefix = '' }) {
  const paths = [
    ['M360 60V85', '1.2s', '0s'], ['M360 145V170', '1.2s', '-.4s'],
    ['M360 222V250', '1.2s', '-.8s'], ['M360 305V330', '1.2s', '-1.2s'],
    ['M460 353H500V355H520', '2s', '-.4s'], ['M610 295V325', '1.2s', '-.8s'],
    ['M610 385V410', '1.2s', '-.2s'],
  ];
  return (
    <svg className="mediassist-diagram" viewBox="0 0 780 470" role="img" aria-label="MediAssist Pro architecture: PDFs and prescription images pass through a PDF parser or Mistral OCR, then chunking and embeddings into FAISS. The top five chunks and a user query provide context to Gemini, which streams a grounded answer.">
      <defs><marker id={`${idPrefix}mediassist-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8z" /></marker></defs>
      <path className="mediassist-link" d="M360 60V85M360 145V170M360 222V250M360 305V330" markerEnd={`url(#${idPrefix}mediassist-arrow)`} />
      <path className="mediassist-link" d="M460 353H500V355H520M610 295V325M610 385V410" markerEnd={`url(#${idPrefix}mediassist-arrow)`} />
      {motion && paths.map(([path, dur, begin], i) => <circle className="mediassist-packet" r="4" key={i}><animateMotion path={path} dur={dur} begin={begin} repeatCount="indefinite" /></circle>)}
      <ArchitectureNode x={260} y={12} w={200} h={48} lines={['PDF / Prescription']} kind="client" />
      <ArchitectureNode x={260} y={85} w={200} h={60} lines={['PDF Parser']} detail="Mistral OCR" kind="agent" />
      <ArchitectureNode x={260} y={170} w={200} h={52} lines={['Chunking + Embeddings']} />
      <ArchitectureNode x={260} y={250} w={200} h={55} lines={['FAISS']} detail="Vector DB" kind="store" />
      <ArchitectureNode x={260} y={330} w={200} h={46} lines={['Top 5 Chunks']} kind="client" />
      <ArchitectureNode x={520} y={250} w={180} h={45} lines={['Query']} kind="client" />
      <ArchitectureNode x={520} y={325} w={180} h={60} lines={['Gemini', '+ Context']} kind="agent" />
      <ArchitectureNode x={520} y={410} w={180} h={50} lines={['Streaming Answer']} kind="store" />
    </svg>
  );
}

function ProjectDiagram({ project, index, idPrefix = '' }) {
  return project.architecture === 'maira' ? <MairaDiagram idPrefix={idPrefix} />
    : project.architecture === 'receipts' ? <ReceiptsDiagram idPrefix={idPrefix} />
      : project.architecture === 'voice-agent' ? <VoiceAgentDiagram idPrefix={idPrefix} />
        : project.architecture === 'mediassist' ? <MediAssistDiagram idPrefix={idPrefix} />
          : <FlowDiagram labels={project.flow} ci={index} />;
}

export default function Work() {
  const ref = useRef(null);
  const dialogRef = useRef(null);
  const [expandedProject, setExpandedProject] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (expandedProject && !dialog.open) dialog.showModal();
    else if (!expandedProject && dialog.open) dialog.close();
  }, [expandedProject]);

  // Pip's show_architecture action opens a project's diagram from outside this component.
  useEffect(() => {
    const show = e => setExpandedProject(PROJECTS.find(p => p.id === e.detail?.project) ?? null);
    addEventListener('pip:architecture', show);
    return () => removeEventListener('pip:architecture', show);
  }, []);

  useEffect(() => {
    const diagrams = ref.current?.querySelectorAll('.pc-art svg');
    if (!diagrams?.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
      target.classList.toggle('in-view', isIntersecting);
      if (isIntersecting) target.unpauseAnimations();
      else target.pauseAnimations();
    }), { rootMargin: '120px' });
    diagrams.forEach(svg => { svg.pauseAnimations(); observer.observe(svg); });
    return () => observer.disconnect();
  }, []);

  useGsap(ref, () => {
    if (!motion) return;
    const cards = gsap.utils.toArray('.pcard', ref.current);
    cards.forEach(card => gsap.from(card.querySelectorAll('.nd'), { opacity: 0, y: 18, duration: 0.9, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 75%', once: true } }));
    // stacked cards: earlier cards shrink back as the next one slides over them
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      cards.slice(0, -1).forEach((card, i) => gsap.to(card, { scale: 0.9 + i * 0.025, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: `top ${96 + (i + 1) * 18}px`, scrub: true } }));
    });
    return () => mm.revert();
  }, []);

  return (
    <section className="work" id="work" data-section="tools" aria-labelledby="h-work" ref={ref}>
      <div className="sec-head">
        <SplitWords className="h-big" id="h-work" text="Selected work" />
        <p className="muted">Each project is a tool. Here is what goes in, what comes out, and the hard part in between.</p>
      </div>
      <div className="stack">
        {PROJECTS.map((p, i) => (
          <article className="pcard" key={p.fn} id={`project-${p.id}`} style={{ '--c': `var(--${p.color})`, '--cs': `var(--${p.color}-s)`, '--i': i }}>
            <div className="pc-copy">
              <p className="pc-sig mono"><b>{p.fn}</b>{p.args}</p>
              <div className="pc-title-row">
                <h3>{p.title}</h3>
                <p className="pc-links"><a href={p.code} target={p.code.startsWith('http') ? '_blank' : undefined} rel={p.code.startsWith('http') ? 'noreferrer' : undefined}>Code</a>{p.demo && <a href={p.demo}>Demo</a>}</p>
              </div>
              <p>{p.desc}</p>
              <dl className="pc-facts">
                <div><dt>Hard part</dt><dd>{p.hard}</dd></div>
                <div><dt>Result</dt><dd>{p.result}</dd></div>
              </dl>
              <ul className="tags">{p.tags.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
            <button className="pc-art pc-art-trigger" type="button" onClick={() => setExpandedProject(p)} aria-label={`Click to view ${p.title} architecture`}>
              <span className="pc-art-label">Click to view architecture</span>
              <ProjectDiagram project={p} index={i} />
            </button>
          </article>
        ))}
      </div>
      <dialog className="architecture-modal" ref={dialogRef} aria-labelledby="architecture-modal-title" onClose={() => setExpandedProject(null)} onClick={event => { if (event.target === event.currentTarget) setExpandedProject(null); }}>
        {expandedProject && <>
          <header><div><p className="mono">Architecture</p><h2 id="architecture-modal-title">{expandedProject.title}</h2></div><button type="button" aria-label="Close architecture" onClick={() => setExpandedProject(null)}>×</button></header>
          <div className="architecture-modal-art"><ProjectDiagram project={expandedProject} index={PROJECTS.indexOf(expandedProject)} idPrefix="modal-" /></div>
        </>}
      </dialog>
    </section>
  );
}
