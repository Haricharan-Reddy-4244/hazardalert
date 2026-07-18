# 🎓 HazardAlert — Technical Interview & Presentation Guide

This guide details the core software engineering principles, system architecture choices, and mathematical formulas implemented in the **HazardAlert** platform. Use this to explain the project during technical rounds, vivas, or resume reviews.

---

## 🏗️ 1. Core Architecture & Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | HTML5, Vanilla JS, CSS3 | Light weight, no framework overhead, allows direct DOM manipulation for Leaflet map markers. Uses **Glassmorphism** style system for premium modern aesthetics. |
| **Mapping** | Leaflet.js | Open-source alternative to Google Maps API. No billing costs; works seamlessly with custom tile providers (OpenStreetMap). |
| **Backend** | Node.js + Express 5.x | Asynchronous event loop is perfect for handling high-concurrency WebSocket connections and real-time alerts. |
| **Real-Time** | Socket.io (WebSocket) | Enables bi-directional, low-latency communication. Perfect for instant proximity broadcast triggers. |
| **AI Vision** | Google Gemini 2.0 Flash | State-of-the-art vision model. Replaces client-side TensorFlow models (COCO-SSD) to avoid high browser memory usage and improve detection accuracy. |
| **Database** | MySQL 8.x | Relational schema is ideal for enforcing integrity between users, reports (hazards), and votes (verifications). |

---

## ⚡ 2. Scaling Real-Time Alerts: GPS Grid Zone Architecture

### The Problem
If the backend calculates distances ($d = \sqrt{\Delta x^2 + \Delta y^2}$) for all connected users every time a new hazard is reported, the complexity is $O(N)$ where $N$ is active connections. For $100,000$ active users, this CPU overhead causes server block.

### The Solution: Grid Zoning
HazardAlert scales to millions of users by utilizing **discrete 2D spatial rooms** mapped directly to geographical grid cells:

$$\text{Zone Lat} = \text{floor}(\text{Latitude} \times 100)$$
$$\text{Zone Lng} = \text{floor}(\text{Longitude} \times 100)$$

- Each cell represents approximately **1.1km × 1.1km**.
- Upon location updates, the client joins **9 rooms** in a $3 \times 3$ matrix around their current coordinate. This ensures that users receive alerts even if they are standing near boundary margins of a cell.

```
       78.37    78.38    78.39
      ┌────────┬────────┬────────┐
17.46 │  NW    │   N    │  NE    │
      ├────────┼────────┼────────┤
17.45 │   W    │ USER📍 │   E    │  ← User at (17.449, 78.380) joins all 9 rooms
      ├────────┼────────┼────────┤
17.44 │  SW    │   S    │  SE    │
      └────────┴────────┴────────┘
```

- **Broadcast Complexity**: $O(1)$. When a hazard is reported inside a cell, the backend only emits a message to that cell's Socket.io room. No distance calculations are run.

---

## 🗳️ 3. Mathematical Trust Score & Verification Engine

To prevent false reports and trolling, reports are verified dynamically through community voting.

### Weighted Voting System
Evidence-backed reports carry higher weight:

| Action | Formula Weight |
|---|---|
| Confirm (Base) | $W_{\text{confirm}} = +2$ |
| Confirm + Photo | $W_{\text{photo}} = +4$ |
| Confirm + Video | $W_{\text{video}} = +5$ |
| Reject | $W_{\text{reject}} = -3$ |

### Mathematical Score Calculation
The trust score $T$ is computed dynamically on every vote:

$$T = \frac{\sum W_{\text{actions}}}{V \times W_{\text{max}}}$$

Where:
- $V$ is total votes cast on the hazard.
- $W_{\text{max}}$ is the maximum positive weight a single vote can have ($+5$).

### Dynamic Verification Rules
- **Verified ($T > 0.75$ and $V \ge 2$)**: Promoted to official verified list; alerts nearby users.
- **False Report ($T < 0.30$ and $V \ge 2$)**: Auto-hidden from map; user's civic reputation score decremented.
- **Pending ($0.30 \le T \le 0.75$)**: Remains visible for review.

---

## 🧠 4. AI Camera Validation Pipeline

To protect the server from spam, uploads pass through a two-stage validation pipeline:

```
[Camera Image] ──► [Client Size Check] ──► [Gemini Vision Model] ──► [Structured Output JSON]
```

### Prompt Engineering Guidelines
The Gemini model is fed a highly specific system instruction to enforce structured JSON outputs:
- **Strict Rejections**: Solid color files, blank feeds, indoor photos, nature scenes, or selfies are rejected instantly.
- **Output Struct**:
  ```json
  {
    "isHazard": true,
    "hazardType": "Pothole",
    "severity": "high",
    "confidence": 92,
    "description": "Deep pothole blocking left lane. Driver risk high."
  }
  ```

---

## 💡 5. Answers to Common Interview Questions

### Q1. Why did you use MySQL instead of MongoDB?
> "Relational integrity was crucial for the voting and auto-escalation features. For instance, deleting or archiving a hazard needs to cleanly update or cascade through the `verifications` and `rti_applications` tables. Transactions guarantee our trust scores match vote counts at all times."

### Q2. How does the auto-escalation mechanism work?
> "The backend runs a scheduled cron job (`node-cron`) daily. It scans for verified, unresolved hazards. If a hazard remains open for longer than defined limits ($7$ days, $15$ days, or $30$ days), the status updates, logs an entry in `escalation_history`, and auto-generates RTI templates sent to GHMC officials."

### Q3. Why use Leaflet.js instead of Google Maps?
> "Leaflet.js is open-source, lighter, and completely free. By using Leaflet, we avoided billing keys and could easily load custom dark mode map layers from CartoDB or OpenStreetMap using simple CSS filter layers."
