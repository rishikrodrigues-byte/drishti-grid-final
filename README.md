# 👁️ DRISHTI-GRID 2.0
**Autonomous Road Health Digital Twin & Contractor Accountability Platform**

Built for the **Google Solution Challenge 2026** to target UN SDGs 9.1, 11.2, 12.5, and 16.

### 🚀 The Innovation
Municipalities lose millions to reactive road maintenance and contractor "ghost fixes." DRISHTI-GRID solves this by repurposing discarded smartphones (E-waste) into zero-cost Edge-AI sensors mounted on municipal garbage trucks. 

### 🧠 Powered by Google Gemini 3 Flash
We utilize **Google Gemini 3 Flash Preview** via REST API as a Multimodal Civil Engineer:
- **3D Monocular Depth Estimation:** Calculates the exact volumetric Bitumen Payload (KG) required, mathematically capping contractor billing to prevent material fraud.
- **Smart Dispatch Engine:** Clusters work orders by jurisdiction, enforces Contractor SLAs, and uses a Live Weather Engine to automatically block "Hot-Mix" asphalt dispatch during monsoons.
- **Closed-Loop AI Verification:** Contractors are only paid when the Edge Node re-drives the coordinate and Gemini visually verifies the road is smooth, committing it to an immutable ledger.

### 🛠️ Tech Stack
- **AI Brain:** Google Gemini 3 Flash Preview (Vision)
- **Frontend/Edge Node:** Next.js (PWA), TypeScript, Tailwind CSS
- **Sensors:** HTML5 DeviceMotion API & Geolocation API
- **Cloud State:** Google Firebase Firestore