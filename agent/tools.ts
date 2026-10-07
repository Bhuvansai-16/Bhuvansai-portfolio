// Page actions. Each one validates its arguments, hands the action to the browser through
// LangGraph's custom stream, and ends the turn (returnDirect), so a pure action is one model call.
import { tool } from 'langchain';
import { z } from 'zod';
import { LINKS, TARGETS, THEMES } from '../src/lib/links.js';
import { PROFILE, PROJECTS } from '../src/content.js';

export type Action = { type: 'action'; name: string; args: Record<string, unknown>; say: string };
type Config = { writer?: ((chunk: unknown) => void) | null }; // LangGraph sets writer while streaming with mode 'custom'

const oneOf = (values: string[]) => z.enum(values as [string, ...string[]]);
const say = z.string().describe('Your speech-bubble line while doing it, under 60 characters.');

function action(name: string, description: string, shape: z.ZodRawShape) {
  return tool(async (input: Record<string, unknown>, config: Config) => {
    const { say: line, ...args } = input;
    config.writer?.({ type: 'action', name, args, say: String(line ?? '').trim().slice(0, 80) });
    return `Done: ${name}.`;
  }, { name, description, schema: z.object({ ...shape, say }), returnDirect: true });
}

export const actionTools = [
  action('navigate_to', 'Scroll the page to a section, a project card or a job.', { target: oneOf(Object.keys(TARGETS)) }),
  action('open_link', `Open one of ${PROFILE.name}'s links in a new tab: profiles, resume, email, project code, certificates, product sites.`, { link: oneOf(Object.keys(LINKS)) }),
  action('show_architecture', 'Scroll to a project and open its architecture diagram.', { project: oneOf(PROJECTS.map((p: { id: string }) => p.id)) }),
  action('set_theme', 'Switch the colour theme. midnight and grape are dark, daylight and citrus are light.', { theme: oneOf(THEMES) }),
  action('start_tour', 'Start the guided tour through every section of the page.', {}),
  action('prefill_contact', "Fill in the contact form with the visitor's message so they only press Send. Never sends anything.", {
    message: z.string().min(1).max(1000), name: z.string().max(80).optional(), email: z.string().max(120).optional(),
  }),
  action('send_email', `Prepare an email to ${PROFILE.email}. Use only when the visitor explicitly asks you to send an email and provides their name, reply email, and exact message. The visitor must review and confirm it in the chat before it is sent.`, {
    name: z.string().trim().min(1).max(80), email: z.string().trim().email().max(120), message: z.string().min(10).max(1000),
  }),
  action('copy_email', `Copy ${PROFILE.name}'s email address to the clipboard.`, {}),
];
