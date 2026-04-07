# 🌌 Cosmos — Proximity-Based Virtual Space

A production-ready 2D virtual environment where users move freely and chat automatically connects when they get close — and disconnects when they move apart. This project demonstrates high-performance WebGL rendering, real-time spatial synchronization, and secure multimodal authentication.

---

## ✨ Features Spotlight

| Feature | Technical Details |
| :--- | :--- |
| **Pixel-Perfect Renderer** | 2400×1800 world via **PixiJS (WebGL)** with starfield, grid, and camera easing. |
| **Real-Time Sync** | **STOMP over SockJS** (Spring Boot) with 20fps position broadcasts. |
| **Dual-Layer Proximity** | Distance math on both Client (immediate UI) and Server (source of truth). |
| **Secure Identity Hub** | Multimodal Auth Terminal (Login, Register, **Password Recovery**). |
| **Visual Persistence** | User identity (username, persistent cosmic color) remains consistent. |
| **Adaptive UI** | Dynamic Chat panels, Minimap overview, and HUD with real-time telemetry. |

---

## 🛰️ Cosmic Intelligence System (UI)
Cosmos features a high-fidelity information layer designed for maximum situational awareness:
- **Stellar News Ticker**: A rotating system status bar showing network latency, space coordinates, and capacity.
- **World Activity Feed**: A real-time telemetry log tracking every join, departure, and social reaction in the space.
- **Signal Tracking**: Dedicated HUD badges for active proximity connections with pulse animations.

---

## 📽️ Unique Feature: Stellar Reactions
Beyond standard chat, Cosmos implements **Stellar Reactions** — a high-performance visual interaction system. Users can trigger emojis that float above their avatars in real-time. 
- **Physics-Based Animation**: Reactions feature a smooth upward float with alpha-fading and scale-pulsing.
- **Broadcast Optimized**: Distributed via specialized WebSocket events.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js ≥ 18
- Java 21+
- Maven 3.8+
- **PostgreSQL**: Ensure your server is running and a database named `cosmos` exists.

### 1. Establish the Backend
```bash
cd backend
mvn spring-boot:run
# ✅ Watch for: "COSMOS DATABASE CONNECTED SUCCESSFULLY!"
```

### 2. Launch the Terminal (Frontend)
```bash
cd frontend
npm install
npm run dev
# ✅ Local development at http://localhost:5173
```

### 3. Deploy to Production (Render.com)

#### **Backend (Web Service)**
- **Runtime**: Java
- **Build Command**: `mvn clean package -DskipTests`
- **Start Command**: `java -jar backend/target/cosmos-0.0.1-SNAPSHOT.jar`
- **Env Vars**: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.

#### **Frontend (Static Site)**
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Env Vars**: 
    - `VITE_API_BASE_URL`: Your backend URL + `/api`
    - `VITE_WS_BASE_URL`: Your backend URL + `/ws`

### 4. Verification Protocol
1. Open **two browser tabs** at `http://localhost:5173`.
2. Register two unique identities.
3. Move close to each other to trigger the **Signal Acquired** notification.
4. **Observe UI**: Watch the **Activity Feed** log the connection and the **News Ticker** sync system data.

---

## 🛠️ Tech Stack Justification

| Layer | Tech | Version | Why |
| :--- | :--- | :--- | :--- |
| **Server** | Spring Boot | 3.2.0 | Production-grade robustness and built-in STOMP support. |
| **Real-Time** | Spring WebSocket | — | STOMP broker pattern for superior message-oriented (Pub/Sub) model. |
| **Database** | PostgreSQL | 42.6.0 | Relational integrity for structured user data. |
| **Frontend** | React + PixiJS | 18 / 7 | Performance-first WebGL rendering pipeline. |

---

## 🎁 Bonus Features Implemented

1.  **Recent Chat Recovery**: On joining, users recover the last 20 messages.
2.  **Global Broadcast System**: Support for room-wide announcements via `GLOBAL` routing.
3.  **Cosmic Intelligence Suite**: Real-time telemetry ticker and activity feed.
4.  **Stellar Reactions**: Real-time emoji popping system with custom animation engine.

---

## 📽️ Demo Video (2–5 minutes)
[Insert Link to Your Demo Video Here]

---

## 📄 Submission Checklist
- [x] **Well-Structured Codebase**: Modular components and clean architecture.
- [x] **Clear README**: Detailed features, architecture, and setup.
- [x] **Setup and Run Instructions**: Proven verification protocol.
- [x] **User Movement**: Smooth WebGL-based avatar control.
- [x] **Real-Time Interaction**: Optimized WebSocket synchronization.
- [x] **Chat Connect/Disconnect**: Automated proximity-driven logic.
- [x] **Bonus Features**: History recovery, global broadcast, and persistent identity.
- [x] **Unique Bonus**: Stellar Reactions and Cosmic Intelligence UI.
