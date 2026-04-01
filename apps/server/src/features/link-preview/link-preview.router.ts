import { Router } from 'express';
import * as cheerio from 'cheerio';
import { authenticate } from '../../shared/middleware/auth';

const router = Router();

// GET /api/link-preview?url=https://example.com
router.get('/', authenticate, async (req, res, next) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url query param is required' });
    return;
  }

  // Only allow http/https
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      res.status(400).json({ error: 'Only http/https URLs are allowed' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LoZo/1.0; +https://lozo.app)',
        Accept: 'text/html',
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      res.json({ url, title: null, description: null, image: null });
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    // Resolve relative image URLs against the target URL
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, url).toString();
      } catch {
        image = null;
      }
    }

    res.json({
      url,
      title: title?.trim().slice(0, 200) ?? null,
      description: description?.trim().slice(0, 500) ?? null,
      image: image ?? null,
    });
  } catch {
    // Return empty preview on fetch failure so client shows plain URL
    res.json({ url, title: null, description: null, image: null });
  }
});

export default router;
