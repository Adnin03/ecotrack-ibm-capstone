# EcoTrack: Corporate ESG & Real-Time Carbon Footprint Command Center

> An enterprise-grade, high-fidelity sustainability dashboard and predictive energy optimization simulator built with pure vanilla web technologies. Developed using IBM Bob for the IBM Capstone / Innovation Challenge.

---

## 🌿 Overview

**EcoTrack ESG** is a mission-critical sustainability command center designed to give corporate sustainability officers and facility managers real-time visibility into greenhouse gas (GHG) emissions (Scope 1 & 2), power consumption telemetry, and Net-Zero progress.

Unlike static annual ESG reporting spreadsheets, EcoTrack provides interactive real-time telemetry, automated energy anomaly alerts, and a **"What-If" Scenario Simulator** that dynamically calculates the carbon and cost savings of operational policy adjustments.

---

## ✨ Key Features

1. **Multi-Facility Telemetry Switcher:** Seamlessly toggle between Global Aggregated, Data Center Alpha (Frankfurt), Silicon Fab Hub (Austin), and Logistics Terminal (Singapore) with reactive dataset updating.
2. **Executive KPI Dashboard:** Real-time metrics for Scope 1 & 2 emissions, renewable energy mix (with radial SVG progress meter), grid power consumption, and 2030 Net-Zero trajectory.
3. **Real-time Canvas Telemetry Graph:** Native HTML5 Canvas time-series chart with live pulsing data points, hover tooltips, and time-frame filtering (24H, 7D, 30D).
4. **Interactive "What-If" ESG Optimizer:** Parametric sliders for server fleet idle capping, HVAC cooling efficiency, and solar grid allocation that dynamically calculate projected annual metric tons of CO2e reduced and monetary savings.
5. **Anomaly Detection & Audit Feed:** Real-time event log with priority badges (Normal, Warning, Critical), keyword search, and simulated incident acknowledgment.

---

## 🛠️ Architecture & Tech Stack

Built following strict **Separation of Concerns** with zero external dependencies:

* **Markup:** Semantic HTML5 (`index.html`) compliant with WCAG AA accessibility standards.
* **Styling:** CSS3 (`style.css`) incorporating design tokens and color palettes inspired by the **IBM Carbon Design System Dark Theme** (`#161616`, `#0f62fe`, `#24a148`, `#da1e28`).
* **Logic:** Vanilla JavaScript (`app.js`) powering state management, dynamic Canvas rendering loops, and interactive calculations. Zero external chart libraries or frameworks.

---

## 🚀 How to Run Locally

Because EcoTrack uses pure vanilla web technologies with zero external dependencies or build steps, running it is as simple as:

1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 👥 Target Users

* **Chief Sustainability Officers (CSO) & ESG Managers:** Corporate-wide reporting, compliance audit readiness, and Net-Zero tracking.
* **Facility & Operations Managers:** Real-time power telemetry, alert monitoring, and equipment load balancing.
* **C-Level Executives (CFO / COO):** ROI analysis balancing operational costs with carbon abatement goals.

---

## 📄 License
Developed for IBM Capstone Submission. All rights reserved.
