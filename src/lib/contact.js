import { PROFILE } from '../content.js';

export async function sendContactMessage({ name, email, message }) {
  if (!PROFILE.formEndpoint) throw new Error('Formspree is not configured.');
  if (typeof name !== 'string' || !name.trim() || name.length > 80 ||
      typeof email !== 'string' || email.length > 120 || !/^\S+@\S+\.\S+$/.test(email) ||
      typeof message !== 'string' || message.trim().length < 10 || message.length > 1000) {
    throw new Error('The email draft is incomplete or invalid.');
  }

  const response = await fetch(PROFILE.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, email, message }),
  });
  if (!response.ok) throw new Error('Formspree could not send the email.');
}
