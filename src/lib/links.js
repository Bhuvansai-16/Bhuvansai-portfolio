// Everything Pip may scroll to or open, keyed by short names. The agent only ever names a key,
// so it can never open a URL that isn't already in content.js.
import { CERTS, EXPERIENCE, PROFILE, PROJECTS } from '../content.js';

export const SECTIONS = ['top', 'about', 'skills', 'work', 'github', 'experience', 'education', 'certifications', 'contact'];
export const THEMES = ['daylight', 'midnight', 'citrus', 'grape'];
export const PRODUCT_KEYS = { 'Vantrex AI': 'vantrex', RefliqAI: 'refliq', 'TalentMesh AI': 'talentmesh', 'SCM AI': 'scm' };

// navigate_to target → CSS selector
export const TARGETS = {
  ...Object.fromEntries(SECTIONS.map(s => [`section:${s}`, `#${s}`])),
  ...Object.fromEntries(PROJECTS.map(p => [`project:${p.id}`, `#project-${p.id}`])),
  ...Object.fromEntries(EXPERIENCE.map(j => [`job:${j.id}`, `#job-${j.id}`])),
};

const products = EXPERIENCE.flatMap(j => j.products ?? []);

// open_link key → URL
export const LINKS = {
  linkedin: PROFILE.linkedin,
  github: `https://github.com/${PROFILE.github}`,
  resume: PROFILE.resume,
  email: `mailto:${PROFILE.email}`,
  ...Object.fromEntries(PROJECTS.filter(p => p.code).map(p => [`code:${p.id}`, p.code])),
  ...Object.fromEntries(CERTS.map(c => [`cert:${c.icon}`, c.url])),
  ...Object.fromEntries(products.filter(p => PRODUCT_KEYS[p.name]).map(p => [`product:${PRODUCT_KEYS[p.name]}`, p.url])),
  ...Object.fromEntries(EXPERIENCE.filter(j => j.certificate).map(j => [`post:${j.id.split('-')[0]}`, j.certificate])),
};
