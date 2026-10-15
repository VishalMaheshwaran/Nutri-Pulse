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

// Explicit CORS-enabled routes for PWA Web Manifests
app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

// Download full project codebase as ZIP
app.get('/api/download-project-zip', async (_req, res) => {
  try {
    const { execSync } = await import('child_process');
    const zipPath = path.resolve('/tmp', 'nutripulse-project.zip');
    execSync('python3 scripts/create-zip.py . /tmp/nutripulse-project.zip', { cwd: __dirname });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="nutripulse-complete-project.zip"');
    res.sendFile(zipPath);
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ error: 'Failed to generate project zip: ' + err?.message });
  }
});


// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cache for ultra-fast response on repeated text descriptions
const foodAnalysisCache = new Map<string, any>();

// Resilient Gemini runner with automatic exponential backoff & fallback models for 503 / high demand spikes
async function callGeminiWithRetry(options: {
  contents: any;
  config?: any;
  models?: string[];
}) {
  const modelsToTry = options.models || ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
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
          console.warn(`[Gemini] ${currentModel} returned temporary spike (attempt ${attempt + 1}): ${msg}. Retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
          continue;
        } else {
          break;
        }
      }
    }
  }

  throw lastError;
}

// Endpoint: Analyze food text or image via Gemini with resilience
app.post('/api/analyze-food', async (req, res) => {
  try {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either food description text or an image.' });
    }

    const cleanText = (text || '').trim();

    // Check fast-path memory cache for identical text-only queries
    if (!imageBase64 && cleanText) {
      const cacheKey = cleanText.toLowerCase();
      if (foodAnalysisCache.has(cacheKey)) {
        return res.json(foodAnalysisCache.get(cacheKey));
      }
    }

    const contents: any[] = [];

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const promptText = cleanText
      ? `Analyze this food / meal or nutrition facts label: "${cleanText}". If an image is provided, inspect the visible meal items, portion sizes, or nutrition label table closely. Provide accurate estimates of calories and macronutrients (protein, carbs, fat, fiber, sugar, sodium).`
      : 'Analyze this food photo or nutrition facts label. Identify all visible food items, estimate reasonable portion sizes, and calculate accurate macronutrients (protein, carbs, fat, fiber, sugar, sodium).';

    contents.push({ text: promptText });

    // Use gemini-3.1-flash-lite for text NLP (instant sub-second latency), gemini-3.8-flash for vision
    const preferredModels = imageBase64
      ? ['gemini-3.8-flash', 'gemini-3.1-flash-lite']
      : ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    const response = await callGeminiWithRetry({
      models: preferredModels,
      contents: contents.length === 1 ? contents[0] : { parts: contents },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are an expert clinical dietitian and nutrition scientist. Accurately identify foods, portion sizes, calories, macronutrients in grams (protein, carbohydrates, total fat, dietary fiber, sugar), and sodium in milligrams. If a photo shows a nutrition label, transcribe the exact numbers. If it shows prepared food, estimate portions realistically based on standard dietary databases (USDA FoodData Central). Always output valid JSON conforming to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: 'Primary name of the food or meal' },
            brand: { type: Type.STRING, description: 'Brand name if visible on packaging, else generic' },
            servingSize: { type: Type.STRING, description: 'Human-readable serving (e.g., "1 bowl (280g)", "2 slices", "1 plate")' },
            servingWeightGrams: { type: Type.NUMBER, description: 'Approximate weight in grams' },
            calories: { type: Type.NUMBER, description: 'Total kilocalories (kcal)' },
            protein: { type: Type.NUMBER, description: 'Protein in grams' },
            carbs: { type: Type.NUMBER, description: 'Total carbohydrates in grams' },
            fat: { type: Type.NUMBER, description: 'Total fat in grams' },
            fiber: { type: Type.NUMBER, description: 'Dietary fiber in grams' },
            sugar: { type: Type.NUMBER, description: 'Total sugars in grams' },
            sodiumMg: { type: Type.NUMBER, description: 'Sodium in milligrams' },
            confidence: { type: Type.STRING, description: 'Estimation confidence: high, medium, or low' },
            breakdown: {
              type: Type.ARRAY,
              description: 'List of individual components identified in the meal',
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  portion: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                },
                required: ['item', 'portion', 'calories', 'protein', 'carbs', 'fat'],
              },
            },
            dietaryTags: {
              type: Type.ARRAY,
              description: 'Dietary characteristics like High Protein, Gluten Free, Dairy Free, Vegan, etc.',
              items: { type: Type.STRING },
            },
            healthTip: {
              type: Type.STRING,
              description: '1-2 sentences of practical dietary insights or macro optimization tip',
            },
          },
          required: [
            'foodName',
            'servingSize',
            'servingWeightGrams',
            'calories',
            'protein',
            'carbs',
            'fat',
            'fiber',
            'sugar',
            'sodiumMg',
            'confidence',
            'healthTip',
          ],
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('No output returned from Gemini');
    }

    const parsed = JSON.parse(textOutput);

    // Save in cache
    if (!imageBase64 && cleanText) {
      foodAnalysisCache.set(cleanText.toLowerCase(), parsed);
      if (foodAnalysisCache.size > 200) {
        const firstKey = foodAnalysisCache.keys().next().value;
        if (firstKey) foodAnalysisCache.delete(firstKey);
      }
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/analyze-food:', error);
    const msg = error?.message || 'Failed to analyze food nutrition.';
    const isHighDemand = msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE');

    return res.status(isHighDemand ? 503 : 500).json({
      error: isHighDemand
        ? 'Google AI Studio model is currently experiencing high demand. Please click Retry in a few seconds.'
        : msg,
    });
  }
});

// Endpoint: AI Nutritionist Coaching & Daily Macro Review
app.post('/api/nutrition-advice', async (req, res) => {
  try {
    const { dailySummary, targetMacros, userProfile, userQuery } = req.body;

    const prompt = `
Context:
User Profile: Goal: ${userProfile?.goal || 'Maintain Weight'}, Weight: ${userProfile?.weightKg || 70}kg${userProfile?.bodyFatPct ? `, Body Fat: ${userProfile.bodyFatPct}% (Lean Body Mass: ${(userProfile.weightKg * (1 - userProfile.bodyFatPct / 100)).toFixed(1)}kg)` : ''}, Daily Calorie Goal: ${targetMacros?.calories || 2000} kcal.
Daily Target: Calories: ${targetMacros?.calories || 2000} kcal, Protein: ${targetMacros?.protein || 140}g, Carbs: ${targetMacros?.carbs || 220}g, Fat: ${targetMacros?.fat || 65}g.
Current Logged Intake Today:
- Calories: ${dailySummary?.calories || 0} kcal (${Math.round(((dailySummary?.calories || 0) / (targetMacros?.calories || 2000)) * 100)}% of goal)
- Protein: ${dailySummary?.protein || 0}g / ${targetMacros?.protein || 140}g
- Carbs: ${dailySummary?.carbs || 0}g / ${targetMacros?.carbs || 220}g
- Fat: ${dailySummary?.fat || 0}g / ${targetMacros?.fat || 65}g
- Fiber: ${dailySummary?.fiber || 0}g
- Meals Logged: ${JSON.stringify(dailySummary?.meals || [])}

User Question/Request: ${userQuery || 'Give me a brief macro status analysis and 2-3 specific meal/snack ideas to hit my remaining targets today.'}
    `;

    const response = await callGeminiWithRetry({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are a friendly, scientifically grounded sports nutritionist and health coach. Provide concise, actionable advice (under 250 words) with specific food recommendations, macro balancing tips, and encouraging guidance based on their actual numbers today.',
      },
    });

    return res.json({ advice: response.text });
  } catch (error: any) {
    console.error('Error in /api/nutrition-advice:', error);
    const msg = error?.message || 'Failed to generate nutrition advice.';
    const isHighDemand = msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE');

    return res.status(isHighDemand ? 503 : 500).json({
      error: isHighDemand
        ? 'Google AI Studio model is currently experiencing high demand. Please try asking again in a few seconds.'
        : msg,
    });
  }
});

// Endpoint: OpenFoodFacts Barcode Lookup Proxy
app.get('/api/barcode/:code', async (req, res) => {
  const { code } = req.params;
  const barcode = (code || '').trim();

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode number required' });
  }

  try {
    // Query OpenFoodFacts v2 API
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    const offRes = await fetch(offUrl, {
      headers: {
        'User-Agent': 'NutriPulse-AI-Studio/1.0 (contact@nutripulse.local)',
      },
    });

    if (!offRes.ok) {
      return res.status(404).json({ error: `Product with barcode ${barcode} not found on OpenFoodFacts.` });
    }

    const data: any = await offRes.json();

    if (data.status === 0 || !data.product) {
      return res.status(404).json({ error: `No product details found for barcode ${barcode}.` });
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    // Standardize to 1 serving or 100g
    const servingSize = p.serving_size || '100g';
    const servingWeight = parseFloat(p.serving_quantity) || 100;

    // Use serving nutriments if available, otherwise per 100g
    const calories = Math.round(
      nutriments['energy-kcal_serving'] ??
      nutriments['energy-kcal_100g'] ??
      ((nutriments['energy_serving'] || nutriments['energy_100g'] || 0) / 4.184)
    );
    const protein = Math.round((nutriments.proteins_serving ?? nutriments.proteins_100g ?? 0) * 10) / 10;
    const carbs = Math.round((nutriments.carbohydrates_serving ?? nutriments.carbohydrates_100g ?? 0) * 10) / 10;
    const fat = Math.round((nutriments.fat_serving ?? nutriments.fat_100g ?? 0) * 10) / 10;
    const fiber = Math.round((nutriments.fiber_serving ?? nutriments.fiber_100g ?? 0) * 10) / 10;
    const sugar = Math.round((nutriments.sugars_serving ?? nutriments.sugars_100g ?? 0) * 10) / 10;
    const sodiumMg = Math.round((nutriments.sodium_serving ?? nutriments.sodium_100g ?? 0) * 1000);

    const productResult = {
      barcode,
      foodName: p.product_name || p.product_name_en || 'Packaged Food',
      brand: p.brands || '',
      servingSize,
      servingWeightGrams: servingWeight,
      calories: Math.max(0, calories),
      protein: Math.max(0, protein),
      carbs: Math.max(0, carbs),
      fat: Math.max(0, fat),
      fiber: Math.max(0, fiber),
      sugar: Math.max(0, sugar),
      sodiumMg: Math.max(0, sodiumMg),
      imageUrl: p.image_front_url || p.image_url || '',
      nutriscoreGrade: p.nutriscore_grade ? p.nutriscore_grade.toUpperCase() : null,
      ingredients: p.ingredients_text ? [p.ingredients_text] : [],
      confidence: 'high',
      healthTip: p.nutriscore_grade
        ? `Nutri-Score Grade ${p.nutriscore_grade.toUpperCase()}: Check serving portion to stay on track with your macros.`
        : 'Packaged product verified from open food database.',
    };

    return res.json(productResult);
  } catch (error: any) {
    console.error('Error fetching barcode:', error);
    return res.status(500).json({ error: error.message || 'Barcode lookup failed' });
  }
});

// Vite middleware mounting for development / static for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
