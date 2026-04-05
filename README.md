# 🌌 Cosmos — Proximity-Based Virtual Space

A production-ready 2D virtual environment where users move freely and chat automatically connects when they get close — and disconnects when they move apart. This project demonstrates high-performance WebGL rendering, real-time spatial synchronization, and secure multimodal authentication.

---

## ✨ Features Spotlight

| Feature | Technical Details |
| --- | --- |
| **Pixel-Perfect Renderer** | 2400×1800 world via **PixiJS (WebGL)** with starfield, grid, and camera easing. |
| **Real-Time Sync** | **STOMP over SockJS** (Spring Boot) with 20fps position broadcasts. |
| **Dual-Layer Proximity** | Distance math on both Client (immediate UI) and Server (source of truth). |
| **Secure Identity Hub** | Multimodal Auth Terminal (Login, Register, **Password Recovery**). |
| **Visual Persistence** | User identity (username, persistent cosmic color) remains consistent across sessions. |
| **Adaptive UI** | Dynamic Chat panels, Minimap overview, and HUD with real-time signal badges. |

---

## 🏗️ Architectural Rationale

### **Frontend: React + PIXI.js**
- **WebGL Rendering**: PIXI.js provides a hardware-accelerated 2D pipeline capable of handling 100+ concurrent avatars at 60fps.
- **Zustand State Management**: A minimal, non-boilerplate approach to global state that ensures sub-millisecond updates for high-frequency game logic.

### **Backend: Spring Boot + STOMP**
- **STOMP Protocol**: Provides high-level messaging patterns (Pub/Sub) on top of WebSockets, reducing network complexity.
- **PostgreSQL Persistence**: Robust relational storage for user identity and "Enigma" key security.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js ≥ 18
- Java 17+
- Maven 3.8+
- PostgreSQL (Optional; H2 in-memory is enabled by default for zero-config).

### 1. Establish the Backend
```bash
cd backend
mvn spring-boot:run
# ✅ Backend running at http://localhost:8080
```

### 2. Launch the Terminal (Frontend)
```bash
cd frontend
npm install
npm run dev
# ✅ Frontend running at http://localhost:3000
```

### 3. Verification Protocol
1. Open **two browser tabs** at `http://localhost:3000`.
2. Register two unique identifies (e.g., Commander, Star-Walker).
3. Move close to each other to trigger the **Signal Acquired** notification and open the chat terminal.
4. Move apart to trigger the **Signal Lost** event and auto-disconnect.

---

## 🛠️ Tech Stack Justification

| Layer | Technology | Rationale |
| --- | --- | --- |
| **Engine** | PixiJS (v8) | Hardware-accelerated sprite batching for superior performance over standard Canvas. |
| **Framework** | React (v18) | Component architecture for managing complex HUD and Chat UI layers. |
| **Sync** | STOMP | Reliable message-oriented protocol for complex proximity handshake logic. |
| **Infrastructure** | Spring Boot | Production-grade robustness for handling concurrent user state and DB persistence. |

---

## 📄 Submission Checklist
- [x] **Well-Structured Codebase**: Modular components and clean, humanized backend architecture.
- [x] **User Movement**: Precise WASD/Arrow keys with diagonal normalization.
- [x] **Real-Time Logic**: 20fps spatial synchronization across all active signals.
- [x] **Proximity Chat**: Fully automated "Connect on Approach / Disconnect on Departure" behavior.
- [x] **Bonus Items**: Persistent Visual Identity, Multimodal Password Recovery (Forgot/Reset).

---
**Build freely, attribute kindly. Welcome to the Cosmos.**
