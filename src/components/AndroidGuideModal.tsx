import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Terminal,
  Check,
  Copy,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'testing' | 'android-studio' | 'expo' | 'pwa'>('testing');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const capacitorCommands = `# 1. Install Capacitor CLI & Core dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera

# 2. Initialize Capacitor project config
npx cap init "Car Detection AI" com.cardetection.ai --web-dir dist

# 3. Build the production web bundle
npm run build

# 4. Add Android native platform
npx cap add android

# 5. Sync your web build into Android project
npx cap sync android

# 6. Open project in Android Studio to build APK
npx cap open android
# (In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s))`;

  const expoSnippet = `// App.js for Expo Camera integration
import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Permission needed');
    const res = await ImagePicker.launchCameraAsync({ base64: true });
    if (!res.canceled) {
      analyzeVehicle(res.assets[0].base64);
    }
  };

  const analyzeVehicle = async (base64) => {
    const res = await fetch('YOUR_SERVER_URL/api/analyze-car', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 })
    });
    const data = await res.json();
    setResult(data.data);
  };

  return (
    <View style={styles.container}>
      <Button title="Snap Car Photo" onPress={takePhoto} />
      {result && <Text>{result.vehicles[0]?.make} {result.vehicles[0]?.model}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 20, justifyContent: 'center' } });`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Testing & Android APK Conversion Guide
              </h3>
              <p className="text-xs text-slate-400">
                Instructions for mobile testing and compiling native APK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('testing')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'testing'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> How to Test
          </button>
          <button
            onClick={() => setActiveTab('android-studio')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'android-studio'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> Android Studio (Capacitor)
          </button>
          <button
            onClick={() => setActiveTab('expo')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'expo'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Expo / React Native
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Instant Android PWA
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
          {activeTab === 'testing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
                  Testing with Sample Preset Vehicles
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click on any of the curated sample cards (Porsche 911 GT3, Multi-Car Street, Range Rover Defender, or Classic Mustang). The app will automatically send the vehicle image to Gemini 3.8 Flash Vision to detect the make, model, paint color, and automotive classification.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
                  Testing Camera Capture on Mobile
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tap <strong>"Take Photo"</strong>. On mobile devices and webcams, the live camera HUD will activate with rear/front camera switching and reticle targeting. On mobile browsers, the quick camera shutter opens native camera capture instantly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
                  Testing Multi-Car Image Detection
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload an image featuring parking lots or city streets with multiple cars. The AI analyzes each vehicle separately, draws bounding box overlays on the photo, and renders an individual card for each detected car.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'android-studio' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                You can convert this exact React & Vite application into a native Android APK using <strong>Capacitor</strong> and compile it with <strong>Android Studio</strong>:
              </p>

              <div className="relative rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                <button
                  onClick={() => copyToClipboard(capacitorCommands, 'cap')}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                >
                  {copiedId === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'cap' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="pr-16">{capacitorCommands}</pre>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-xs text-cyan-200">
                <strong>Android Studio Steps:</strong>
                <ol className="list-decimal list-inside mt-1.5 space-y-1 text-slate-300 text-[11px]">
                  <li>Open the generated <code className="text-cyan-300 font-mono">android</code> directory in Android Studio.</li>
                  <li>In Android Studio, select <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.</li>
                  <li>Once built, click "locate" in the popup to get your ready-to-install <code className="text-cyan-300 font-mono">app-debug.apk</code>.</li>
                  <li>Transfer to your Android phone or install via ADB: <code className="text-cyan-300 font-mono">adb install app-debug.apk</code>.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'expo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                If you prefer creating an Expo React Native mobile project, initialize an Expo app with <code className="text-cyan-300 font-mono">npx create-expo-app CarDetectionApp</code> and wire up the camera to send images to this backend:
              </p>

              <div className="relative rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                <button
                  onClick={() => copyToClipboard(expoSnippet, 'expo')}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition"
                >
                  {copiedId === 'expo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'expo' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="pr-16">{expoSnippet}</pre>
              </div>

              <p className="text-[11px] text-slate-400">
                Run <code className="text-cyan-300 font-mono">npx eas build -p android --profile preview</code> in Expo to generate an installable Android APK over the cloud!
              </p>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  Instant Install on Android Phone (No APK Compilation Required)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  This application is fully responsive and supports mobile camera APIs. You can run it like a native Android app right now:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                  <li>Open this app URL in Google Chrome on your Android smartphone.</li>
                  <li>Tap the <strong>three dots menu (⋮)</strong> at the top right of Chrome.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app will install directly to your app launcher with full-screen experience and hardware camera support!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold tracking-wider uppercase transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
