# LCForge v0.3 – Demo

LCForge is a small full‑stack tool that generates **draft LC/HPLC methods** for a given drug name and analytical context, currently running in **demo_fallback** mode (no live AI calls yet).[web:385][web:389]

---

## Project purpose

- Capture LC/QbD method design thinking in a repeatable web tool.  
- Let users enter drug name, sample type, and technique, then generate a structured draft method and a simple PDF “report”.  
- Run safely in two modes:
  - `demo_fallback`: deterministic, non‑AI demo output (current).  
  - `ai_live`: real LLM‑generated methods, when you decide to enable OpenAI quota.[web:390][web:345]

---

## Tech stack

- Frontend: React + Vite + TypeScript.  
- Backend: Node.js + Express.  
- PDF generation: client‑side utility (`src/utils/pdfGenerator.ts`).[web:385][web:386]

---

## Getting started (local)

1. Clone and install:

   ```bash
   git clone https://github.com/gmk777-ui/lcforge-v2.git
   cd lcforge-v2
   npm install
   ```

2. Create a `.env` in the project root based on `.env.example`:

   ```env
   OPENAI_API_KEY=your-openai-key-here   # not used in demo_fallback mode
   PORT=5000
   VITE_BACKEND_URL=http://localhost:5000
   ```

3. Start backend:

   ```bash
   node server/server.js
   ```

4. Start frontend:

   ```bash
   npm run dev
   ```

5. Open the app:

   - Visit `http://localhost:5173` in your browser.  
   - You should see the LCForge UI and “backend status: ok …” once `/health` responds.

---

## API endpoints

Base URL (local):

```text
http://localhost:5000
```

- `GET /health`  
  - Purpose: quick backend health check.  
  - Response (example):

    ```json
    {
      "status": "ok",
      "message": "LCForge backend is running",
      "mode": "demo_fallback"
    }
    ```

- `POST /api/generate`  
  - Body:

    ```json
    {
      "drugName": "Aspirin",
      "sampleType": "API",
      "technique": "HPLC"
    }
    ```

  - Response (simplified):

    ```json
    {
      "status": "ok",
      "mode": "demo_fallback",
      "result": {
        "method": {
          "title": "Draft HPLC Method for Aspirin (Backend Demo Fallback)",
          "column": "C18, 150 × 4.6 mm, 5 µm",
          "mobilePhase": "Acetonitrile : 0.1% formic acid (60:40, v/v)",
          "flowRate": "1.0 mL/min",
          "detection": "UV at 240 nm"
        },
        "notes": "...",
        "meta": { "timestamp": "..." }
      }
    }
    ```

In `demo_fallback` mode, this response is deterministic and does **not** call OpenAI.[web:350][web:390]

---

## Modes: demo vs AI

- `demo_fallback` (current default)
  - Backend always returns a safe, fixed‑template method.  
  - Frontend shows “Demo fallback method (no AI quota / AI error).”  
  - No OpenAI calls are made; you can run without any valid key.

- `ai_live` (future)
  - Backend will call OpenAI, populate `aiResult`, and return richer methods.  
  - Frontend will show “AI‑generated LC method (live mode).”  
  - Error handling: if the key is missing/invalid or OpenAI fails, backend falls back to `demo_fallback` and the UI still works.

---

## SOP: manual test flow

Use this as a quick checklist before deployments:

1. Start backend (`node server/server.js`).  
2. Start frontend (`npm run dev`) and open `http://localhost:5173`.  
3. Generate methods for 3–5 drugs (vary sample type and technique).  
4. Download PDFs for each and visually check title, method fields, and notes.  
5. Stop backend, refresh the frontend:
   - Confirm you see “Error contacting LCForge backend. Please try again.” and backend status shows an error.  
6. (When AI is enabled later) temporarily break the OpenAI key and confirm:
   - `/api/generate` responds in `demo_fallback` mode.
   - UI remains usable and clearly indicates demo mode.[web:393]