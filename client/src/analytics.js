// client/src/analytics.js
// ---------------------------------------------------------------------------
// Helper de tracking para Google Ads / GA4 (gtag) y Meta Ads (Pixel / fbq).
//
// Todas las llamadas son "a prueba de balas": si el pixel o el tag no están
// cargados (p. ej. el usuario bloquea trackers, o todavía no configuraste el
// Pixel ID), NO rompe nada. Por eso es 100% seguro para producción.
//
// IMPORTANTE: para que estos eventos lleguen, hay que cargar primero los
// snippets en /index.html:
//   - GA4 ya está cargado (G-VT36DTH3BD).
//   - El Meta Pixel está cargado pero necesitás reemplazar TU_PIXEL_ID.
//   - Para Google Ads, importá estas conversiones desde GA4 (eventos
//     generate_lead / generate_quote / contact) o creá Conversion Actions.
// ---------------------------------------------------------------------------

const safeGtag = (...args) => {
  try { if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag(...args); }
  catch (e) { /* noop */ }
};

const safeFbq = (...args) => {
  try { if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq(...args); }
  catch (e) { /* noop */ }
};

// Evento custom genérico (GA4 + Pixel).
export function track(eventName, params = {}) {
  safeGtag('event', eventName, params);
  safeFbq('trackCustom', eventName, params);
}

// El cliente generó una cotización (intención alta de compra).
// FB: InitiateCheckout · GA4/Ads: generate_quote
export function trackQuote(params = {}) {
  safeGtag('event', 'generate_quote', params);
  safeFbq('track', 'InitiateCheckout', params);
}

// El cliente confirmó/registró una reserva (LEAD = la conversión principal).
// FB: Lead · GA4/Ads: generate_lead
export function trackLead(params = {}) {
  safeGtag('event', 'generate_lead', params);
  safeFbq('track', 'Lead', params);
}

// El cliente abrió un canal de contacto directo (WhatsApp).
// FB: Contact · GA4/Ads: contact
export function trackContact(params = {}) {
  safeGtag('event', 'contact', params);
  safeFbq('track', 'Contact', params);
}
