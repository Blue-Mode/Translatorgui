const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

const LANGUAGES = {
  english:'en', spanish:'es', french:'fr', german:'de', japanese:'ja', korean:'ko',
  chinese:'zh-CN', mandarin:'zh-CN', filipino:'tl', tagalog:'tl', portuguese:'pt',
  arabic:'ar', hindi:'hi', russian:'ru', italian:'it', dutch:'nl', indonesian:'id',
  vietnamese:'vi', thai:'th', turkish:'tr', ukrainian:'uk', polish:'pl', greek:'el',
  hebrew:'iw', malay:'ms', swahili:'sw', bengali:'bn', urdu:'ur', tamil:'ta',
  telugu:'te', marathi:'mr', punjabi:'pa', romanian:'ro', czech:'cs', hungarian:'hu',
  swedish:'sv', norwegian:'no', danish:'da', finnish:'fi', persian:'fa', nepali:'ne',
  gujarati:'gu', kannada:'kn', malayalam:'ml', serbian:'sr', croatian:'hr', slovak:'sk',
  bulgarian:'bg', lithuanian:'lt', latvian:'lv', estonian:'et'
};

app.get('/', (_req, res) => res.json({ ok: true, service: 'Blue Mode Translation API' }));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/translate', async (req, res) => {
  try {
    const text = req.body && req.body.text;
    const requested = String((req.body && req.body.targetLanguage) || 'English').trim();
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Please provide a non-empty text string.' });
    }
    if (text.length > 4000) return res.status(413).json({ error: 'Message is too long (maximum 4000 characters).' });
    const target = LANGUAGES[requested.toLowerCase()] || requested.toLowerCase();
    if (!/^[a-z]{2,3}(?:-[a-zA-Z]{2,4})?$/.test(target)) {
      return res.status(400).json({ error: `Unsupported target language: ${requested}` });
    }

    // Translation happens server-side, so the Roblox client only needs to contact this backend.
    // The upstream Google Translate web endpoint is unofficial and can change or rate-limit requests.
    const upstreamUrl = new URL('https://translate.googleapis.com/translate_a/single');
    upstreamUrl.searchParams.set('client', 'gtx');
    upstreamUrl.searchParams.set('sl', 'auto');
    upstreamUrl.searchParams.set('tl', target);
    upstreamUrl.searchParams.set('dt', 't');
    upstreamUrl.searchParams.set('q', text);
    const upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'BlueModeTranslation/1.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) return res.status(502).json({ error: `Translation provider returned HTTP ${upstream.status}.` });
    const data = await upstream.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      return res.status(502).json({ error: 'Translation provider returned an unexpected response.' });
    }
    const translatedText = data[0]
      .filter(segment => Array.isArray(segment) && typeof segment[0] === 'string')
      .map(segment => segment[0]).join('');
    if (!translatedText) return res.status(502).json({ error: 'Translation provider returned no translated text.' });
    res.json({ translatedText, detectedLanguage: typeof data[2] === 'string' ? data[2] : null });
  } catch (err) {
    res.status(502).json({ error: 'Translation provider unavailable.', details: String(err.message || err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Blue Mode Translation API listening on ${port}`));
