# Car Detection AI 🏎️🔍

An intelligent, mobile-friendly automotive vision scanner powered by **Google Gemini Vision AI**. **Car Detection AI** recognizes vehicle manufacturers, model lines, exterior paint finishes, automotive categories, dynamic movement states, and engineering signatures from photos or live camera feeds — with full multi-vehicle detection support.

---

## ✨ Features

- **Automotive Identification**: Recognizes vehicle manufacturer (make), exact model trim, and production era / generation (e.g., *Porsche 911 GT3 2017–2021*).
- **Exterior Paint & Color Analysis**: Identifies factory-style paint color names (e.g., *Chalk Grey*, *Guards Red*) and extracts approximate 6-digit hex color codes with live visual color swatches.
- **Vehicle Classification**: Categorizes vehicles into segments: Sports Car, Supercar, SUV, Sedan, Coupe, Truck / Pickup, Hatchback, Convertible, Electric Vehicle (EV), Classic / Vintage, etc.
- **Dynamic Movement & Speed Detection**:
  - Distinguishes between **Stationary (Parked)**, **In Motion (Cruising)**, **High Speed / Track**, and **Traffic Idling**.
  - Provides estimated speed tiers and catalogs visual motion evidence (rotational spoke blur, road streaks, illuminated brake lamps, driver presence).
- **Multi-Car Vision & Bounding Boxes**:
  - Detects all visible vehicles in street scenes, parking lots, or showrooms.
  - Draws interactive, numbered targeting bounding boxes over the photo with click-to-highlight navigation.
- **Dual Camera Modes**:
  - **Live Camera Viewfinder**: In-app camera with targeting reticle crosshairs, front/rear camera switching, real-time optical **Motion Radar** (`0% - 100%`), and **Auto-Snap on Vehicle Movement**.
  - **Quick Shutter**: Native mobile camera launcher (`capture="environment"`).
  - **Gallery & Drag-and-Drop**: Upload existing photos directly from your phone gallery or desktop.
- **1-Click Test Vehicles**: Built-in sample presets (Porsche 911 GT3, Urban Street Multi-Car, Range Rover Defender, Vintage Mustang) for instant demonstration.
- **Audio Speech Verdict**: Listen to the vehicle inspection analysis read aloud via built-in Web Speech synthesis.
- **Resilient AI Failover Architecture**: Automatic fallback across Gemini vision models (`gemini-flash-lite-latest`, `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3-flash-preview`) with backoff retry to guarantee high availability during upstream traffic surges.
- **Mobile Cockpit UI**: Cyber-automotive dark theme (`#080c16`) with glowing cyan/amber telemetry accents, animated laser HUD scanlines, and one-handed mobile ergonomics.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Custom Automotive HUD Animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend / API**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx)
- **AI Vision Engine**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) (Google Gemini Vision Models)

---

## 🔒 Security & Architecture

This project strictly follows server-side security standards:
- **No Client-Side API Keys**: The client browser never imports `@google/genai` or accesses `process.env.GEMINI_API_KEY`.
- **Protected Backend Proxy**: All AI inference requests pass through a secure Express endpoint (`POST /api/analyze-car`), keeping your Gemini API key protected on the server.
- **Zero Secrets in Git**: Sensitive `.env*` files are excluded in `.gitignore`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/car-detection-ai.git
cd car-detection-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and configure your Gemini API Key:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

---

## 📱 Mobile & Android APK Conversion

### Option A: Compile Native Android APK with Capacitor (Recommended)

You can turn this project into a native Android app in minutes using **Capacitor** and **Android Studio**:

1. Install Capacitor dependencies:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera
   ```

2. Initialize Capacitor:
   ```bash
   npx cap init "Car Detection AI" com.cardetection.ai --web-dir dist
   ```

3. Build the web app and add Android platform:
   ```bash
   npm run build
   npx cap add android
   npx cap sync android
   ```

4. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```

5. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate `app-debug.apk`.

---

### Option B: Progressive Web App (PWA) Install

No compilation required:
1. Open the hosted web URL in **Google Chrome** on your Android smartphone.
2. Tap the three dots menu (**⋮**) in Chrome.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The app will launch in standalone full-screen mode with native hardware camera access.

---

## 📁 Project Structure

```text
├── index.html                   # HTML entry point with SEO metadata
├── metadata.json                # AI Studio application capabilities & frame permissions
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Secure Express backend with Gemini Vision API integration
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with Tailwind CSS plugin
└── src/
    ├── main.tsx                 # React DOM mount entry
    ├── App.tsx                  # Main application state and view logic
    ├── index.css                # Global styles, Tailwind imports, and HUD animations
    ├── types.ts                 # TypeScript interfaces for vehicle analysis
    ├── components/
    │   ├── Header.tsx           # Automotive branding header & navigation
    │   ├── CameraCaptureModal.tsx# Viewfinder with optical motion radar & auto-snap
    │   ├── ScanningHud.tsx      # Animated laser scanline & telemetry progress
    │   ├── VehicleDetectionOverlay.tsx # Interactive bounding boxes over car photos
    │   ├── VehicleCard.tsx      # Detailed car report, color swatch & TTS readout
    │   └── AndroidGuideModal.tsx# In-app interactive Android APK conversion guide
    ├── data/
    │   └── samples.ts           # Curated 1-click test vehicles
    └── utils/
        └── imageUtils.ts        # Canvas resizing, base64 conversion & image optimizer
```

---

## 📄 License

This project is open-source and available under the [Apache-2.0 License](LICENSE).
