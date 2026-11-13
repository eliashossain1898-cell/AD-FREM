import 'dotenv/config';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { GoogleGenAI, Type } from '@google/genai';
import express from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const execFileAsync = promisify(execFile);
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const CUTOUTS_DIR = path.join(PUBLIC_DIR, 'cutouts');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

await Promise.all([
  fs.mkdir(OUT_DIR, { recursive: true }),
  fs.mkdir(UPLOADS_DIR, { recursive: true }),
  fs.mkdir(CUTOUTS_DIR, { recursive: true }),
  fs.mkdir(AUDIO_DIR, { recursive: true }),
]);

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/out', express.static(OUT_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
});

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/ai/generate-copy', async (req, res) => {
  try {
    const {
      productName,
      category = 'luxury',
      offerPrice = '৳২,৪৯০',
      originalPrice = '৳৪,৫০০',
      keyBenefit = '',
    } = req.body ?? {};

    if (!productName || typeof productName !== 'string') {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(400).json({
        error:
          'GEMINI_API_KEY is not configured in environment secrets. Set it in Settings > Secrets.',
      });
      return;
    }

    const prompt = `You are a top Bangladeshi direct-response Reels & TikTok ad copywriter.
Create high-converting Bangla commercial ad copy for a 9:16 vertical short video ad.
Product: ${productName}
Category: ${category}
Offer Price: ${offerPrice}
Original Price: ${originalPrice}
Key Benefit: ${keyBenefit || 'Premium quality and fast Cash on Delivery across Bangladesh'}

Rules:
- hookHeadline: 4 to 7 punchy Bangla words that stop scrolling in the first 3 seconds.
- hookSubline: 2 to 4 crisp uppercase English words (e.g. "LIMITED EDITION · 45% OFF").
- voiceoverScript: 25 to 40 natural spoken Bangla words optimized for Edge-TTS narration, ending with a Cash on Delivery call to action.
- discountLabel: Short Bangla badge text (e.g. "৪৫% স্পেশাল ছাড়").
- ctaHeading: 3 to 5 Bangla words for the end screen.
- ctaSubtext: Short Cash-on-Delivery assurance in Bangla (e.g. "সারা দেশে ক্যাশ অন ডেলিভারি").`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hookHeadline: { type: Type.STRING },
            hookSubline: { type: Type.STRING },
            voiceoverScript: { type: Type.STRING },
            discountLabel: { type: Type.STRING },
            ctaHeading: { type: Type.STRING },
            ctaSubtext: { type: Type.STRING },
          },
          required: [
            'hookHeadline',
            'hookSubline',
            'voiceoverScript',
            'discountLabel',
            'ctaHeading',
            'ctaSubtext',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({ ok: true, copy: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate ad copy.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/voice/generate', async (req, res) => {
  try {
    const {
      script,
      voice = 'bn-BD-PradeepNeural',
      rate = '+4%',
      bgmSrc,
      campaignId = 'ad',
    } = req.body ?? {};

    if (!script || typeof script !== 'string' || !script.trim()) {
      res.status(400).json({ error: 'Bangla voiceover script is required.' });
      return;
    }

    const safeId = `${String(campaignId).replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}`;
    const outAudioRel = `audio/${safeId}.mp3`;
    const outJsonRel = `audio/${safeId}.json`;
    const outVttRel = `audio/${safeId}.vtt`;
    const outMixedRel = `audio/${safeId}_mixed.mp3`;

    const args = [
      'generate_voice.py',
      '--text',
      script.trim(),
      '--voice',
      String(voice),
      '--rate',
      String(rate),
      '--out-audio',
      path.join('public', outAudioRel),
      '--out-json',
      path.join('public', outJsonRel),
      '--out-vtt',
      path.join('public', outVttRel),
      '--fps',
      '30',
    ];

    if (bgmSrc && typeof bgmSrc === 'string') {
      const cleanBgm = bgmSrc.replace(/^\/+/, '');
      const resolvedBgm = path.join(PUBLIC_DIR, cleanBgm);
      args.push('--bgm', resolvedBgm, '--out-mixed', path.join('public', outMixedRel));
    }

    const { stdout } = await execFileAsync('python3', args, {
      cwd: ROOT_DIR,
      timeout: 60_000,
    });

    const result = JSON.parse(stdout.trim());
    const captionPayload = JSON.parse(
      await fs.readFile(path.join(PUBLIC_DIR, outJsonRel), 'utf-8')
    );

    res.json({
      ok: true,
      audioSrc: result.mixedAudioPath ? outMixedRel : outAudioRel,
      rawVoiceSrc: outAudioRel,
      vttSrc: outVttRel,
      jsonSrc: outJsonRel,
      durationMs: captionPayload.durationMs,
      recommendedFrames: captionPayload.durationInFrames,
      captions: captionPayload.captions,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Edge-TTS voice generation failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const relPath = `uploads/${req.file.filename}`;
    const ext = path.extname(req.file.filename).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.webm', '.m4v'].includes(ext);
    const isAudio = ['.mp3', '.wav', '.m4a', '.aac'].includes(ext);

    res.json({
      ok: true,
      path: relPath,
      mediaType: isVideo ? 'video' : isAudio ? 'audio' : 'image',
      originalName: req.file.originalname,
      sizeBytes: req.file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/media/remove-bg', async (req, res) => {
  try {
    const { imagePath } = req.body ?? {};
    if (!imagePath || typeof imagePath !== 'string') {
      res.status(400).json({ error: 'imagePath is required.' });
      return;
    }

    const cleanRel = imagePath.replace(/^\/+/, '');
    const inputAbs = path.resolve(PUBLIC_DIR, cleanRel);
    if (!inputAbs.startsWith(PUBLIC_DIR)) {
      res.status(400).json({ error: 'Invalid image path.' });
      return;
    }

    const outName = `cutout_${Date.now()}.png`;
    const outRel = `cutouts/${outName}`;
    const outAbs = path.join(PUBLIC_DIR, outRel);

    const { stdout } = await execFileAsync(
      'python3',
      ['remove_bg.py', inputAbs, outAbs],
      {
        cwd: ROOT_DIR,
        timeout: 90_000,
      }
    );

    const parsed = JSON.parse(stdout.trim());
    res.json({
      ok: true,
      cutoutSrc: outRel,
      width: parsed.width,
      height: parsed.height,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Background removal failed.';
    res.status(500).json({ error: message });
  }
});

app.post('/api/render', async (req, res) => {
  try {
    const config = req.body?.config;
    if (!config || typeof config !== 'object') {
      res.status(400).json({ error: 'Composition config is required.' });
      return;
    }

    const timestamp = Date.now();
    const safeName = `${String(config.id || 'reel').replace(/[^a-zA-Z0-9_-]/g, '')}_${timestamp}`;
    const propsPath = path.join(OUT_DIR, `${safeName}_props.json`);
    const outputMp4 = path.join(OUT_DIR, `${safeName}.mp4`);

    await fs.writeFile(propsPath, JSON.stringify(config, null, 2), 'utf-8');

    const renderLog: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        'npx',
        [
          'remotion',
          'render',
          'src/remotion/index.ts',
          'BanglaCommercialAd',
          outputMp4,
          `--props=${propsPath}`,
          '--overwrite',
        ],
        { cwd: ROOT_DIR }
      );

      child.stdout.on('data', (chunk) => renderLog.push(chunk.toString()));
      child.stderr.on('data', (chunk) => renderLog.push(chunk.toString()));
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Remotion render exited with code ${code}. ${renderLog.slice(-6).join('')}`
            )
          );
        }
      });
    });

    const stat = await fs.stat(outputMp4);
    res.json({
      ok: true,
      downloadUrl: `/out/${safeName}.mp4`,
      filename: `${safeName}.mp4`,
      sizeBytes: stat.size,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'MP4 render failed.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(ROOT_DIR, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(ROOT_DIR, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`AdFrame Studio listening on http://localhost:${port}`);
  });
}

startServer();
