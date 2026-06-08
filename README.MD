# Mendoza Rent Pro - Enterprise AI-Driven Fleet & Content Management Pipeline 🚗🍷

Mendoza Rent Pro is a production-ready, full-stack ecosystem engineered for high-end automotive logistics, temporal dynamic pricing formulas, and automated tourist content generation in Mendoza, Argentina. 

Built around a **"Secure-by-Design" RESTful API gateway**, the platform mitigates traditional architectural overhead by decoupling stateless client interactions from an asynchronous, multi-tenant Super Admin Control Panel. It features deterministic AI state machines, dynamic in-memory binary processing, and granular transaction adapters.

---

## 🌟 Key Features & Core Business Logic

### 💎 Customer Experience (Frontend)
* **Dynamic Booking Engine:** Real-time car availability matching and automated arithmetic pricing calculation.
* **Interactive Wine Routes:** Discover Mendoza's premier vineyards using custom digital itineraries backed by AI location mapping.
* **Multi-language Localization Engine:** Internationalization framework optimized for global high-ticket tourists (English/Spanish).
* **Premium Responsive UI:** High-fidelity, fluid layouts engineered with a mobile-first philosophy.

### ⚡ Super Admin Dashboard
A centralized command center that fully orchestrates the platform—from backend relational boundaries to live layout updates without hardcoded mutations.
* **Active Fleet Control (`Flota Activa`):** Live vehicle lifecycle management, operational state toggles, and dynamic asset parameter injection.
* **Visual Fleet Calendaring (`Calendario Flota`):** A high-performance interactive schedule implementing strict vehicle color-coding matrix constraints for rapid overlapping detection.
* **Temporal Dynamic Pricing Matrix:** Instant global overriding formulas for high/low tourist seasons, live exchange rate conversions (USD/ARS), and dynamic optional insurance variables.
* **Sales Tracking & BI Metrics:** Integrated data queries that transform transactional historical lines into readable business intelligence graphs.
* **Staff Microservice Onboarding:** Admin expansion mechanics leveraging automated encrypted invites for new collaborators via transactional email pipelines.

---

## 🤖 Advanced AI & Data Injection Pipelines

Moving far beyond vanilla API wrappers, the platform utilizes Large Language Models (LLMs) as strictly bound contextual compute engines operating over live business relational tables.

### 1. Deterministic Context Injection (Virtual Intelligent Sales Agent)
Instead of introducing volatile vector embeddings for rapidly changing mathematical dimensions, the system directly ingests relational operational data into a unified computational payload inside `chatController.js`:
* **Dynamic Data Hydration:** In real-time, the system queries five distinct SQL domains: multi-tier pricing structures (`precios_mensuales`), active fleet specs (`cars`), operational conflict schedules (`reservas`), structured curated routes (`routes`), and legal compliance frameworks (`requisitos`).
* **Zero-Hallucination Guardrails:** Executed via `gpt-4-turbo` utilizing a hardcapped `temperature: 0.1` matrix to strictly bind the LLM to database numerical truths, preventing price fabrication and logical anomalies.
* **Post-Processing Dialect Sanitization Layer:** Implements a strict backend regex-based interceptor pattern that scrubs localized dialects (e.g., Argentine "voseo" such as *che, podés, querés, mandame*) from the LLM output array, guaranteeing a polished international corporate identity prior to client hydration.

### 2. Generative Content Automation & Marketing Pipelines
* **Dynamic Promo Ingestion (`bannerController.js`):** Admins can orchestrate automated marketing generation. The backend interfaces with OpenAI to synthesize tailored copywriting variations, syncing execution time-blocks and priority states dynamically to the database catalog.
* **Autonomous Itinerary Optimization (`routeController.js`):** Integrates an AI microservice targeting endpoint `POST /api/routes/ai-desc` that runs `temperature: 0.7` over basic geographical and winery data inputs, returning production-ready marketing strings capped precisely at 200 characters.

---

## ⚙️ Administrative Engineering & Control Panel Modules

The Super Admin Dashboard operates as a distributed command center, handling state transitions and heavy computational logic through high-performance engineering patterns:

### 🚗 Resilient Fleet Management (`carController.js`)
* **In-Memory Volatile Buffer Allocation:** To avoid blockages and security vulnerabilities caused by saving temporary files to disk, the creation and update of vehicles route incoming streams directly to RAM (`multer.memoryStorage()`). Media binaries are transferred via pipeline buffers as base64 streams directly to Cloudinary.
* **Robust Database Adaptability Polyfill:** Implements custom data extraction routines (`extraerFilas`) that evaluate data shapes at runtime. This provides native compatibility with structural results across `mysql2`, `pg`, or relational connection pools seamlessly.
* **JSON State Serialization:** Complex vehicle specifications and UI metadata icons are serialized as JSON strings directly into the relational layer, leveraging safe regex fallback routines to unpack default state models if schema corruption occurs.

### 💰 Temporal Dynamic Pricing Matrix (`precioMensualController.js`)
* **UPSERT Relational Optimization:** To eliminate concurrency locks during high-season rate re-calculations, the engine executes unified atomic matrix updates using **`INSERT ... ON DUPLICATE KEY UPDATE` (Upsert)** over unique composite indices (`auto_id, mes, anio`).
* **Hierarchical Cascade Precedence:** Features complex matrix mutations allowing a `/global` patch call to cascade overriding parameters downward across an entire fleet array, ensuring zero state collision while transforming database data types into float integers.

### 📅 Dynamic Calendaring & Time-Block Metrics (`reservaController.js` & `ventaController.js`)
* **Fractional Temporal Business Logic:** Features a custom temporal algorithm that parses JavaScript standard datetime strings down to fractional values (calculating partial car rental days based on a granular hourly remaining delta: $\le$3:30h $\rightarrow$ +0 days, 4h-7:30h $\rightarrow$ +0.5 days, $\ge$8h $\rightarrow$ +1 day).
* **Asynchronous Multi-Tenant Transaction Mailer:** Fully decoupling notification cycles, successful data persistency hooks orchestrate asynchronous operational dispatches via **Resend API**, delivering dynamic operational confirmations to administrative managers.
* **Data Layer Joins for Business Intelligence:** The sales tracking metrics module handles relational `LEFT JOIN` aggregations between the temporal reservations table and the active vehicle parameters schema, outputting optimized telemetry metrics directly to administrative monitoring charts.

### 🔐 System Security, ACL & Data Adapters (`adminController.js` & `weatherController.js`)
* **Stateless Access Control Tokens (ACL):** Implements industry-grade cryptographic auth structures. User data is salted via `bcryptjs` and wrapped within stateless **JSON Web Tokens (JWT)** configured with an explicit 4-hour automatic decay wall.
* **Meteorological Structural Adapter Pattern:** To avoid tight coupling with volatile third-party weather schemas, `weatherController.js` fetches real-time WMO matrix coordinates from Open-Meteo and channels them through a structural mapper. This transforms foreign payloads into an internal representation matching the frontend layout without API disruption.

---

## 🛠️ Tech Stack Matrix

* **Frontend Client Layer:** React.js, Tailwind CSS, Lucide Icons, Vite Bundler Core.
* **Backend Application Layer:** Node.js (Runtime Environment), Express.js framework.
* **Database Infrastructure Layer:** MySQL (Structured Storage Engine with relational indexing).
* **Cloud API Infrastructure Ecosystem:** Resend Integration (Email Automation), Google Maps Protocol (Geolocation Rendering), OpenAI Engine (Large Language Model Pipelines), Cloudinary SDK (Image In-Memory Streaming Buffers).

---

## 🚀 Deployment & Getting Started (Local Run)

Follow these technical directives to deploy a local instance of the application environment.

### 1. Repository Instantiation (Cloning)
Execute the git extraction suite within your development working directory:
```bash
git clone [https://github.com/RobertoDrazewski/Good-trip-car-rentals-final-produccion.git](https://github.com/RobertoDrazewski/Good-trip-car-rentals-final-produccion.git)
cd Good-trip-car-rentals-final-produccion

2. Dependency Resolution Pipeline
Install the required node packaging manifests across both application boundaries:

Bash
# Extract and build backend dependency trees
npm install

# Navigate to UI component repository and compile client dependencies
cd client
npm install
cd ..

3. Environment Variables Strategy (.env Setup)
Initialize an application security file named .env in the root backend folder (/). Populated structures must match the following matrix boundaries:

Fragmento de código
# Server Network Matrix Configuration
PORT=5000

# Relational Infrastructure Gateway (MySQL Layer)
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name

# Cryptographic Gateway Keys
JWT_SECRET=your_super_secure_jwt_secret_token

# Cloud Service Integration Endpoints
RESEND_API_KEY=re_your_resend_api_secret_key
OPENAI_API_KEY=sk-proj-your_openai_advanced_llm_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_tenant_name
CLOUDINARY_API_KEY=your_cloudinary_public_key
CLOUDINARY_API_SECRET=your_cloudinary_private_signature_secret

4. Running the Multi-Layer Environment

To deploy the local sandbox stacks into a synchronized listening state:

A. Spawning the Application Server (Backend Pipeline)
Run the core runtime layer from the root folder directory:

Bash
# Executes server entry-point with nodemon for hot-reloading
npm run dev
The server ecosystem maps dynamic interfaces listening safely over: http://localhost:5000

B. Spawning the Interface Suite (Vite Client Frontend)
Open an isolated shell execution pipeline, move into the client architecture, and launch the development environment:

Bash
cd client
npm run dev
The client interface bundle will instantiate hot-module reloads over: http://localhost:5173 (or the default system-assigned routing port).

🔒 License & Intellectual Property Matrix
All architectural features, dynamic data algorithms, and artificial intelligence integration pathways contained within this repository are proprietary properties engineered exclusively by Puma-Code.com under the structural leadership of the active Chief Executive Officer (CEO), Roberto Drazewski.