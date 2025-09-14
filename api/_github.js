// Utilitaires GitHub Contents API pour lire/écrire/lister/supprimer des fichiers
// Variables d'environnement requises:
// - GITHUB_TOKEN (token avec scope repo)
// - GITHUB_OWNER (ex: "your-org" ou "your-user")
// - GITHUB_REPO (ex: "your-repo")
// - GITHUB_BRANCH (optionnel, défaut: "main")

import { Buffer } from 'node:buffer';

const GITHUB_API_BASE = 'https://api.github.com';

function getRepoParams() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) {
    const missing = [!owner && 'GITHUB_OWNER', !repo && 'GITHUB_REPO', !token && 'GITHUB_TOKEN'].filter(Boolean).join(', ');
    const err = new Error(`[github] Variables manquantes: ${missing}`);
    err.code = 'GITHUB_CONFIG_MISSING';
    throw err;
  }
  return { owner, repo, branch, token };
}

function apiHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
}

export function getRawUrl(path) {
  const { owner, repo, branch } = getRepoParams();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path}`;
}

export async function getFile(path) {
  const { owner, repo, token, branch } = getRepoParams();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: apiHeaders(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`[github] getFile failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const content = Buffer.from(j.content || '', j.encoding || 'base64').toString('utf-8');
  return { path: j.path, sha: j.sha, content };
}

export async function putFile(path, content, message, sha) {
  const { owner, repo, token, branch } = getRepoParams();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  let base64;
  if (typeof content === 'string') {
    base64 = Buffer.from(content, 'utf-8').toString('base64');
  } else if (content && typeof content === 'object' && typeof content.toString === 'function' && Buffer.isBuffer(content)) {
    base64 = content.toString('base64');
  } else if (content instanceof Uint8Array) {
    base64 = Buffer.from(content).toString('base64');
  } else {
    base64 = Buffer.from(String(content || '')).toString('base64');
  }
  const body = {
    message: message || `chore: update ${path}`,
    content: base64,
    branch,
  };
  if (sha) body.sha = sha;
  const r = await fetch(url, { method: 'PUT', headers: apiHeaders(token), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`[github] putFile failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return j;
}

export async function deleteFile(path, message, sha) {
  const { owner, repo, token, branch } = getRepoParams();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message: message || `chore: delete ${path}`,
    branch,
    sha
  };
  const r = await fetch(url, { method: 'DELETE', headers: apiHeaders(token), body: JSON.stringify(body) });
  if (r.status === 404) return true;
  if (!r.ok) throw new Error(`[github] deleteFile failed: ${r.status} ${await r.text()}`);
  return true;
}

export async function listDir(path) {
  const { owner, repo, token, branch } = getRepoParams();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: apiHeaders(token) });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`[github] listDir failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!Array.isArray(j)) return [];
  return j.map(it => ({ name: it.name, path: it.path, type: it.type, sha: it.sha, size: it.size, download_url: it.download_url }));
}

export function safeSlug(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}


