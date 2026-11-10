import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import pg from 'pg';
import Parser from 'rss-parser';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rssParser = new Parser();
const newsFeedUrl = process.env.NEWS_FEED_URL || 'https://g1.globo.com/rss/g1/';
let newsCache = { expiresAt: 0, items: [] };

app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200' }));
app.use(express.json({ limit: '20kb' }));

app.get('/api/news', async (_request, response) => {
  if (newsCache.expiresAt > Date.now()) return response.json(newsCache.items);

  try {
    const feed = await rssParser.parseURL(newsFeedUrl);
    const items = feed.items.slice(0, 12).map((item, index) => ({
      id: item.guid || item.link || String(index),
      title: item.title || 'Notícia sem título',
      link: item.link || '',
      publishedAt: item.isoDate || item.pubDate || null,
      source: feed.title || 'Notícias G1'
    }));
    newsCache = { expiresAt: Date.now() + 10 * 60 * 1000, items };
    return response.json(items);
  } catch {
    return response.status(502).json({ error: 'Não foi possível carregar as notícias agora.' });
  }
});

const topics = new Set([
  'Medos e ansiedade',
  'Relacionamentos',
  'Corpo e autoestima',
  'Desejos e sonhos'
]);
const reactionTypes = new Set(['heart', 'support', 'hug']);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function serializeComment(comment, children) {
  return { ...comment, replies: children.filter((child) => child.parentId === comment.id) };
}

async function getComments(postId) {
  const { rows } = await pool.query(`
    SELECT c.id, c.post_id AS "postId", c.parent_id AS "parentId", c.content,
      c.created_at AS "createdAt",
      COUNT(r.id)::int AS "reactionCount"
    FROM comments c
    LEFT JOIN reactions r ON r.target_type = 'comment' AND r.target_id = c.id
    WHERE c.post_id = $1
    GROUP BY c.id
    ORDER BY c.created_at ASC
  `, [postId]);

  const byId = new Map(rows.map((comment) => [comment.id, { ...comment, replies: [] }]));
  for (const comment of byId.values()) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId).replies.push(comment);
    }
  }
  return [...byId.values()].filter((comment) => !comment.parentId);
}

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'postgresql' });
  } catch {
    response.status(503).json({ status: 'error', error: 'Banco de dados indisponível.' });
  }
});

app.get('/api/posts', async (_request, response) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.content, p.topic, p.created_at AS "createdAt",
        COUNT(DISTINCT c.id)::int AS "commentsCount",
        COUNT(r.id)::int AS "reactionCount"
      FROM posts p
      LEFT JOIN comments c ON c.post_id = p.id
      LEFT JOIN reactions r ON r.target_type = 'post' AND r.target_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    response.json(rows);
  } catch {
    response.status(500).json({ error: 'Não foi possível carregar os relatos.' });
  }
});

app.post('/api/posts', async (request, response) => {
  const content = cleanText(request.body?.content);
  const topic = cleanText(request.body?.topic);
  if (content.length < 1 || content.length > 800) {
    return response.status(400).json({ error: 'O relato deve ter entre 1 e 800 caracteres.' });
  }
  if (!topics.has(topic)) {
    return response.status(400).json({ error: 'Escolha um tema válido.' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO posts (content, topic, ip_address) VALUES ($1, $2, $3)
      RETURNING id, content, topic, created_at AS "createdAt"
    `, [content, topic, request.ip]);
    return response.status(201).json({ ...rows[0], commentsCount: 0, reactionCount: 0 });
  } catch {
    return response.status(500).json({ error: 'Não foi possível publicar o relato.' });
  }
});

app.get('/api/posts/:postId/comments', async (request, response) => {
  const postId = validId(request.params.postId);
  if (!postId) return response.status(400).json({ error: 'ID de relato inválido.' });

  try {
    const exists = await pool.query('SELECT 1 FROM posts WHERE id = $1', [postId]);
    if (!exists.rowCount) return response.status(404).json({ error: 'Relato não encontrado.' });
    response.json(await getComments(postId));
  } catch {
    response.status(500).json({ error: 'Não foi possível carregar os comentários.' });
  }
});

app.post('/api/posts/:postId/comments', async (request, response) => {
  const postId = validId(request.params.postId);
  const parentId = request.body?.parentId ? validId(request.body.parentId) : null;
  const content = cleanText(request.body?.content);
  if (!postId) return response.status(400).json({ error: 'ID de relato inválido.' });
  if (content.length < 1 || content.length > 500) {
    return response.status(400).json({ error: 'O comentário deve ter entre 1 e 500 caracteres.' });
  }

  try {
    const post = await pool.query('SELECT 1 FROM posts WHERE id = $1', [postId]);
    if (!post.rowCount) return response.status(404).json({ error: 'Relato não encontrado.' });
    if (parentId) {
      const parent = await pool.query('SELECT 1 FROM comments WHERE id = $1 AND post_id = $2', [parentId, postId]);
      if (!parent.rowCount) return response.status(400).json({ error: 'Comentário pai não encontrado.' });
    }
    const { rows } = await pool.query(`
      INSERT INTO comments (post_id, parent_id, content, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, post_id AS "postId", parent_id AS "parentId", content, created_at AS "createdAt"
    `, [postId, parentId, content, request.ip]);
    return response.status(201).json({ ...rows[0], replies: [], reactionCount: 0 });
  } catch {
    return response.status(500).json({ error: 'Não foi possível salvar o comentário.' });
  }
});

app.post('/api/reactions', async (request, response) => {
  const targetType = cleanText(request.body?.targetType);
  const targetId = validId(request.body?.targetId);
  const reactionType = cleanText(request.body?.reactionType);
  if (!['post', 'comment'].includes(targetType) || !targetId || !reactionTypes.has(reactionType)) {
    return response.status(400).json({ error: 'Dados de reação inválidos.' });
  }

  try {
    const table = targetType === 'post' ? 'posts' : 'comments';
    const target = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [targetId]);
    if (!target.rowCount) return response.status(404).json({ error: 'Conteúdo não encontrado.' });
    await pool.query(`
      INSERT INTO reactions (target_type, target_id, reaction_type, actor_id, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (target_type, target_id, ip_address)
      DO UPDATE SET reaction_type = EXCLUDED.reaction_type
    `, [targetType, targetId, reactionType, request.ip, request.ip]);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM reactions WHERE target_type = $1 AND target_id = $2', [targetType, targetId]);
    return response.json({ reactionCount: rows[0].count, reactionType });
  } catch {
    return response.status(500).json({ error: 'Não foi possível salvar a reação.' });
  }
});

// Em produção, a própria API entrega o site Angular já compilado (npm run build).
// Localmente, essa pasta pode não existir e o Angular roda separado via npm start.
const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/blog-acolhidas/browser');
if (existsSync(path.join(siteDir, 'index.html'))) {
  app.use(express.static(siteDir));
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api')) return next();
    return response.sendFile(path.join(siteDir, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`API do Blog Acolhidas disponível na porta ${port}`);
});
