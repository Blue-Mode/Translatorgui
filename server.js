const express = require('express');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

// ========================================
// BLUE MODE TRANSLATION API
// Language names and aliases
// ========================================

const LANGUAGES = {
    afrikaans: 'af',
    albanian: 'sq',
    amharic: 'am',
    arabic: 'ar',
    armenian: 'hy',
    assamese: 'as',
    aymara: 'ay',
    azerbaijani: 'az',
    bambara: 'bm',
    bashkir: 'ba',
    basque: 'eu',
    belarusian: 'be',
    bengali: 'bn',
    bhojpuri: 'bho',
    bosnian: 'bs',
    bulgarian: 'bg',
    burmese: 'my',
    catalan: 'ca',
    cebuano: 'ceb',
    chichewa: 'ny',
    corsican: 'co',
    croatian: 'hr',
    czech: 'cs',
    danish: 'da',
    dhivehi: 'dv',
    dogri: 'doi',
    dutch: 'nl',
    english: 'en',
    esperanto: 'eo',
    estonian: 'et',
    ewe: 'ee',
    filipino: 'tl',
    tagalog: 'tl',
    finnish: 'fi',
    french: 'fr',
    frisian: 'fy',
    galician: 'gl',
    georgian: 'ka',
    german: 'de',
    greek: 'el',
    guarani: 'gn',
    gujarati: 'gu',
    'haitian creole': 'ht',
    hausa: 'ha',
    hawaiian: 'haw',
    hebrew: 'iw',
    hindi: 'hi',
    hmong: 'hmn',
    hungarian: 'hu',
    icelandic: 'is',
    igbo: 'ig',
    ilocano: 'ilo',
    indonesian: 'id',
    irish: 'ga',
    italian: 'it',
    japanese: 'ja',
    javanese: 'jv',
    kannada: 'kn',
    kazakh: 'kk',
    khmer: 'km',
    kinyarwanda: 'rw',
    konkani: 'gom',
    korean: 'ko',
    krio: 'kri',
    kurdish: 'ku',
    kyrgyz: 'ky',
    lao: 'lo',
    latin: 'la',
    latvian: 'lv',
    lingala: 'ln',
    lithuanian: 'lt',
    luganda: 'lg',
    luxembourgish: 'lb',
    macedonian: 'mk',
    maithili: 'mai',
    malagasy: 'mg',
    malay: 'ms',
    malayalam: 'ml',
    maltese: 'mt',
    maori: 'mi',
    marathi: 'mr',
    meiteilon: 'mni-Mtei',
    mizo: 'lus',
    mongolian: 'mn',
    nepali: 'ne',
    norwegian: 'no',
    odia: 'or',
    oriya: 'or',
    oromo: 'om',
    pashto: 'ps',
    persian: 'fa',
    polish: 'pl',
    portuguese: 'pt',
    punjabi: 'pa',
    quechua: 'qu',
    romanian: 'ro',
    russian: 'ru',
    samoan: 'sm',
    sanskrit: 'sa',
    'scots gaelic': 'gd',
    serbian: 'sr',
    sesotho: 'st',
    shona: 'sn',
    sindhi: 'sd',
    sinhala: 'si',
    slovak: 'sk',
    slovenian: 'sl',
    somali: 'so',
    spanish: 'es',
    sundanese: 'su',
    swahili: 'sw',
    swedish: 'sv',
    tajik: 'tg',
    tamil: 'ta',
    tatar: 'tt',
    telugu: 'te',
    thai: 'th',
    tigrinya: 'ti',
    tsonga: 'ts',
    turkish: 'tr',
    turkmen: 'tk',
    twi: 'ak',
    ukrainian: 'uk',
    urdu: 'ur',
    uyghur: 'ug',
    uzbek: 'uz',
    vietnamese: 'vi',
    welsh: 'cy',
    xhosa: 'xh',
    yiddish: 'yi',
    yoruba: 'yo',
    zulu: 'zu',

    // Chinese aliases
    chinese: 'zh-CN',
    mandarin: 'zh-CN',
    'chinese simplified': 'zh-CN',
    'simplified chinese': 'zh-CN',
    'chinese traditional': 'zh-TW',
    'traditional chinese': 'zh-TW',

    // Philippine language aliases
    hiligaynon: 'hil',
    ilonggo: 'hil',
    waray: 'war'
};

// ========================================
// LANGUAGE CODE -> DISPLAY NAME
// ========================================

const LANGUAGE_NAMES = {};

for (const [name, code] of Object.entries(LANGUAGES)) {
    if (!LANGUAGE_NAMES[code.toLowerCase()]) {
        LANGUAGE_NAMES[code.toLowerCase()] = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

Object.assign(LANGUAGE_NAMES, {
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    tl: 'Filipino / Tagalog',
    iw: 'Hebrew',
    jv: 'Javanese',
    no: 'Norwegian',
    und: 'Undetermined',
    hil: 'Hiligaynon / Ilonggo',
    war: 'Waray'
});

// ========================================
// LANGUAGE NORMALIZATION
// ========================================

function normalizeLanguage(value) {
    const requested = String(value || 'English').trim();
    const alias = LANGUAGES[requested.toLowerCase()];
    const code = alias || requested;

    // Accept names or language codes, such as "Cebuano", "ceb", or "zh-CN".
    if (!/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})?$/i.test(code)) {
        return {
            requested,
            code: null
        };
    }

    return {
        requested,
        code
    };
}

// ========================================
// HEALTH CHECK
// ========================================

app.get('/', (_req, res) => {
    res.json({
        ok: true,
        service: 'Blue Mode Translation API'
    });
});

app.get('/health', (_req, res) => {
    res.json({
        ok: true
    });
});

// ========================================
// SUPPORTED LANGUAGES
// ========================================

app.get('/languages', (_req, res) => {
    const languages = Object.entries(LANGUAGES)
        .map(([name, code]) => ({
            name,
            code
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
        count: languages.length,
        languages
    });
});

// ========================================
// TRANSLATION ENDPOINT
// POST /translate
//
// JSON body:
// {
//   "text": "Hola, ¿cómo estás?",
//   "targetLanguage": "English"
// }
// ========================================

app.post('/translate', async (req, res) => {
    try {
        const text = req.body && req.body.text;

        const requestedLanguage = String(
            (req.body && req.body.targetLanguage) || 'English'
        ).trim();

        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                error: 'Please provide a non-empty text string.'
            });
        }

        if (text.length > 4000) {
            return res.status(413).json({
                error: 'Message is too long. Maximum 4000 characters.'
            });
        }

        const target = normalizeLanguage(requestedLanguage);

        if (!target.code) {
            return res.status(400).json({
                error: `Unsupported target language: ${requestedLanguage}`,
                supportedLanguages: '/languages'
            });
        }

        // Request translation from the upstream provider.
        const upstreamUrl = new URL(
            'https://translate.googleapis.com/translate_a/single'
        );

        upstreamUrl.searchParams.set('client', 'gtx');
        upstreamUrl.searchParams.set('sl', 'auto');
        upstreamUrl.searchParams.set('tl', target.code);
        upstreamUrl.searchParams.set('dt', 't');
        upstreamUrl.searchParams.set('q', text);

        const upstream = await fetch(upstreamUrl, {
            headers: {
                'User-Agent': 'BlueModeTranslation/1.1',
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(15000)
        });

        if (!upstream.ok) {
            return res.status(502).json({
                error: `Translation provider returned HTTP ${upstream.status}.`
            });
        }

        const data = await upstream.json();

        if (!Array.isArray(data) || !Array.isArray(data[0])) {
            return res.status(502).json({
                error: 'Translation provider returned an unexpected response.'
            });
        }

        const translatedText = data[0]
            .filter(segment =>
                Array.isArray(segment) &&
                typeof segment[0] === 'string'
            )
            .map(segment => segment[0])
            .join('');

        if (!translatedText) {
            return res.status(502).json({
                error: 'Translation provider returned no translated text.'
            });
        }

        // Source-language detection can be missing for short or ambiguous text.
        const detectedCode =
            typeof data[2] === 'string' && data[2].trim()
                ? data[2].trim()
                : null;

        const detectedLanguageName = detectedCode
            ? (
                LANGUAGE_NAMES[detectedCode.toLowerCase()] ||
                `Language (${detectedCode})`
            )
            : 'Undetermined';

        // Keep "translatedText" and "detectedLanguage" compatible
        // with the existing Roblox Lua helper.
        return res.json({
            translatedText,
            detectedLanguage: detectedCode || 'und',
            detectedLanguageName,
            targetLanguage: target.code,
            targetLanguageName:
                LANGUAGE_NAMES[target.code.toLowerCase()] ||
                target.requested
        });

    } catch (error) {
        console.error('Translation error:', error);

        return res.status(502).json({
            error: 'Translation provider unavailable.',
            details: String(
                error && error.message
                    ? error.message
                    : error
            )
        });
    }
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Blue Mode Translation API listening on port ${PORT}`
    );
});
