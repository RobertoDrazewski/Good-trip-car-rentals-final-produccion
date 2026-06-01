import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';

// Inyecta Google Translate una sola vez
function injectGoogleTranslate() {
  if (document.getElementById('gt-script')) return;

  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      { pageLanguage: 'es', autoDisplay: false },
      'google_translate_element'
    );
  };

  const script = document.createElement('script');
  script.id = 'gt-script';
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(script);

  // Contenedor oculto requerido por Google
  const div = document.createElement('div');
  div.id = 'google_translate_element';
  div.style.display = 'none';
  document.body.appendChild(div);
}

// Cambia el idioma usando la cookie de Google Translate
function changeLanguage(langCode) {
  // Borra cookie anterior
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = `googtrans=/es/${langCode}; path=/`;
  window.location.reload();
}

// Detecta qué idioma está activo ahora
function getActiveLang() {
  const match = document.cookie.match(/googtrans=\/es\/(\w+)/);
  return match ? match[1] : 'es';
}

const LANGS = [
  {
    code: 'es',
    label: 'Español',
    flag: (
      // Argentina flag SVG
      <svg viewBox="0 0 36 24" width="28" height="18" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="24" fill="#74ACDF"/>
        <rect y="8" width="36" height="8" fill="#fff"/>
        {/* Sol de Mayo simplificado */}
        <circle cx="18" cy="12" r="2.5" fill="#F6B40E" stroke="#85340A" strokeWidth="0.3"/>
      </svg>
    ),
  },
  {
    code: 'pt',
    label: 'Português',
    flag: (
      // Brazil flag SVG
      <svg viewBox="0 0 36 24" width="28" height="18" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="24" fill="#009C3B"/>
        <polygon points="18,3 33,12 18,21 3,12" fill="#FFDF00"/>
        <circle cx="18" cy="12" r="4.5" fill="#002776"/>
        <path d="M13.8,10.5 Q18,8.5 22.2,10.5" stroke="#fff" strokeWidth="0.8" fill="none"/>
      </svg>
    ),
  },
  {
    code: 'en',
    label: 'English',
    flag: (
      // USA flag SVG (simplified)
      <svg viewBox="0 0 36 24" width="28" height="18" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="24" fill="#B22234"/>
        {[1,3,5,7,9,11].map(i => (
          <rect key={i} y={i*24/13} width="36" height={24/13} fill="#fff"/>
        ))}
        <rect width="14.4" height={24*7/13} fill="#3C3B6E"/>
        {/* Stars simplified as small circles */}
        {[0,1,2,3,4].map(row =>
          [0,1,2,3,4,5].map(col => (
            col < (row % 2 === 0 ? 6 : 5) && (
              <circle
                key={`${row}-${col}`}
                cx={1.2 + col * 2.4 + (row % 2 === 0 ? 0 : 1.2)}
                cy={1.5 + row * 1.8}
                r="0.55"
                fill="#fff"
              />
            )
          ))
        )}
      </svg>
    ),
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLang, setActiveLang] = useState('es');
  const [selectorVisible, setSelectorVisible] = useState(true);
  const [hiding, setHiding] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    injectGoogleTranslate();
    setActiveLang(getActiveLang());

    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLangSelect = (code) => {
    setActiveLang(code);
    // Fade out + slide up, luego traduce
    setHiding(true);
    hideTimer.current = setTimeout(() => {
      setSelectorVisible(false);
      if (code !== 'es') {
        changeLanguage(code);
      } else {
        // Volver a español: limpiar cookie y recargar
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.reload();
      }
    }, 400);
  };

  // Los href coinciden con los id reales de las <section> en Home.jsx
  const navLinks = [
    { href: '#flota', label: 'Flota' },
    { href: '#requisitos', label: 'Requisitos' },
    { href: '#reserva-y-opiniones', label: 'Reservas' },
    { href: '#guias-rutas', label: 'Rutas' },
  ];

  const otherLangs = LANGS.filter(l => l.code !== activeLang);

  return (
    <>
      <style>{`
        .lang-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.4s ease, transform 0.4s ease;
          opacity: 1;
          transform: translateY(0px);
        }
        .lang-selector.hiding {
          opacity: 0;
          transform: translateY(-8px);
        }
        .flag-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 3px 5px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s, border-color 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
          backdrop-filter: blur(6px);
        }
        .flag-btn:hover {
          background: rgba(136,189,242,0.15);
          border-color: rgba(136,189,242,0.4);
          transform: scale(1.08);
        }
        .flag-btn.active {
          background: rgba(136,189,242,0.2);
          border-color: rgba(136,189,242,0.5);
        }
        .flag-btn span {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #88BDF2;
        }
        .flag-btn svg {
          border-radius: 3px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
      `}</style>

      <nav className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
        isScrolled
          ? 'h-14 bg-[#1E222F]/90 backdrop-blur-lg shadow-2xl border-b border-slate-800/50'
          : 'h-16 bg-gradient-to-b from-[#121319]/80 to-transparent'
      }`}>

        <div className="max-w-[1440px] h-full mx-auto px-4 md:px-12 flex justify-between items-center relative">

          {/* Links Desktop */}
          <div className="hidden lg:flex items-center gap-8 flex-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-colors text-white hover:text-[#88BDF2] drop-shadow-md"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Selector de idioma + menú mobile */}
          <div className="flex-1 flex justify-end items-center gap-3">

            {/* Selector de banderas */}
            {selectorVisible && (
              <div className={`lang-selector${hiding ? ' hiding' : ''}`}>
                {/* Bandera activa (más grande, resaltada) */}
                {LANGS.filter(l => l.code === activeLang).map(l => (
                  <button key={l.code} className="flag-btn active" title={l.label} disabled>
                    {l.flag}
                    <span>{l.code}</span>
                  </button>
                ))}

                {/* Separador */}
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14, userSelect: 'none' }}>|</span>

                {/* Otras banderas */}
                {otherLangs.map(l => (
                  <button
                    key={l.code}
                    className="flag-btn"
                    title={l.label}
                    onClick={() => handleLangSelect(l.code)}
                  >
                    {l.flag}
                    <span>{l.code}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Menú hamburguesa mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center transition-all bg-[#1E222F]/60 text-white backdrop-blur-md border border-slate-800/40"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Menú mobile desplegable */}
          {isMenuOpen && (
            <div className="absolute top-[105%] left-4 right-4 bg-[#1E222F]/95 backdrop-blur-xl p-6 rounded-[22px] shadow-2xl border border-slate-800/60 lg:hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-5 text-left pl-2">
                {navLinks.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-black uppercase text-white hover:text-[#88BDF2] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </nav>
    </>
  );
}
