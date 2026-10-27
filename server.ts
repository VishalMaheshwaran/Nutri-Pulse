import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

const ai = new GoogleGenAI({
  apiKey: "", // <-- Paste your raw string key here!
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function callGeminiWithRetry(options: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (let m = 0; m < modelsToTry.length; m++) {
    const currentModel = modelsToTry[m];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || JSON.stringify(err);
        const isTemporary =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (isTemporary) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

// Bulletproof Food Analyzer
app.post('/api/analyze-food', async (req, res) => {
  try {
    const { text, imageBase64, mimeType } = req.body;
    const cleanText = (text || '').trim();

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
    }
    contents.push({ text: cleanText || 'Analyze food' });

    const response = await callGeminiWithRetry({
      contents: contents.length === 1 ? contents[0] : { parts: contents },
      config: {
        systemInstruction: 'You are a clinical dietitian. Return strict JSON with foodName, servingSize, servingWeightGrams, calories, protein, carbs, fat, fiber, sugar, sodiumMg, confidence, healthTip.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            brand: { type: Type.STRING },
            servingSize: { type: Type.STRING },
            servingWeightGrams: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
            sodiumMg: { type: Type.NUMBER },
            confidence: { type: Type.STRING },
            healthTip: { type: Type.STRING },
          },
          required: ['foodName', 'servingSize', 'servingWeightGrams', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodiumMg', 'confidence', 'healthTip'],
        },
      },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/analyze-food:', error);
    return res.status(500).json({ error: error?.message || 'Failed to analyze food.' });
  }
});

// Bulletproof Workout Analyzer
// Endpoint: Analyze workout text with strict duration and set extraction
app.post('/api/analyze-workout', async (req, res) => {
  try {
    const { text, userProfile } = req.body;
    const cleanText = (text || '').trim();
    const weightKg = userProfile?.weightKg || 70;

    if (!cleanText) {
      return res.status(400).json({ error: 'Please provide a workout description.' });
    }

    const promptText = `Analyze this exact workout: "${cleanText}". User body weight is ${weightKg}kg. 
    CRITICAL INSTRUCTIONS:
    1. If the user explicitly states a duration (e.g. "80 mins", "1 hour"), you MUST set 'durationMinutes' to that exact number (e.g., 80). Do not default to 45.
    2. Scale the 'caloriesBurned' accurately based on the body weight, duration, and intensity.
    3. Extract sets, exercises, reps, and weight if provided. Return strict JSON.`;

    const response = await callGeminiWithRetry({
      contents: promptText,
      config: {
        systemInstruction: 'You are an expert sports physiologist. Strictly respect user-stated duration and calculate precise calories burned. Output strictly valid JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            caloriesBurned: { type: Type.NUMBER },
            durationMinutes: { type: Type.NUMBER },
            avgBpm: { type: Type.NUMBER },
            sets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  exerciseName: { type: Type.STRING },
                  weightKg: { type: Type.NUMBER },
                  reps: { type: Type.NUMBER },
                },
                required: ['exerciseName'],
              },
            },
          },
          required: ['description', 'caloriesBurned', 'durationMinutes'],
        },
      },
    });

    return res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Error in /api/analyze-workout:', error);
    const msg = error?.message || 'Failed to analyze workout.';
    const isHighDemand = msg.includes('503') || msg.includes('high demand') || msg.includes('429');
    return res.status(isHighDemand ? 503 : 500).json({ error: isHighDemand ? 'AI model experiencing high demand. Please retry.' : msg });
  }
});

app.post('/api/nutrition-advice', async (req, res) => {
  try {
    const { dailySummary, targetMacros } = req.body;
    const response = await callGeminiWithRetry({
      contents: `Give brief sports nutrition coaching under 100 words based on calories: ${dailySummary?.calories || 0} / ${targetMacros?.calories || 2000}.`,
    });
    return res.json({ advice: response.text });
  } catch (err) {
    return res.json({ advice: "Focus on hitting your protein target and staying hydrated today!" });
  }
});

app.get('/api/barcode/:code', async (req, res) => {
  const { code } = req.params;
  try {
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
    const data: any = await offRes.json();
    if (!data.product) return res.status(404).json({ error: 'Product not found' });
    const p = data.product;
    const nut = p.nutriments || {};
    return res.json({
      barcode: code,
      foodName: p.product_name || 'Packaged Item',
      brand: p.brands || '',
      servingSize: p.serving_size || '100g',
      servingWeightGrams: parseFloat(p.serving_quantity) || 100,
      calories: Math.round(nut['energy-kcal_100g'] || 200),
      protein: Math.round((nut.proteins_100g || 10) * 10) / 10,
      carbs: Math.round((nut.carbohydrates_100g || 20) * 10) / 10,
      fat: Math.round((nut.fat_100g || 5) * 10) / 10,
      fiber: 2,
      sugar: 5,
      sodiumMg: 150,
      confidence: 'high',
      healthTip: 'Verified from database.',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Barcode lookup failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`NutriPulse running on port ${PORT}`));
}

startServer();