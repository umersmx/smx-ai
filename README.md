<div align="center">
  <img src="./public/logo.svg" alt="SMX AI Logo" width="100" />
  <h1>SMX AI</h1>
  <p><strong>A Sleek, Glassmorphic Chatbot with Dynamic Multi-Provider Routing (Gemini & Groq)</strong></p>

  [![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://smx-ai.vercel.app)
  [![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Express-blue?style=flat-square)](#tech-stack)
  [![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
</div>

---

## 🚀 Overview

**SMX AI** is a state-of-the-art web-based conversational assistant featuring a gorgeous glassmorphic user interface, smooth animations, and a unified serverless backend. 

Engineered with flexible multi-provider capabilities, it dynamically inspects user-provided credentials to route requests either to **Google Gemini** or **Groq Cloud (Llama)** in real-time. It is fully responsive, SEO-optimized, and optimized for serverless deployments on platforms like Vercel.

---

## ✨ Features

- **🌐 Multi-Provider Auto-Routing:**
  - Automatically detects **Google Gemini API Keys** (starting with `AIza` or `AQ.`) and routes requests to `gemini-2.0-flash`.
  - Automatically detects **Groq Cloud API Keys** (starting with `gsk_`) and routes requests to `llama-3.3-70b-versatile`.
- **⚡ SSE Real-Time Streaming:** Seamless, low-latency Server-Sent Events (SSE) stream the AI's tokens as they are generated.
- **🎨 Premium Glassmorphic UI:** High-fidelity visuals utilizing tailored dark-mode gradients, interactive hover states, micro-animations, and full mobile responsiveness.
- **🔗 Smart Markdown Link Parser:** Custom inline parser parses markdown bolds (`**text**`) and links (`[label](url)`) as active, styled HTML anchors (`<a>`) with safe target headers.
- **🛡️ Adaptive Offline Reserve Mode:** If no API credentials are provided, the backend falls back to an offline simulated dialogue engine.
- **📦 Serverless Optimized:** Built-in ES Module bundling compatibility and dynamic Express integrations specifically tuned for Vercel functions lifecycle.

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- **AI Integrations:** Google Generative AI SDK, Groq Chat Completions API
- **Tooling & Hosting:** [Vite](https://vite.dev/), [esbuild](https://esbuild.github.io/), [Vercel Serverless](https://vercel.com/)

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### Installation & Run

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/umersmx/smx-ai.git
   cd smx-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_or_groq_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

The project is pre-configured to build and run seamlessly as a Vercel Serverless Function:

1. **Push your code** to a GitHub repository.
2. Go to the **Vercel Dashboard** and import the project.
3. Under **Project Settings > Environment Variables**, add:
   - `GEMINI_API_KEY`: Your default Gemini or Groq key.
4. Deploy! Vercel will automatically build the assets and route API calls to `api/index.ts`.

---

## 👨‍💻 Developer & Creator

**SMX AI** is designed, developed, and maintained by:

**Umer Farooq**
* 🎓 5th-Semester Computer Science Student
* 💼 Connect on [LinkedIn](https://linkedin.com/in/umersmx)
* 🐙 Check out projects on [GitHub](https://github.com/umersmx)
* 🌐 Visit portfolio at [umerfarooq.dev](https://umerfarooq.dev)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
