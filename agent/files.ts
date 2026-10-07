// Pip's knowledge: the portfolio content as small markdown files in the agent's virtual filesystem.
// The agent reads only the file a question needs, so each Groq call stays small.
import { ABOUT, CERTS, CONTACT, EDUCATION, EXPERIENCE, PROFILE, PROJECTS, SKILLS } from '../src/content.js';
import { PRODUCT_KEYS } from '../src/lib/links.js';

type Doc = { summary: string; text: string };
export type FileData = { content: string; mimeType: string; created_at: string; modified_at: string };

const lines = (...l: (string | false | null | undefined)[]) => l.filter(Boolean).join('\n');

export const DOCS: Record<string, Doc> = {
  '/about.md': {
    summary: `who ${PROFILE.name} is: location, focus, availability, skills`,
    text: lines(
      `# About ${PROFILE.name}`,
      `Role: ${PROFILE.role}. Status: ${ABOUT.stickers.status}.`,
      ABOUT.statement,
      ...ABOUT.facts.map(([k, v]: string[]) => `- ${k}: ${v}`),
      `Fun fact: ${ABOUT.stickers.fun}`,
      `Skills: ${SKILLS.map((s: { name: string }) => s.name).join(', ')}`,
    ),
  },
  ...Object.fromEntries(PROJECTS.map((p: any) => [`/projects/${p.id}.md`, {
    summary: `${p.title}: ${p.desc.split('. ')[0].slice(0, 90)}`,
    text: lines(
      `# ${p.title} (project id: ${p.id})`,
      p.desc,
      `Hard part: ${p.hard}`,
      `Result: ${p.result}`,
      `Stack: ${p.tags.join(', ')}`,
      p.code && `Code: open_link "code:${p.id}"`,
      p.architecture && `Architecture diagram: show_architecture "${p.id}"`,
      `On the page: navigate_to "project:${p.id}"`,
    ),
  }])),
  ...Object.fromEntries(EXPERIENCE.map((j: any) => [`/experience/${j.id}.md`, {
    summary: `${j.role} at ${j.company}, ${j.dates}`,
    text: lines(
      `# ${j.role} at ${j.company} (job id: ${j.id})`,
      `Dates: ${j.dates}. Location: ${j.location.join(' / ')}`,
      j.summary,
      'Outcomes:',
      ...j.outcomes.map(([t, d]: string[]) => `- ${t}: ${d}`),
      j.products && 'Products:',
      ...(j.products ?? []).map((p: any) => `- ${p.name} (${p.role}): ${p.detail}${(PRODUCT_KEYS as Record<string, string>)[p.name] ? ` open_link "product:${(PRODUCT_KEYS as Record<string, string>)[p.name]}"` : ''}`),
      j.certificate && `Certificate post: open_link "post:${j.id.split('-')[0]}"`,
      `On the page: navigate_to "job:${j.id}"`,
    ),
  }])),
  '/education.md': {
    summary: 'degree, CGPA, hackathon and challenge results',
    text: lines('# Education and achievements', ...EDUCATION.map((e: { title: string; detail: string }) => `- ${e.title}: ${e.detail}`)),
  },
  '/certifications.md': {
    summary: CERTS.map((c: { issuer: string }) => c.issuer).join(', '),
    text: lines('# Certifications and profiles', ...CERTS.map((c: any) => `- ${c.name} (${c.issuer}): open_link "cert:${c.icon}"`)),
  },
  '/contact.md': {
    summary: 'email, LinkedIn, GitHub, resume, how to reach out',
    text: lines(
      '# Contact',
      CONTACT.invite,
      `Email: ${PROFILE.email} (open_link "email", copy_email, or prefill_contact)`,
      'LinkedIn: open_link "linkedin". GitHub: open_link "github". Resume: open_link "resume".',
    ),
  },
};

export const FILE_INDEX = Object.entries(DOCS).map(([path, d]) => `- ${path}: ${d.summary}`).join('\n');

export function seedFiles(): Record<string, FileData> {
  const now = new Date().toISOString();
  return Object.fromEntries(Object.entries(DOCS).map(([path, d]) => [path, { content: d.text, mimeType: 'text/markdown', created_at: now, modified_at: now }]));
}
