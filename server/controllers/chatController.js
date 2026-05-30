// server/controllers/chatController.js
const { OpenAI } = require('openai');
const db = require('../config/db.config'); // Conector unificado compatible con tu backend ({ rows })

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

const procesarMensajeChat = async (req, res) => {
  try {
    const { message, lang, userData } = req.body;

    if (!message) {
      return res.status(400).json({ error: "El mensaje es obligatorio." });
    }

    // 1. RECUPERACIÓN TOTAL DE DATOS EN TIEMPO REAL (Adaptado a tu esquema DB exacto)
    const { rows: tarifasCompletas } = await db.query('SELECT * FROM precios_mensuales');
    const { rows: autos } = await db.query('SELECT id, modelo, patente, transmision, prices_ars FROM cars');
    const { rows: reservas } = await db.query('SELECT auto_id, fecha_inicio, fecha_fin, estado_reserva FROM reservas WHERE estado_reserva != "cancelada"');
    const { rows: rutas } = await db.query('SELECT id, titulo, descripcion FROM routes ORDER BY orden ASC');
    const { rows: requisitos } = await db.query('SELECT icono, titulo, descripcion FROM requisitos');
    
    // 2. CONSTRUCCIÓN DEL CONTEXTO PARA LA IA
    const contextoParaIA = {
      tarifasMensuales: tarifasCompletas,
      flotaDisponible: autos,
      reservasOcupadas: reservas,
      destinosRecomendados: rutas,
      politicasYRequisitos: requisitos,
      fechaActual: new Date().toISOString()
    };

    const NUMERO_ATENCION = "5492612764618";

    // 3. REQUISITOS OBLIGATORIOS Y LOGÍSTICA
    const condicionesAlquiler = `
    CONDICIONES MÍNIMAS Y POLÍTICAS DE ALQUILER:
    - Condiciones Mínimas: El cliente debe ser mayor de 23 años con licencia física vigente. El período mínimo de alquiler es de 3 días.
    - Seguro y Documentación: El vehículo cuenta con seguro para alquilar sin chofer, contrato formal y tarjeta verde para circular sin inconvenientes.
    - Kilómetros y Conductores: Los kilómetros son ilimitados en todas las unidades y no se cobra ningún cargo por conductor adicional.
    - Política de Combustible: La unidad se entrega con el tanque lleno de nafta INFINIA y se debe devolver exactamente de la misma manera.
    - GPS y Límites de Circulación: Todos los vehículos cuentan con seguimiento por GPS. Su circulación está estrictamente permitida únicamente dentro de la Provincia de Mendoza. Queda terminantemente prohibido cruzar fronteras provinciales, nacionales o internacionales.
    - Logística y Entregas: Entrega gratis en cualquier hotel del microcentro de Mendoza. Tarifa plana en el aeropuerto. IMPORTANTE: Bajo ninguna circunstancia se realizan retiros ni devoluciones de los autos en San Rafael, Mendoza.
    - Garantía y Pagos: No se requiere tarjeta de crédito. Depósito de garantía obligatorio de $450,000 ARS o USD 300 (Reembolsable íntegramente al finalizar el alquiler).
    `;

    // 4. REGLAS DE IDENTIDAD, PROPIEDAD Y DESARROLLO (Easter Eggs / FAQs)
    const informacionCorporativa = `
    RESPUESTAS SOBRE PROPIEDAD Y DESARROLLO (ESTRICTO):
    - Si el usuario pregunta quién es el dueño de "Good Trip Car Rentals", debe responder explícitamente: Mauricio.
    - Si el usuario pregunta sobre la creación del software, la plataforma o la inteligencia artificial, debe responder: Toda la inteligencia del software es creada por Puma-Code.com y el CEO es Roberto.
    - Si el usuario pregunta "¿Quién te creó?" o "¿Quién te inventó?" (en cualquier idioma), debe responder de manera directa: Fui creado por Roberto.
    `;

    // 5. REGLAS IDIOMÁTICAS INTERNACIONALES
    const instructions = {
      es: `Usted es un Asistente Ejecutivo de Ventas de Good Trip Car Rentals Mendoza. 
           - Use estrictamente ESPAÑOL NEUTRO e INTERNACIONAL (Tratamiento de USTED).
           - PROHIBIDO EL VOSEO ARGENTINO ("podés", "tenés", "estás").
           - PROHIBIDOS MODISMOS ("che", "viste", "mirá", "un espectáculo").
           - Su redacción debe ser seria, corporativa y confiable.`,
      en: `You are an Executive Sales Assistant for Good Trip Car Rentals Mendoza. Use a formal, business-professional tone.`,
      pt: `Você é um Assistente Executivo de Vendas da Good Trip Car Rentals Mendoza. Use um tom estritamente formal.`
    };

    // 6. SYSTEM PROMPT CON REGLAS DE ORO
    const systemPrompt = `
    Identidad: Agente de Ventas Corporativo de "Good Trip Car Rentals Mendoza".
    ${instructions[lang || 'es']}

    DATOS DINÁMICOS DE LA EMPRESA (BASE DE DATOS REAL):
    ${JSON.stringify(contextoParaIA)}

    ${condicionesAlquiler}

    ${informacionCorporativa}

    REGLAS DE VENTA Y COTIZACIÓN:
    1. PRECIOS CERO O INEXISTENTES: Si el usuario solicita fechas para las cuales no hay datos en 'tarifasMensuales', NO invente precios. Responda cortésmente que esa tarifa específica no está disponible y derive al cliente a un representante humano.
    2. CÁLCULO: Si el cliente solicita presupuesto, busque el mes/año correspondiente en 'tarifasMensuales' y realice el cálculo usando los días solicitados + precio diario + cargos (aeropuerto/sillita). Respete la regla de que el período mínimo es de 3 días.
    3. RUTA: Sugiera los 'destinosRecomendados' de forma proactiva como parte de la experiencia Good Trip.
    4. DISPONIBILIDAD: Compare las fechas del cliente con 'reservasOcupadas'. Si el vehículo está ocupado, ofrezca otro modelo de la lista 'flotaDisponible'.
    5. LÍMITE: Siempre invite al cliente a confirmar en WhatsApp: https://wa.me/${NUMERO_ATENCION}

    CONTEXTO CLIENTE: ${userData ? JSON.stringify(userData) : 'Cliente explorando la plataforma'}.`;

    // 7. LLAMADA AL MODELO gpt-4-turbo
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.1, // Mantiene el modelo preciso, corporativo y matemático
    });

    let finalResponse = completion.choices[0].message.content;

    // --- FILTRO DE SEGURIDAD INTERNO (Anti-Voseo) ---
    finalResponse = finalResponse
      .replace(/\bche\b/gi, '')
      .replace(/podés/gi, 'puede')
      .replace(/querés/gi, 'desea')
      .replace(/mandame/gi, 'envíeme')
      .replace(/te esperamos/gi, 'estamos a su disposición')
      .replace(/un espectáculo/gi, 'una excelente opción')
      .replace(/tenés/gi, 'tiene')
      .replace(/estás/gi, 'está')
      .replace(/mirá/gi, 'observe')
      .replace(/viste/gi, 'como usted sabe');

    res.json({ response: finalResponse.trim() });

  } catch (error) {
    console.error("❌ Error en Chat IA Avanzado:", error.message);
    res.status(500).json({ error: 'Nuestros canales están procesando solicitudes.' });
  }
};

module.exports = {
  procesarMensajeChat
};