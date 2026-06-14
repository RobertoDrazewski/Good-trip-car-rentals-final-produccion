# 📣 Mejoras de Marketing / SEO / Performance — Good Trip Car Rentals

Cambios aplicados sobre el proyecto **en producción**. Todo es **aditivo o corrección de bugs**: nada modifica los flujos existentes (reservas, panel admin, cotizador, IA, idiomas). Probado a nivel sintaxis; falta `npm install && npm run build` en tu entorno.

---

## ⚠️ 4 cosas que TENÉS que completar antes de subir

1. **Meta Pixel ID** → en `client/index.html` reemplazá `TU_PIXEL_ID` (aparece 2 veces: el `fbq('init', ...)` y el `<noscript>`). Sin esto, Meta Ads sigue sin medir conversiones.
2. **Google Ads ID (opcional)** → en `client/index.html` descomentá `gtag('config', 'AW-XXXXXXXXXX')` y poné el ID real. Alternativa: importar las conversiones desde GA4 (recomendado).
3. **Imagen Open Graph** → generé un `client/public/og-image.jpg` (1200×630) provisional con el logo. Si querés algo más vendedor (auto + paisaje de Mendoza), reemplazá ese archivo manteniendo el nombre y el tamaño.
4. **Confirmá el número de WhatsApp** → unifiqué todo en `5492612764618` (era el correcto en Footer/ChatIA). Si el número comercial es otro, buscá y reemplazá ese string.

Todas las URLs apuntan a `https://goodtrip.com.ar/`. Si el dominio final es otro, cambialo en `index.html` (canonical/OG) y en `public/sitemap.xml` + `public/robots.txt`.

---

## ✅ Qué se cambió

### Medición de conversiones (lo que recupera el gasto en ads)
- **Meta Pixel** instalado en `index.html` (PageView automático).
- Nuevo helper `client/src/analytics.js`: dispara eventos a **GA4 + Pixel** de forma segura (si el tag no está, no rompe nada).
- Eventos disparados en los puntos clave:
  - `QuoteResult.jsx` → **Lead** / `generate_lead` al confirmar la reserva (la conversión principal).
  - `BookingForm.jsx` → **InitiateCheckout** / `generate_quote` al generar una cotización.
  - `ChatIA.jsx`, `BookingForm.jsx`, `QuoteResult.jsx` → **Contact** / `contact` al hacer clic en WhatsApp.

### SEO / cómo se ve el link en los ads
- `<meta name="description">`, keywords, author, robots, **canonical**.
- **Open Graph** completo (título, descripción, imagen) → los links en Meta/Instagram/WhatsApp ahora muestran tarjeta con imagen.
- **Twitter/X Cards**.
- **Schema.org** (`AutoRental` + `AggregateRating`) para rich results en Google.
- `lang="es-AR"` y `theme-color` corregido al color de marca.
- Nuevos `public/robots.txt` y `public/sitemap.xml` (admin/login bloqueados de la indexación).

### Performance (Quality Score + rebote en mobile)
- `hero.png` 2.7 MB → `hero.webp` **168 KB**.
- `logo.png` 2.6 MB → `logo.webp` **122 KB**.
- `favicon.ico` 1.4 MB → **10 KB**.
- `android-chrome-192` 580 KB → **29 KB** (antes tenía resolución incorrecta).
- `android-chrome-512` 580 KB → **142 KB**.
- `apple-icon` 584 KB → **58 KB**.
- Imports de `hero`/`logo` actualizados a `.webp` (Home, Footer, GoogleReviews).

### Conversión / UX (clics pagos que se caían)
- **Bug WhatsApp**: en `QuoteResult.jsx` el WhatsApp automático del negocio iba a `542612764618` (faltaba el "9") → corregido a `5492612764618`. Era justo el momento del lead.
- **Bug WhatsApp**: en `BookingForm.jsx` el botón iba a `5492614000000` (número inventado) → corregido.
- **Bug ruta**: en `Footer.jsx` "Acceso Staff" iba a `/admin/login` (no existe) → corregido a `/login`.
- **Hero**: CTA fuerte arriba del pliegue ("Cotizá tu auto ahora" → baja al formulario) + barra de confianza (atención local · aeropuerto · WhatsApp). Typo del subtítulo corregido.

---

## 🚀 Checklist post-deploy
- [ ] Reemplazar `TU_PIXEL_ID` y verificar con la extensión **Meta Pixel Helper**.
- [ ] Importar las conversiones de GA4 (`generate_lead`, `generate_quote`, `contact`) a **Google Ads** y marcar `generate_lead` como conversión principal.
- [ ] Subir el `sitemap.xml` en **Google Search Console** y pedir indexación.
- [ ] Validar el link en el **Sharing Debugger** de Meta (que muestre la imagen OG).
- [ ] Correr **Lighthouse** mobile (debería subir bastante por las imágenes).

## 🔜 Próximos pasos recomendados (no incluidos, requieren más trabajo)
- **Prerender/SSR** de la home: hoy es una SPA y Google ve el `<div id="root">` vacío. `vite-plugin-prerender` o `react-snap` resolvería la indexación.
- **Landings dedicadas** por anuncio (aeropuerto / 4x4 / fin de semana) para bajar el CPC.
- Migrar el cambio de idioma de **Google Translate** a `react-i18next` con `hreflang`.

---

# 🔄 Ronda 2 — Chat IA, migración de email y correcciones

### Chat IA (frontend)
- `ChatIA.jsx` ahora **renderiza** los mensajes: los links markdown `[texto](url)` y las URLs sueltas se vuelven clickeables (antes se veía el markdown crudo, ej. `[WhatsApp](https://wa.me/...)`).
- Los links de WhatsApp se reemplazan por un **botón verde con ícono** que va **siempre** a `5492612764618` (sin importar lo que devuelva la IA). Dispara evento `Contact`.
- Se respetan los saltos de línea y la **negrita** `**...**`.

### Migración de email: Resend → Gmail (Nodemailer)
- Eliminada la dependencia `resend` y **toda referencia a `RESEND_API_KEY`**.
- Nuevo `server/utils/mailer.js` (Nodemailer + SMTP de Gmail). Si faltan credenciales, no rompe: loguea y sigue.
- `reservaController.js` y `authController.js` ahora usan `sendMail()`.
- `package.json`: `resend` → `nodemailer`.
- `.env`: se quitó `RESEND_API_KEY` y se agregaron `GMAIL_USER` y `GMAIL_APP_PASSWORD`.
- Email destino unificado y corregido a **Goodtripmendoza@gmail.com** (también en los tickets impresos y el Schema.org).

### ⚠️ Para que el email funcione
1. En la cuenta de Google: activar **verificación en 2 pasos**.
2. Generar una **contraseña de aplicación** en https://myaccount.google.com/apppasswords
3. Pegarla en `GMAIL_APP_PASSWORD` (en el `.env` local y en las variables de entorno de Railway/Render).
4. `cd server && npm install` (instala `nodemailer`, quita `resend`).

> Nota: con Gmail común el `from` siempre será tu dirección de Gmail. Si querés mandar desde un dominio propio (ej. `reservas@goodtrip.com.ar`), conviene Google Workspace.
