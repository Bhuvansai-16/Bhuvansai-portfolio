// Everything you'll want to edit lives here.

export const PROFILE = {
  name: 'Bhuvansai',
  role: 'AI engineer',
  email: 'chbhuvansai522@gmail.com',
  github: 'Bhuvansai-16',
  linkedin: 'https://www.linkedin.com/in/bhuvansaich/',
  photo: 'PP.webp',
  resume: 'https://drive.google.com/file/d/1ZknK9BFRyimrjaVfad4t8TZOYLJ0s6WX/view?usp=sharing',
  formEndpoint: 'https://formspree.io/f/xyekkapq', // empty = the contact form opens the visitor's email app.
};

export const HERO = {
  title: "I'm Bhuvansai, an AI engineer.",
  sub: 'Let my agent show you around',
};

// "Start the run" guided tour: the agent shows each section in page order, talking about its boss (you).
// Keep each line under ~55 characters so the bubble stays small and never covers the content.
export const TOUR = [
  { id: 'about', role: 'retriever', text: 'This is my boss!! The human who builds all of us.' },
  { id: 'work', role: 'tools', target: '.pcard', text: "Stuff my boss built. I've run every one of these." }, // a stack of cards: show the first one whole
  { id: 'github', role: 'memory', text: 'Proof my boss ships. Green squares = busy days.' },
  { id: 'experience', role: 'subgraph', text: 'Where my boss leveled up on a real team.' },
  { id: 'education', role: 'verifier', text: 'Degrees and wins. I checked them myself. All pass!' },
  { id: 'certifications', role: 'evals', text: 'Evals my boss passed. Tap a badge to verify.' },
  { id: 'contact', role: 'interrupt', text: 'This is the end of the run! Say hi to my boss. Bye!' },
];

// g: colour group for the marquee pills (AI, agent/RAG, engineering, frontend/cloud)
export const SKILLS = [
  { name: 'Generative AI', g: 'a' }, { name: 'LLMs', g: 'a' }, { name: 'AI Agents', g: 'a' }, { name: 'Agentic AI', g: 'a' }, { name: 'LLM Evaluation', g: 'a' }, { name: 'Prompt Engineering', g: 'a' },
  { name: 'LangGraph', g: 'b' }, { name: 'LangChain', g: 'b' }, { name: 'RAG', g: 'b' }, { name: 'Tool Calling', g: 'b' }, { name: 'Multi-Agent Systems', g: 'b' }, { name: 'Vector Search', g: 'b' }, { name: 'Embeddings', g: 'b' }, { name: 'Hybrid Search', g: 'b' }, { name: 'PGVector', g: 'b' },
  { name: 'Python', g: 'c' }, { name: 'FastAPI', g: 'c' }, { name: 'PostgreSQL', g: 'c' }, { name: 'Redis', g: 'c' }, { name: 'REST APIs', g: 'c' }, { name: 'Docker', g: 'c' }, { name: 'Git', g: 'c' },
  { name: 'TypeScript', g: 'd' }, { name: 'React', g: 'd' }, { name: 'GCP', g: 'd' },
];

export const ABOUT = {
  heading: 'The human in the loop',
  statement: "I'm an AI engineer who likes the unglamorous half of agents: the tool contracts, the evals, the retries, and the traces that tell you why a run went sideways. Somewhere between a model call and a useful product is where I like to work.",
  facts: [['Based in', 'Hyderabad, India'], ['Currently', 'Graduated, Seeking problems worth solving.'], ['Focus', 'Agents, evals, retrieval'], ['Off the clock', 'Films · Music · Curiosity']],
  stickers: { status: 'Open to AI roles', city: 'Hyderabad', fun: 'My side projects have side projects. 😭' },
};

// color: violet | lime | orange | pink. Projects can show an architecture image or an animated flow.
export const PROJECTS = [
  {
    id: 'maira', fn: 'research', args: '(question: str) → Report', title: 'MAIRA', color: 'violet',
    desc: 'Multi-agent deep research and literature platform that orchestrates specialized agents for research, verification, retrieval, and professional report generation.',
    hard: 'Designing a verification-driven research pipeline where specialized agents gather evidence, synthesize findings, fact-check claims, validate citations, and revise the report when issues are detected.',
    result: 'Multi-agent orchestration · Verification loops · RAG · Multi-model support',
    tags: ['LangGraph', 'LangChain', 'RAG', 'FastAPI', 'PGVector', 'Redis'],
    code: 'https://github.com/Bhuvansai-16/MAIRA.git', demo: null, architecture: 'maira',
  },
  {
    id: 'receipts', fn: 'pull_request', args: '(issue) → Receipt', title: 'Receipts', color: 'lime',
    desc: 'An automated verification system that generates a blind regression test from a GitHub issue, executes it against the base and pull-request code, and produces an evidence-backed verdict.',
    hard: 'Keeping the test writer blind to the pull request while running reproducible base/PR comparisons in isolated sandboxes and using deterministic rules for the final verdict.',
    result: '61% of wrong patches caught · 66% of real fixes confirmed · 52% fewer tokens after optimization.',
    tags: ['Python', 'AI Agents', 'Nemotron', 'Deepagents', 'GitHub', 'Nebius', 'Tavily', 'LangSmith'],
    code: 'https://github.com/Bhuvansai-16/Receipts-backend.git', demo: null, architecture: 'receipts',
  },
  {
    id: 'voice-agent', fn: 'voice_agent', args: '(audio) → response', title: 'Voice Agent Harness', color: 'orange',
    desc: 'A real-time voice-agent runtime for building, testing, and observing agents across speech, models, tools, memory, RAG, and telephony.',
    hard: 'Designing the voice pipeline so latency-sensitive audio stays fast while tool execution, memory, tracing, and safety controls run without blocking the conversation.',
    result: 'Real-time WebRTC + SIP · p50/p95 latency tracking · 8 LLM quality metrics · 200+ tests',
    tags: ['Python', 'FastAPI', 'LiveKit', 'WebRTC', 'LLMs', 'Tool Calling'],
    code: 'https://github.com/Bhuvansai-16/voiceagent_backend.git', demo: null, architecture: 'voice-agent',
  },
  {
    id: 'mediassist', fn: 'medical_document', args: '(query) → grounded_response', title: 'MediAssist Pro', color: 'pink',
    desc: 'An AI-powered medical assistant that uses RAG to help users understand uploaded medical reports and prescription images, with real-time conversational responses.',
    hard: 'Building a multimodal document pipeline that extracts text from PDFs and prescription images, retrieves the most relevant context, and generates responses grounded in the uploaded content.',
    result: 'PDF + image ingestion · RAG-based retrieval · Real-time streaming · Voice input',
    tags: ['Python', 'FastAPI', 'Gemini', 'Mistral OCR', 'LangChain', 'RAG', 'FAISS'],
    code: 'https://github.com/Bhuvansai-16/HealthBot.git', demo: null, architecture: 'mediassist',
  },
];

export const EXPERIENCE = [
  {
    id: 'allcognix-consultant',
    role: 'Generative AI Full Stack Engineer — Consultant', company: 'AllCognix AI Technologies',
    dates: 'Oct 2026 — Present', location: ['Bengaluru, Karnataka, India', 'Remote'],
    summary: 'Continuing with AllCognix AI Technologies as a Generative AI Full Stack Engineer-Consultant, developing Generative AI-based products using Python.',
    outcomes: [
      ['Generative AI product development', 'Developing and extending Generative AI-based products using Python and modern AI engineering practices.'],
      ['Full-stack engineering', 'Working across AI functionality, backend services, APIs, application logic, and frontend integration where required.'],
      ['AI systems engineering', 'Integrating AI-powered functionality into production-oriented applications.'],
      ['Continued product ownership', 'Continuing from the internship into a consultant role with broader responsibility for Generative AI and full-stack product development.'],
    ],
  },
  {
    id: 'allcognix-intern',
    role: 'GenAI Full-Stack Engineer Intern', company: 'AllCognix AI Technologies',
    dates: 'Feb 2026 — Sep 2026', location: ['Bengaluru, Karnataka, India', 'Remote'],
    summary: 'Worked on four AI-powered products across HR, marketing, affiliate management, and supply-chain management, using React.js and Python FastAPI.',
    outcomes: [
      ['Built four AI-powered products', 'Contributed to TalentMesh AI, Vantrex AI, RefliqAI, and SCM AI across enterprise use cases.'],
      ['Full-stack product development', 'Built frontend applications with React.js and backend services and APIs with Python FastAPI.'],
      ['AI-agent-based applications', 'Worked on AI agents and automation for HR, marketing, affiliate management, and supply-chain workflows.'],
      ['Cross-functional product engineering', 'Contributed across interfaces, backend APIs, AI functionality, integrations, and application workflows.'],
    ],
    products: [
      { name: 'Vantrex AI', role: 'Full-stack development · Marketing automation', detail: 'Contributed to AI-driven marketing workflows and application features across frontend and backend.', url: 'https://marketing.allcognix.com/' },
      { name: 'RefliqAI', role: 'Full-stack development · Affiliate management', detail: 'Worked across the affiliate platform frontend, backend, and AI-powered workflows.', url: 'https://admin-affiliate.allcognix.com/' },
      { name: 'TalentMesh AI', role: 'Full-stack development · HR automation', detail: 'Worked across frontend and backend features and AI-powered workflows.', url: 'https://hr.allcognix.com/' },
      { name: 'SCM AI', role: 'Frontend development', detail: 'Focused on the React user interface and application experience; no backend ownership.', url: 'https://scm.allcognix.com/' },
    ],
  },
  {
    id: 'geonius-intern',
    role: 'AI and Research Intern', company: 'GEOnius AI',
    dates: 'Oct 2025 — Jan 2026', location: ['Mumbai, India', 'Remote'],
    outcomes: [
      ['GenAI SEO automation', 'Built a platform analyzing brand visibility across AI search engines, enabling faster regional insights and reducing manual analysis effort by 60%.'],
      ['Website Assistant (Text-to-SQL)', 'Converted natural-language queries into SQL to fetch live business metrics and generate contextual summaries.'],
      ['Multi-agent AI workflows', 'Designed and orchestrated enterprise analytics and decision-support workflows using LangChain and LangGraph.'],
      ['Accuracy and reliability', 'Used prompt engineering and agent orchestration to improve response accuracy and reduce hallucinations.'],
      ['Production collaboration', 'Worked with product and engineering teams to prototype and deploy systems to production.'],
    ],
    certificate: 'https://www.linkedin.com/posts/bhuvansaich_generativeai-agenticai-langgraph-share-7421390457374547968-4xrE/?utm_source=share&utm_medium=member_desktop&rcm=ACoAADGzxwYBMZceC8jNprWu4VPJFrb5W9e1XA4',
  },
];

export const EDUCATION = [
  { title: 'B.E./B.Tech — Malla Reddy University', detail: 'Computer Science and Engineering - AI & ML · Hyderabad · CGPA 8.98 / 10 · 2026', url: null },
  { title: '2nd Place — National Hackathon', detail: 'Malla Reddy University · GenAI Chatbot · 2024', url: null },
  { title: 'National Semi-Finalist — Tata Imagination Challenge', detail: 'Tata Group · 2024', url: null },
];

// icon: gdev | kaggle | coursera | microsoft | aws | gcloud
export const CERTS = [
  { icon: 'gdev', name: 'Google Developer profile', issuer: 'Google Developers', url: 'https://me.developers.google.com/u/Bhuvansai_Mallareddyuniversity' },
  { icon: 'kaggle', name: 'Kaggle profile', issuer: 'Kaggle', url: 'https://www.kaggle.com/bhuvansaich' },
  { icon: 'coursera', name: 'Coursera profile', issuer: 'Coursera', url: 'https://www.coursera.org/user/b4c0599b5ad3e2803d85b6248cc4ade5' },
  { icon: 'microsoft', name: 'Achievements', issuer: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/users/chilamkurthibhuvansai-2608/achievements' },
  { icon: 'aws', name: 'AWS certificate', issuer: 'Amazon Web Services', url: 'https://drive.google.com/file/d/1NNKjSOr0q77E4NDxrpgsB-Shl3_pGlJ5/view?usp=sharing' },
  { icon: 'gcloud', name: 'Google Cloud certificate', issuer: 'Google Cloud', url: 'https://drive.google.com/file/d/19GKmLd67q4dtjiQpq_wUqC2jy1gwnaGw/view?usp=sharing' },
];

export const CONTACT = {
  heading: 'This run is waiting for you.',
  invite: "Have a project, AI system, or problem worth solving? I'd like to hear about it.",
};

// Pip's offline fallback answers from these when the agent can't be reached. t = keywords it matches on, src = sections it links to.
export const KB = [
  { t: 'agents built projects research agent langgraph tool calling', a: 'I build multi-agent systems: MAIRA runs deep research with verification loops, and Receipts writes blind regression tests to check pull requests. All four projects are in the work section.', src: ['work'] },
  { t: 'skills stack technologies python fastapi pytorch languages use most', a: 'Day to day: Python, FastAPI, LangGraph, LangChain, and RAG with PGVector and Redis, plus React and TypeScript on the front end.', src: ['skills', 'about'] },
  { t: 'about you who are you background hobbies based where location live', a: "I'm Bhuvansai, an AI engineer based in Hyderabad, India. Off the clock: films, music, and curiosity.", src: ['about'] },
  { t: 'github contributions commits activity open source streak calendar', a: 'My GitHub activity is in the shipping log: a live contribution calendar with streaks and my busiest day.', src: ['github'] },
  { t: 'certifications certificates badges courses aws google cloud gcp microsoft kaggle coursera', a: 'Profiles and certificates from Google Developers, Kaggle, Coursera, Microsoft Learn, AWS, and Google Cloud are in the certifications section.', src: ['certifications'] },
  { t: 'internship experience work company role', a: 'I am a Generative AI Full Stack Engineer-Consultant at AllCognix AI Technologies. Previously, I interned there as a GenAI Full-Stack Engineer and worked as an AI and Research Intern at GEOnius AI. See the experience section for products and outcomes.', src: ['experience'] },
  { t: 'education degree university college achievements awards', a: 'B.E./B.Tech in Computer Science and Engineering - AI & ML at Malla Reddy University (2026). 2nd place at the National Hackathon for a GenAI chatbot (2024), and National Semi-Finalist in the Tata Imagination Challenge (2024).', src: ['education'] },
  { t: 'contact email hire reach resume linkedin github', a: `Email works best: ${PROFILE.email}. The form at the end of the page reaches me too.`, src: ['contact'] },
  { t: 'evaluation eval testing quality regressions', a: 'I treat evals as part of the product. Receipts checks pull requests with blind regression tests and caught 61% of wrong patches.', src: ['work'] },
  { t: 'retrieval rag documents search embeddings', a: 'MediAssist Pro answers from uploaded medical reports with RAG, and MAIRA retrieves and verifies sources before writing its report.', src: ['work'] },
];
