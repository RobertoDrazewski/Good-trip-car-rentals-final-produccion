# Mendoza Rent Pro - Premium Car Rental System 🚗🍷

A professional, full-stack car rental management system designed for **Good Trip Car Rentals** in Mendoza, Argentina. This platform features a high-end landing page for customers and a powerful "Super Admin" Dashboard for real-time fleet, content, and booking management.

## 🌟 Key Features

### 💎 Customer Experience (Frontend)
*   **Dynamic Booking Engine:** Real-time car availability and pricing calculation.
*   **Interactive Routes:** Discover Mendoza's best wineries and landscapes with AI-curated descriptions.
*   **Multi-language Support:** Ready for international tourists (English/Spanish).
*   **Premium UI:** Smooth animations and mobile-first design.

### ⚡ Super Admin Dashboard
A centralized command center that fully controls the platform—from backend data to the live frontend homepage layout.

*   **Active Fleet (Flota Activa):** Manage vehicles, toggle availability status, and update technical specs in real time.
*   **Fleet Calendar (Calendario Flota):** A visual, smart calendar with car-specific color coding for a complete booking overview.
*   **Pricing Matrix (Matriz Tarifas):** Update seasonal rates, dynamic USD/ARS exchange rates, and insurance fees in one click.
*   **Sales Control & Metrics (Control Ventas y Métricas):** Track revenue, monitor bookings, and analyze business intelligence metrics.
*   **Coupons & Promos (Cupones & Promos):** Full control over discounts. **Includes AI-generated promotional banners** that automatically sync to the homepage with set expiration dates.
*   **Route Guide (Guía de Rutas):** Manage and enhance curated travel itineraries across Mendoza using OpenAI integrations.
*   **Contract Requirements (Requisitos Contrato):** Dynamically update rental terms, conditions, and customer requirements.
*   **Staff Admin:** Manage employee access with a secure invitation system via Resend (Email) for new collaborators.
*   **Total Homepage Control:** The dashboard allows admins to manipulate homepage content, banners, and featured cars without touching the codebase.

## 🛠️ Tech Stack

*   **Frontend:** React.js, Tailwind CSS, Lucide Icons, Vite
*   **Backend:** Node.js, Express.js
*   **Database:** MySQL
*   **Integrations:** Resend (Email), Google Maps API, OpenAI API

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### 1. Clone the repository
```bash
git clone [https://github.com/RobertoDrazewski/Good-trip-car-rentals-final-produccion.git](https://github.com/RobertoDrazewski/Good-trip-car-rentals-final-produccion.git)
cd Good-trip-car-rentals-final-produccion
2. Install dependencies
Install the required packages for both the frontend and backend.

Bash
# In the root directory (or backend folder, depending on your structure)
npm install

# In the frontend folder
cd client 
npm install
3. Environment Variables
Create a .env file in the root directory and add your keys (never commit this file):

Fragmento de código
PORT=5000
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
RESEND_API_KEY=your_resend_api_key
OPENAI_API_KEY=your_openai_key
4. Run the development server
Bash
# Start the backend server
npm run server

# Start the frontend client (in a new terminal tab)
cd client
npm run dev