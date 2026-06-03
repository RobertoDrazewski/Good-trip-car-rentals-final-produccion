const db = require('../config/db.config');

/**
 * db.query() devuelve { rows } donde:
 *   - SELECT → rows = array de objetos
 *   - UPDATE/INSERT/DELETE → rows = ResultSetHeader { affectedRows, insertId }
 */
const extraerFilas = (res) => {
    if (!res || !res.rows) return [];
    return Array.isArray(res.rows) ? res.rows : [];
};

const limpiarEnteros = (obj) => {
    const nuevo = { ...obj };
    Object.keys(nuevo).forEach(key => {
        if (typeof nuevo[key] === 'number') nuevo[key] = Math.floor(nuevo[key]);
    });
    return nuevo;
};

const CAMPOS_GLOBALES_PERMITIDOS = [
    'cotizacion_dolar', 'garantia_ars', 'garantia_usd',
    'precio_sillita', 'cargo_retiro_aeropuerto',
    'cargo_devolucion_aeropuerto', 'precio_lavado',
    'recargo_tarjeta_1', 'recargo_tarjeta_3', 'recargo_tarjeta_6'
];

/**
 * 1. GUARDAR O ACTUALIZAR PRECIO DE UN AUTO
 * Usa UPSERT (INSERT ... ON DUPLICATE KEY UPDATE) para funcionar
 * tanto si el mes/auto ya existe como si es nuevo.
 * Requiere: UNIQUE KEY (auto_id, mes, anio) en la tabla.
 */
exports.saveOrUpdatePreciosMensuales = async (req, res) => {
    const {
        mes, anio, auto_id, precio_auto_mensual_ars,
        precio_sillita, garantia_ars, garantia_usd, cotizacion_dolar,
        cargo_retiro_aeropuerto, cargo_devolucion_aeropuerto, precio_lavado,
        recargo_tarjeta_1, recargo_tarjeta_3, recargo_tarjeta_6
    } = req.body;

    if (!mes || !anio || !auto_id) {
        return res.status(400).json({ error: "Faltan campos requeridos: mes, anio, auto_id" });
    }

    // Para el INSERT nuevo intentamos heredar los globales del mes si ya existen
    const globalesRows = extraerFilas(
        await db.query(
            'SELECT * FROM precios_mensuales WHERE mes = ? AND anio = ? LIMIT 1',
            [mes, anio]
        ).catch(() => ({ rows: [] }))
    );
    const g = globalesRows[0] || {};

    const sillita    = precio_sillita            ?? g.precio_sillita            ?? 0;
    const garArs     = garantia_ars              ?? g.garantia_ars              ?? 0;
    const garUsd     = garantia_usd              ?? g.garantia_usd              ?? 0;
    const cotDolar   = cotizacion_dolar          ?? g.cotizacion_dolar          ?? 0;
    const retAero    = cargo_retiro_aeropuerto   ?? g.cargo_retiro_aeropuerto   ?? 0;
    const devAero    = cargo_devolucion_aeropuerto ?? g.cargo_devolucion_aeropuerto ?? 0;
    const lavado     = precio_lavado             ?? g.precio_lavado             ?? 0;
    const recT1      = recargo_tarjeta_1         ?? g.recargo_tarjeta_1         ?? 8;
    const recT3      = recargo_tarjeta_3         ?? g.recargo_tarjeta_3         ?? 16;
    const recT6      = recargo_tarjeta_6         ?? g.recargo_tarjeta_6         ?? 32;
    const precio     = Number(precio_auto_mensual_ars) || 0;

    try {
        await db.query(
            `INSERT INTO precios_mensuales
             (auto_id, mes, anio,
              precio_sillita, garantia_ars, garantia_usd, cotizacion_dolar,
              cargo_retiro_aeropuerto, cargo_devolucion_aeropuerto, precio_lavado,
              recargo_tarjeta_1, recargo_tarjeta_3, recargo_tarjeta_6,
              precio_auto_mensual_ars)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               precio_auto_mensual_ars = VALUES(precio_auto_mensual_ars)`,
            [auto_id, mes, anio, sillita, garArs, garUsd, cotDolar, retAero, devAero, lavado, recT1, recT3, recT6, precio]
        );

        // Sincronizar precio base en tabla cars
        await db.query(
            'UPDATE cars SET prices_ars = ? WHERE id = ?',
            [precio, auto_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error en saveOrUpdate:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 2. ACTUALIZAR VARIABLE GLOBAL DEL MES PARA TODOS LOS AUTOS
 * Si el mes no tiene registros, los crea para TODOS los autos existentes.
 */
exports.updateGlobalTarifas = async (req, res) => {
    const { mes, anio, campo, valor } = req.body;

    if (!CAMPOS_GLOBALES_PERMITIDOS.includes(campo)) {
        return res.status(400).json({ error: `Campo no permitido: ${campo}` });
    }
    if (!mes || !anio || valor === undefined) {
        return res.status(400).json({ error: "Faltan campos: mes, anio, valor" });
    }

    try {
        // Intentar actualizar todos los registros del mes
        const updateRaw = await db.query(
            `UPDATE precios_mensuales SET \`${campo}\` = ? WHERE mes = ? AND anio = ?`,
            [valor, mes, anio]
        );
        const affectedRows = updateRaw?.rows?.affectedRows ?? 0;

        if (affectedRows === 0) {
            // El mes está vacío → obtener todos los autos y crear sus registros
            const autosRows = extraerFilas(await db.query('SELECT id FROM cars WHERE estado != ?', ['Eliminado']));

            if (autosRows.length === 0) {
                return res.json({ success: true, message: "Sin autos registrados" });
            }

            // Construir INSERT múltiple con todos los autos, poniendo el campo pedido en su valor
            const placeholders = autosRows.map(() => '(?, ?, 0, 0, 0, 0, 0, 0, 0, 0)').join(', ');
            const values = autosRows.flatMap(a => [a.id, mes === undefined ? mes : Number(mes)]);

            // Usamos UPSERT individual por auto para poder setear el campo dinámico
            for (const auto of autosRows) {
                const insertValues = {
                    cotizacion_dolar: 0, garantia_ars: 0, garantia_usd: 0,
                    precio_sillita: 0, cargo_retiro_aeropuerto: 0,
                    cargo_devolucion_aeropuerto: 0, precio_lavado: 0,
                    recargo_tarjeta_1: 8, recargo_tarjeta_3: 16, recargo_tarjeta_6: 32
                };
                insertValues[campo] = Number(valor);

                await db.query(
                    `INSERT INTO precios_mensuales
                     (auto_id, mes, anio,
                      precio_sillita, garantia_ars, garantia_usd, cotizacion_dolar,
                      cargo_retiro_aeropuerto, cargo_devolucion_aeropuerto, precio_lavado,
                      recargo_tarjeta_1, recargo_tarjeta_3, recargo_tarjeta_6,
                      precio_auto_mensual_ars)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                     ON DUPLICATE KEY UPDATE \`${campo}\` = VALUES(\`${campo}\`)`,
                    [
                        auto.id, mes, anio,
                        insertValues.precio_sillita,
                        insertValues.garantia_ars,
                        insertValues.garantia_usd,
                        insertValues.cotizacion_dolar,
                        insertValues.cargo_retiro_aeropuerto,
                        insertValues.cargo_devolucion_aeropuerto,
                        insertValues.precio_lavado,
                        insertValues.recargo_tarjeta_1,
                        insertValues.recargo_tarjeta_3,
                        insertValues.recargo_tarjeta_6
                    ]
                );
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error en updateGlobal:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * 3. LISTAR TODOS LOS PRECIOS
 */
exports.getAllPreciosMensuales = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM precios_mensuales ORDER BY anio, mes, auto_id');
        const filas = extraerFilas(result);
        res.json(filas.map(limpiarEnteros));
    } catch (error) {
        console.error("Error en getAllPreciosMensuales:", error);
        res.status(500).json({ error: error.message });
    }
};