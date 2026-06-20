# 🛡️ Sach Ka Kavach — Bharat Trust Grid
### *Continuous Identity Trust & Adaptive Risk Interception Engine*

Designed and built for the **Bank of Baroda Hackathon 2026**, **Sach Ka Kavach** is a privacy-first, continuous risk-based Identity Trust Grid that monitors digital channels in real-time. By moving away from rigid binary logins, the engine continuously re-evaluates identity signals and locks down accounts dynamically, ensuring maximum security for vulnerable demographics with zero friction for normal users.

---

## 📌 Understanding of the Problem (Core Vulnerabilities)

Traditional banking security structures suffer from fundamental flaws:
1. **Inadequacy of Static Credentials**: Passwords and static OTPs are no longer sufficient against modern phishing, SIM swaps, and credential theft.
2. **Binary, Point-in-Time Verification**: Existing systems verify identity only once during login and do not continuously assess whether the user is still the genuine account holder.
3. **Undetected Hijacking Signals**: Account takeover attempts go unnoticed despite indicators like unusual transaction amounts, abnormal login cadences, location changes, or new device signatures.
4. **Weak KYC Onboarding Pipelines**: Fraudsters create fake, mule, or synthetic accounts by exploiting gaps in the KYC registration checks.
5. **Vulnerable Account Recovery Loops**: Suspicious account recovery requests (password resets or mobile changes) are misused to hijack profiles.
6. **Privileged Insider Misuse**: Bank employees can query customer records arbitrarily without immediate real-time authorization checks.
7. **Exploitation of Vulnerable Demographics**: Elderly, hospitalized, unconscious, or digitally less-aware customers cannot immediately recognize or respond to fraud.
8. **High Friction, Low Security**: A one-size-fits-all security approach creates unnecessary friction for genuine customers while failing to stop sophisticated fraud.

---

## ⚙️ Our Detailed Solution (The Sach Ka Kavach Engine)

Our platform addresses these vulnerabilities through a multi-dimensional approach:
* **Continuous Dynamic Risk Scoring Engine**: Calculates real-time trust scores (0–100) based on keyboard biometrics, hardware fingerprinting, impossible geo-speed session hops, relationship clustering (Aadhaar & PAN networks), password reset triggers, and privilege lookup parameters. Critically, it incorporates human and situational safety variables to protect accounts belonging to vulnerable, unconscious, or hospitalized demographics.
* **Adaptive Interception Policies**: Instead of absolute locks, step-up verification metrics (OTP verification, Customer ID checks, trusted family Guardian authorizations, and automated mathematical sandbox delays) are triggered only when threat parameters exceed predefined thresholds.

---

## 📊 System Architecture & Data Flow

```mermaid
graph TD
    %% Styling
    classDef default fill:#0d1527,stroke:#1e293b,stroke-width:1px,color:#cbd5e1;
    classDef client fill:#1e1b4b,stroke:#312e81,stroke-width:1.5px,color:#a5b4fc;
    classDef gateway fill:#062033,stroke:#083344,stroke-width:1.5px,color:#22d3ee;
    classDef ml fill:#141b2b,stroke:#022c22,stroke-width:1.5px,color:#34d399;

    subgraph ClientTier ["Client Tier (React 19 Console)"]
        A["Dashboard & Telemetry HUD"]:::client
        B["Hacker Delay sandbox timers"]:::client
    end

    subgraph GatewayTier ["Gateway Tier (Express API Server)"]
        API["Node.js Express App"]:::gateway
        DB[("MongoDB Atlas")]:::gateway
        SIO["Socket.io Event Broker"]:::gateway
    end

    subgraph MLTier ["AI/ML Tier (Flask Microservice)"]
        ML["Flask Predict App"]:::ml
        M1["Keystroke Dynamics (Isolation Forest)"]:::ml
        M2["Device Fingerprints (Random Forest)"]:::ml
        M3["Swarm Node KYC relationship graph"]:::ml
        LLM["xAI Grok Dynamic Explainer"]:::ml
    end

    %% Connections
    A -->|1. Real-time typing dynamics| API
    A -->|2. Device OS/Emulator metrics| API
    A -->|3. Nominee KYC networks| API
    API -->|4. Store Event logs| DB
    API -->|5. Broadcast SOC Alerts| SIO
    API -->|6. JSON vector payload| ML
    ML --> M1
    ML --> M2
    ML --> M3
    API -->|7. Generate Explanation| LLM
```

---

## 🔄 Dynamic Risk Interception Flow

```mermaid
graph LR
    classDef decision fill:#172554,stroke:#1e40af,color:#93c5fd;
    classDef action fill:#022c22,stroke:#064e3b,color:#6ee7b7;

    A["Collect Telemetry Timing & OS Vectors"]:::decision --> B["Calculate Dynamic Trust Score (0-100)"]:::decision
    B --> C{"Check Score Band"}:::decision
    
    C -->|80 - 100| D["Policy: ALLOW (Frictionless)"]:::action
    C -->|60 - 79| E["Policy: OTP_REQUIRED (SMS Step-up)"]:::action
    C -->|40 - 59| F["Policy: ALERT_CUSTOMER (CIF logs)"]:::action
    C -->|20 - 39| G["Policy: HOLD (Guardian multi-sig)"]:::action
    C -->|0 - 19| H["Policy: BLOCK (SOC Locked)"]:::action
```

---

## 🛠️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Vite | Fully responsive dashboard layout, motion micro-interactions, Recharts analytics, global notification toasts. |
| **Backend API** | Node.js, Express, Socket.io | Core database controllers, event pipelines, and real-time Socket notifications. |
| **Database** | MongoDB Atlas, Mongoose | Persistent storage for users, transactions, audit logs, and employee tickets. |
| **Machine Learning** | Python, Flask, Scikit-Learn | Real-time prediction microservice (Isolation Forest, Random Forest). |
| **AI Explanation** | xAI Grok API, Groq Llama 3.3 | Real-time generation of human-readable risk summaries & action justifications. |

---

## 👥 The Development Team — Sach Ka Kavach

* **Chitra Saini** (Team Leader) 
  * **Role**: Frontend Architecture & Onboarding UX
  * **Gmail**: [chitrasaini.dev@gmail.com](mailto:chitrasaini.dev@gmail.com)
  
* **Abhyuday Jain** 
  * **Role**: Backend Services & Escrow Security Pipelines
  * **Gmail**: [abhyudayjain.security@gmail.com](mailto:abhyudayjain.security@gmail.com)
  
* **Hardik Mathur** 
  * **Role**: Machine Learning Models & System Integrations
  * **Gmail**: [hardikmathur11@gmail.com](mailto:hardikmathur11@gmail.com)
  
* **Siddharth Raut** 
  * **Role**: Risk Algorithms & Threat Overwatch Workflows
  * **Gmail**: [siddharthraut.risk@gmail.com](mailto:siddharthraut.risk@gmail.com)

---

## 🌐 Active Deployments

* **Production Frontend**: [https://sach-kavach-grid.vercel.app](https://sach-kavach-grid.vercel.app)
* **Production API Backend**: [https://sach-ka-kavach.onrender.com](https://sach-ka-kavach.onrender.com)
* **Production ML Service**: [https://sach-kavach-ml-service.onrender.com](https://sach-kavach-ml-service.onrender.com) (Health endpoint at `/health`)
