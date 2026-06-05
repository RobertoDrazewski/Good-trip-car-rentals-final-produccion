// client/src/WidgetDolar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Casa de referencia: 'blue' (informal). Se puede cambiar a 'oficial', 'bolsa' (MEP), etc.
const CASA_DEFAULT = 'blue';
// % de diferencia a partir del cual se dispara la alarma visual.
const UMBRAL_PCT_DEFAULT = 3;
// Cada cuánto se auto-actualiza (ms). 5 minutos.
const REFRESH_MS = 5 * 60 * 1000;

const fmt = n => Math.round(Number(n) || 0).toLocaleString('es-AR');

export default function WidgetDolar({
  casa = CASA_DEFAULT,
  umbralPct = UMBRAL_PCT_DEFAULT,
  cotizacionConfig = null,   // valor que el admin tiene cargado en Tarifas (opcional)
  titulo,                    // título opcional
}) {
  const [actual, setActual]   = useState(null);   // { compra, venta, nombre, fechaActualizacion }
  const [hist, setHist]       = useState([]);      // [{ fecha, venta }]
  const [config, setConfig]   = useState(cotizacionConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => { setConfig(cotizacionConfig); }, [cotizacionConfig]);

  const cargar = useCallback(async () => {
    setError(false);
    // 1) Valor actual del dólar (DolarAPI)
    try {
      const r = await fetch(`https://dolarapi.com/v1/dolares/${casa}`);
      if (!r.ok) throw new Error('dolarapi');
      setActual(await r.json());
    } catch (_) {
      setError(true);
    } finally {
      setLoading(false);
    }

    // 2) Histórico para el gráfico (ArgentinaDatos) — si falla, no rompe
    try {
      const h = await fetch(`https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`);
      if (h.ok) {
        const arr = await h.json();
        setHist(Array.isArray(arr) ? arr.slice(-30) : []);
      }
    } catch (_) { /* gráfico opcional */ }

    // 3) Cotización configurada en Tarifas (mes actual) — solo si no la pasaron por prop
    if (cotizacionConfig == null) {
      try {
        const t = await axios.get(`${API_BASE_URL}/api/precios-mensuales`);
        const rows = Array.isArray(t.data) ? t.data : (t.data?.[0] || []);
        const now = new Date();
        const fila = rows.find(x =>
          parseInt(x.mes, 10) === now.getMonth() + 1 &&
          parseInt(x.anio, 10) === now.getFullYear()
        ) || rows[0];
        if (fila && fila.cotizacion_dolar != null) setConfig(parseFloat(fila.cotizacion_dolar));
      } catch (_) { /* sin config, no se compara */ }
    }
  }, [casa, cotizacionConfig]);

  useEffect(() => {
    cargar();
    const iv = setInterval(cargar, REFRESH_MS);
    return () => clearInterval(iv);
  }, [cargar]);

  // ── Valores derivados ───────────────────────────────────────────────
  const venta  = actual ? parseFloat(actual.venta)  : null;
  const compra = actual ? parseFloat(actual.compra) : null;
  const cfg    = config != null ? parseFloat(config) : null;

  const diff    = (cfg != null && venta != null) ? (venta - cfg) : null;
  const diffPct = (diff != null && cfg) ? (diff / cfg) * 100 : null;
  const hayDiscrepancia = diffPct != null && Math.abs(diffPct) >= umbralPct;

  // Tendencia del histórico (primero vs último)
  const serie = hist.map(d => parseFloat(d.venta)).filter(v => !isNaN(v));
  const subio = serie.length > 1 ? serie[serie.length - 1] >= serie[0] : true;

  // Sparkline SVG (sin librerías)
  const W = 220, H = 56;
  let path = '', area = '';
  if (serie.length > 1) {
    const min = Math.min(...serie), max = Math.max(...serie), span = (max - min) || 1;
    const pts = serie.map((v, i) => {
      const x = (i / (serie.length - 1)) * W;
      const y = H - ((v - min) / span) * (H - 6) - 3;
      return [x, y];
    });
    path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    area = `${path} L${W} ${H} L0 ${H} Z`;
  }
  const lineColor = subio ? '#34d399' : '#f87171';
  const hora = actual?.fechaActualizacion
    ? new Date(actual.fechaActualizacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-[#1E222F] border border-slate-800/80 rounded-2xl p-5 text-left">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#88BDF2]">
            {titulo || `Dólar ${actual?.nombre || (casa[0].toUpperCase() + casa.slice(1))} · referencia`}
          </span>
        </div>
        <button onClick={cargar} title="Actualizar"
          className="text-slate-500 hover:text-[#88BDF2] transition-colors p-1 rounded-lg cursor-pointer">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && !actual ? (
        <p className="text-[11px] text-slate-500 italic py-4">
          No se pudo obtener la cotización ahora. Se reintenta automáticamente.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          {/* Valor actual */}
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white font-mono">${venta != null ? fmt(venta) : '—'}</span>
              <span className={`flex items-center gap-0.5 text-[11px] font-bold mb-1 ${subio ? 'text-emerald-400' : 'text-rose-400'}`}>
                {subio ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">
              Compra ${compra != null ? fmt(compra) : '—'} · Venta ${venta != null ? fmt(venta) : '—'}
            </p>
            {hora && <p className="text-[9px] text-slate-600 mt-0.5 uppercase tracking-wider">Actualizado {hora} hs</p>}
          </div>

          {/* Gráfico */}
          <div className="w-full">
            {serie.length > 1 ? (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradDolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#gradDolar)" />
                <path d={path} fill="none" stroke={lineColor} strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            ) : (
              <div className="h-14 flex items-center justify-center text-[10px] text-slate-600">Gráfico no disponible</div>
            )}
            <p className="text-[9px] text-slate-600 text-center uppercase tracking-wider">Últimos {serie.length} días</p>
          </div>
        </div>
      )}

      {/* Alarma de discrepancia */}
      {cfg != null && venta != null && (
        hayDiscrepancia ? (
          <div className="mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-black text-amber-300">¡Atención, hay una diferencia!</span>{' '}
              <span className="text-slate-300">
                Tenés configurado el dólar en <strong className="text-white">${fmt(cfg)}</strong>, pero hoy el{' '}
                {actual?.nombre || casa} está en <strong className="text-white">${fmt(venta)}</strong>{' '}
                ({diff > 0 ? '+' : ''}{Math.round(diff).toLocaleString('es-AR')}, {diffPct > 0 ? '+' : ''}{diffPct.toFixed(1)}%).
                Si querés, actualizá la cotización en Tarifas.
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-300">
              Tu cotización configurada (<strong className="text-white">${fmt(cfg)}</strong>) está alineada con el valor de hoy.
            </span>
          </div>
        )
      )}

      <p className="text-[9px] text-slate-600 mt-3 leading-relaxed">
        Valor de referencia (DolarAPI). Las tarifas son manuales: este widget no cambia nada, solo te avisa.
      </p>
    </div>
  );
}
