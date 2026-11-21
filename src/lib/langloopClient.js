// Calls to LangLoop (the invite-only listening and AI service) with the visitor's Firebase ID token.
// LangLoop checks the token and its invite list on every call; hiding things here is only for looks.
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseServices } from './firebase';

export const LANGLOOP_URL = (import.meta.env.PUBLIC_LANGLOOP_URL || 'https://langloop-three.vercel.app').replace(/\/$/, '');

export class LangLoopError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function call(user, path, { method = 'GET', json, form } = {}) {
  const headers = { Authorization: `Bearer ${await user.getIdToken()}` };
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  let response;
  try {
    response = await fetch(`${LANGLOOP_URL}${path}`, { method, headers, body: json !== undefined ? JSON.stringify(json) : form });
  } catch {
    throw new LangLoopError('連不上 LangLoop，請確認網路後再試。', 'NETWORK', 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new LangLoopError(data?.error?.message || '發生錯誤，請稍後再試。', data?.error?.code || 'HTTP', response.status);
  return data;
}

export async function checkAccess(user) {
  try {
    return (await call(user, '/api/auth/access'))?.allowed === true;
  } catch {
    return false;
  }
}

export const listSavedWords = async user => (await call(user, '/api/words'))?.words || [];
export const listProjects = async user => (await call(user, '/api/site/projects'))?.projects || [];
export const listChoices = async user => (await call(user, '/api/site/projects?all=1'))?.projects || [];
export const setShowOnSite = (user, id, showOnSite) => call(user, `/api/site/projects/${encodeURIComponent(id)}`, { method: 'PATCH', json: { showOnSite } });
export const getProject = async (user, id) => (await call(user, `/api/site/projects/${encodeURIComponent(id)}`))?.project;
export const lookupWord = async (user, word, sentence) => (await call(user, '/api/site/words/lookup', { method: 'POST', json: { word, sentence, language: 'de' } }))?.entry;
export const saveWord = async (user, entry, sentence, projectId) => (await call(user, '/api/site/words', { method: 'POST', json: { entry, sentence, projectId } }))?.word;
export const correctText = (user, { text, level, topic, spoken }) => call(user, '/api/site/correct', { method: 'POST', json: { text, level, topic, spoken } });

export async function transcribe(user, blob) {
  const form = new FormData();
  form.append('audio', blob, 'speech');
  return call(user, '/api/site/speech', { method: 'POST', form });
}

// Hands the sign-in to LangLoop with a form POST, so the token never appears in a URL.
export function openLangLoop(idToken) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${LANGLOOP_URL}/api/auth/handoff`;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'idToken';
  input.value = idToken;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

// 'loading' → 'signed-out' | 'denied' | 'ok' (with the Firebase user).
export function useLangLoopAccess() {
  const [state, setState] = useState({ status: 'loading', user: null });
  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) { setState({ status: 'signed-out', user: null }); return undefined; }
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(services.auth, async user => {
      if (!user) { if (!cancelled) setState({ status: 'signed-out', user: null }); return; }
      const allowed = await checkAccess(user);
      if (!cancelled) setState({ status: allowed ? 'ok' : 'denied', user: allowed ? user : null });
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);
  return state;
}
