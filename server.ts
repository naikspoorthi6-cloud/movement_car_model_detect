import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Support high resolution mobile photo uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Helper to initialize Google GenAI SDK
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: Check API health / readiness
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API Route: Analyze Car Image
app.post('/api/analyze-car', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please upload or capture an image.',
      });
    }

    // Clean base64 data if it contains a data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const ai = getGeminiClient();

    const prompt = `You are an expert automotive vehicle inspection and detection AI.
Analyze this image thoroughly to detect any motor vehicles (cars, trucks, SUVs, vans, supercars, sports cars, convertibles, electric vehicles, classic cars).

Tasks:
1. Determine if there are any vehicles present in the image.
2. If vehicles are detected, detect EACH visible vehicle (supporting multiple vehicles in one photo).
3. For each detected vehicle, identify:
   - Make / Manufacturer (e.g., Porsche, Toyota, BMW, Tesla, Ford, Ferrari, Honda, etc. If uncertain, provide most likely make)
   - Model (e.g., 911 GT3, Camry, Model 3, Mustang GT, F-150, Civic, etc.)
   - Generation / Estimated Year Range (e.g., "2020-2023", "1998-2002")
   - Exterior Colour Name (e.g., "Guards Red", "Chalk Grey", "Midnight Blue Metallic", "Obsidian Black", "Pearl White")
   - Approximate Hex Color code for the vehicle's paint (e.g., "#C41E3A", "#F4F4F6", "#1E3F66")
   - Vehicle Category (one of: "Sedan", "SUV", "Coupe", "Sports Car", "Supercar", "Hypercar", "Hatchback", "Convertible", "Truck / Pickup", "Van / Minivan", "Wagon / Estate", "Electric / EV", "Classic / Vintage", "Crossover")
   - Approximate Confidence (integer 0 to 100)
   - Body Style (e.g., "2-door coupe", "4-door sedan", "5-door compact crossover", "Crew cab pickup")
   - Movement Status (one of: "Stationary (Parked)", "In Motion (Cruising / Driving)", "In Motion (High Speed / Track)", "Idling in Traffic", "Maneuvering / Parking")
   - Estimated Speed State (e.g. "0 km/h (Stationary)", "Low Speed (10-30 km/h)", "Moderate Speed (40-70 km/h)", "Highway Speed (80+ km/h)")
   - Motion Visual Cues (e.g. "Spoke rotational blur", "Road surface motion streaks", "Driver visible at wheel", "Parked at curb", "Brake lights on")
   - 3 to 6 Distinctive Design / Engineering Features visible or characteristic of this model (e.g. "Signature kidney grille", "Aerodynamic active rear wing", "Flush door handles", "Quad exhaust tips", "Dual-slat LED headlamps")
   - Location description in image (e.g., "Main foreground center", "Background left lane", "Parked on the right side")
   - Approximate Bounding Box coordinates normalized to percentages 0 to 100: ymin (top %), xmin (left %), ymax (bottom %), xmax (right %). Ensure ymin < ymax and xmin < xmax.
   - Concise 1-2 sentence vehicle summary highlighting its identity, motion state, and design.
4. Provide a general scene description (e.g., "Outdoor scenic mountain road during golden hour", "Urban street parking", "Indoor auto exhibition").
5. If NO vehicles are found, set hasVehicles to false and explain why politely in detectionNotes.

Respond strictly with valid JSON conforming to the requested schema.`;

    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
    ];
    let lastError: any = null;
    let responseText: string | null = null;

    // Multi-pass resilient retry: Try models with backoff if experiencing high demand (503/429)
    const MAX_ROUNDS = 2;
    for (let round = 1; round <= MAX_ROUNDS && !responseText; round++) {
      for (const modelName of modelsToTry) {
        try {
          const generatePromise = ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  hasVehicles: {
                    type: Type.BOOLEAN,
                    description: 'Whether any motor vehicles were detected in the image',
                  },
                  sceneDescription: {
                    type: Type.STRING,
                    description: 'Brief overview of the setting or environment',
                  },
                  vehiclesCount: {
                    type: Type.INTEGER,
                    description: 'Number of detected vehicles',
                  },
                  vehicles: {
                    type: Type.ARRAY,
                    description: 'List of detected vehicles in the image',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: 'Unique identifier like car-1, car-2' },
                        make: { type: Type.STRING, description: 'Car manufacturer brand' },
                        model: { type: Type.STRING, description: 'Car model name' },
                        yearRange: { type: Type.STRING, description: 'Estimated model year or generation' },
                        colorName: { type: Type.STRING, description: 'Exterior color name' },
                        colorHex: { type: Type.STRING, description: 'Approximate 6-digit hex color code e.g. #D32F2F' },
                        category: { type: Type.STRING, description: 'Vehicle classification type' },
                        confidence: { type: Type.INTEGER, description: 'Confidence score from 0 to 100' },
                        bodyStyle: { type: Type.STRING, description: 'Body configuration' },
                        fuelType: { type: Type.STRING, description: 'Engine/powertrain type' },
                        movementStatus: { type: Type.STRING, description: 'Motion status e.g. In Motion or Stationary' },
                        estimatedSpeedState: { type: Type.STRING, description: 'Estimated speed class e.g. Cruising or 0 km/h' },
                        motionVisualCues: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Visual evidence of movement or stationary state',
                        },
                        distinctiveFeatures: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Identifiable exterior design features',
                        },
                        locationInImage: { type: Type.STRING, description: 'Position in photo' },
                        box2d: {
                          type: Type.OBJECT,
                          description: 'Normalized bounding box percentages (0 to 100)',
                          properties: {
                            ymin: { type: Type.NUMBER, description: 'Top edge percentage (0-100)' },
                            xmin: { type: Type.NUMBER, description: 'Left edge percentage (0-100)' },
                            ymax: { type: Type.NUMBER, description: 'Bottom edge percentage (0-100)' },
                            xmax: { type: Type.NUMBER, description: 'Right edge percentage (0-100)' },
                          },
                          required: ['ymin', 'xmin', 'ymax', 'xmax'],
                        },
                        summary: { type: Type.STRING, description: 'Quick executive summary of the vehicle' },
                      },
                      required: ['id', 'make', 'model', 'yearRange', 'colorName', 'colorHex', 'category', 'confidence', 'distinctiveFeatures'],
                    },
                  },
                  detectionNotes: {
                    type: Type.STRING,
                    description: 'Additional observations, advice, or remarks on lighting/angle',
                  },
                },
                required: ['hasVehicles', 'sceneDescription', 'vehiclesCount', 'vehicles'],
              },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${modelName} took longer than 12s`)), 12000)
          );

          const response = await Promise.race([generatePromise, timeoutPromise]);

          if (response && response.text) {
            responseText = response.text;
            break; // Success!
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} attempt (Round ${round}) failed:`, err?.message?.slice(0, 120) || err);
          // Wait 1000ms before trying next model to allow server capacity spike to subside
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!responseText && round < MAX_ROUNDS) {
        // Wait 2000ms before next retry round
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!responseText) {
      throw lastError || new Error('Empty response received from Gemini AI model.');
    }

    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Car detection analysis error:', error);
    
    // Parse raw JSON error if Gemini SDK returned a serialized API error
    let cleanMessage = error?.message || 'Failed to analyze vehicle image with AI.';
    try {
      if (typeof cleanMessage === 'string' && cleanMessage.trim().startsWith('{')) {
        const parsed = JSON.parse(cleanMessage);
        if (parsed?.error?.message) {
          cleanMessage = parsed.error.message;
        }
      }
    } catch {
      // Keep as string
    }

    // Friendly translation for 503 high demand spikes
    const isHighDemand =
      cleanMessage.includes('503') ||
      cleanMessage.toLowerCase().includes('high demand') ||
      cleanMessage.toLowerCase().includes('temporarily unavailable') ||
      cleanMessage.includes('UNAVAILABLE');

    const formattedError = isHighDemand
      ? 'The AI vision model is currently experiencing a temporary traffic spike on Google servers. Please tap "Retry Analysis" in a few seconds.'
      : cleanMessage;

    return res.status(500).json({
      success: false,
      isHighDemand,
      error: formattedError,
    });
  }
});

// Setup Vite for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Car Detection AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
