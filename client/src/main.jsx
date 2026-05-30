import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🌐 1. IMPORTAMOS LAS LIBRERÍAS DE TRADUCCIÓN
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 🛠️ 2. INICIALIZAMOS i18next EN TIEMPO DE ARRANQUE
// Esto crea la instancia global que tus componentes (NavBar, etc.) necesitan para usar useTranslation()
i18n.use(initReactI18next).init({
  resources: {
    es: {
      translation: {
        // Podés dejarlo vacío o agregar palabras clave si tu front las pide:
        "btn_activate": "ACTIVAR MI CUENTA",
        "error_passwords_match": "Las contraseñas ingresadas no coinciden."
      }
    }
  },
  lng: 'es',           // Idioma por defecto
  fallbackLng: 'es',    // Idioma de respaldo
  interpolation: {
    escapeValue: false // React ya protege contra ataques XSS de forma nativa
  }
});

// 🚀 3. RENDERIZADO GLOBAL DE LA APP DE GOOD TRIP
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)