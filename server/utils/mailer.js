// server/utils/mailer.js
// ---------------------------------------------------------------------------
// Envío de emails vía Gmail / Google Workspace (Nodemailer + SMTP).
// Reemplaza a Resend. NO usa API key de Resend.
//
// Variables de entorno necesarias (.env):
//   GMAIL_USER=Goodtripmendoza@gmail.com
//   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   <- "Contraseña de aplicación" de Google
//
// Cómo generar la contraseña de aplicación:
//   1. Activá la verificación en 2 pasos en la cuenta de Google.
//   2. Entrá a https://myaccount.google.com/apppasswords
//   3. Creá una contraseña para "Correo" y pegá ese valor en GMAIL_APP_PASSWORD.
//
// Si las credenciales no están configuradas, NO rompe la app: loguea un aviso
// y devuelve sin enviar (igual que el comportamiento anterior con try/catch).
// ---------------------------------------------------------------------------

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ GMAIL_USER / GMAIL_APP_PASSWORD no configurados: el email no se enviará.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Envía un email. Nunca lanza: si falla, loguea y sigue.
 * @param {{to?: string, subject: string, html: string, replyTo?: string}} opts
 * @returns {Promise<boolean>} true si se envió, false si no.
 */
async function sendMail({ to, subject, html, replyTo }) {
  const tx = getTransporter();
  if (!tx) return false;

  const from = `Good Trip Car Rentals <${process.env.GMAIL_USER}>`;
  const destino = to || process.env.GMAIL_USER;

  try {
    await tx.sendMail({ from, to: destino, subject, html, replyTo });
    return true;
  } catch (err) {
    console.warn('⚠️ Email no enviado:', err.message);
    return false;
  }
}

module.exports = { sendMail };
