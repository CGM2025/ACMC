import React, { useState, useEffect } from 'react';
import { X, Download, Share, Plus, MoreVertical, Chrome } from 'lucide-react';

/**
 * Banner para guiar la instalación de la PWA en dispositivos móviles
 * Detecta el tipo de dispositivo y navegador para mostrar instrucciones específicas
 */
const InstallBanner = () => {
  const [mostrar, setMostrar] = useState(false);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  const [dispositivo, setDispositivo] = useState({ tipo: '', navegador: '' });

  useEffect(() => {
    // Detectar si es móvil y si la app NO está instalada
    const detectarDispositivo = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Detectar si ya está instalada como PWA
      const esPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;

      if (esPWA) {
        setMostrar(false);
        return;
      }

      // Detectar tipo de dispositivo
      const esIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const esAndroid = /android/i.test(userAgent);
      const esMobile = esIOS || esAndroid;

      if (!esMobile) {
        setMostrar(false);
        return;
      }

      // Detectar navegador
      let navegador = 'otro';
      if (/CriOS/i.test(userAgent)) {
        navegador = 'chrome-ios';
      } else if (/Chrome/i.test(userAgent) && !esIOS) {
        navegador = 'chrome';
      } else if (/Safari/i.test(userAgent) && esIOS) {
        navegador = 'safari';
      } else if (/EdgA/i.test(userAgent) || /Edge/i.test(userAgent)) {
        navegador = 'edge';
      } else if (/SamsungBrowser/i.test(userAgent)) {
        navegador = 'samsung';
      } else if (/Firefox/i.test(userAgent)) {
        navegador = 'firefox';
      }

      setDispositivo({
        tipo: esIOS ? 'ios' : 'android',
        navegador
      });

      // Verificar si el usuario ya descartó el banner
      const bannerDescartado = localStorage.getItem('pwa-banner-descartado');
      const tiempoDescarte = localStorage.getItem('pwa-banner-tiempo');

      // Mostrar de nuevo después de 7 días
      if (bannerDescartado && tiempoDescarte) {
        const diasPasados = (Date.now() - parseInt(tiempoDescarte)) / (1000 * 60 * 60 * 24);
        if (diasPasados < 7) {
          setMostrar(false);
          return;
        }
      }

      setMostrar(true);
    };

    // Esperar un poco antes de mostrar el banner
    const timer = setTimeout(detectarDispositivo, 2000);
    return () => clearTimeout(timer);
  }, []);

  const cerrarBanner = () => {
    setMostrar(false);
    localStorage.setItem('pwa-banner-descartado', 'true');
    localStorage.setItem('pwa-banner-tiempo', Date.now().toString());
  };

  const getInstrucciones = () => {
    const { tipo, navegador } = dispositivo;

    if (tipo === 'ios') {
      if (navegador === 'safari') {
        return {
          titulo: 'Instalar en iPhone/iPad (Safari)',
          pasos: [
            { icono: <Share className="w-5 h-5" />, texto: 'Toca el botón Compartir (cuadro con flecha hacia arriba)' },
            { icono: <Plus className="w-5 h-5" />, texto: 'Desplázate y selecciona "Añadir a pantalla de inicio"' },
            { icono: <Download className="w-5 h-5" />, texto: 'Toca "Añadir" para instalar' }
          ],
          nota: 'La app se instalará con el logo de ACMC en tu pantalla de inicio.'
        };
      } else {
        return {
          titulo: 'Instalar en iPhone/iPad',
          pasos: [
            { icono: <Chrome className="w-5 h-5" />, texto: 'Abre esta página en Safari (el navegador de Apple)' },
            { icono: <Share className="w-5 h-5" />, texto: 'Toca el botón Compartir' },
            { icono: <Plus className="w-5 h-5" />, texto: 'Selecciona "Añadir a pantalla de inicio"' }
          ],
          nota: 'En iOS, solo Safari permite instalar apps web.'
        };
      }
    }

    // Android
    if (navegador === 'chrome') {
      return {
        titulo: 'Instalar en Android (Chrome)',
        pasos: [
          { icono: <MoreVertical className="w-5 h-5" />, texto: 'Toca el menú (3 puntos verticales arriba a la derecha)' },
          { icono: <Download className="w-5 h-5" />, texto: 'Busca "Instalar aplicación" o "Añadir a pantalla de inicio"' },
          { icono: <Plus className="w-5 h-5" />, texto: 'Confirma tocando "Instalar" o "Añadir"' }
        ],
        nota: 'Si no ves la opción, desplázate hacia abajo en el menú.'
      };
    }

    if (navegador === 'edge') {
      return {
        titulo: 'Instalar en Android (Edge)',
        pasos: [
          { icono: <MoreVertical className="w-5 h-5" />, texto: 'Toca el menú (3 líneas o puntos)' },
          { icono: <Download className="w-5 h-5" />, texto: 'Selecciona "Agregar al teléfono" o "Instalar"' },
          { icono: <Plus className="w-5 h-5" />, texto: 'Confirma la instalación' }
        ],
        nota: null
      };
    }

    if (navegador === 'samsung') {
      return {
        titulo: 'Instalar en Samsung Internet',
        pasos: [
          { icono: <MoreVertical className="w-5 h-5" />, texto: 'Toca el menú (3 líneas abajo)' },
          { icono: <Plus className="w-5 h-5" />, texto: 'Selecciona "Añadir página a" → "Pantalla de inicio"' },
          { icono: <Download className="w-5 h-5" />, texto: 'Confirma tocando "Añadir"' }
        ],
        nota: null
      };
    }

    // Genérico para Android
    return {
      titulo: 'Instalar en tu dispositivo',
      pasos: [
        { icono: <MoreVertical className="w-5 h-5" />, texto: 'Abre el menú del navegador' },
        { icono: <Download className="w-5 h-5" />, texto: 'Busca "Instalar app" o "Añadir a pantalla de inicio"' },
        { icono: <Plus className="w-5 h-5" />, texto: 'Confirma la instalación' }
      ],
      nota: 'Para mejor experiencia, usa Chrome o Edge.'
    };
  };

  if (!mostrar) return null;

  const instrucciones = getInstrucciones();

  return (
    <>
      {/* Banner principal */}
      {!mostrarInstrucciones && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50 animate-slide-up">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2">
                <img
                  src="/icons/favicon-96x96.png"
                  alt="ACMC"
                  className="w-10 h-10"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <p className="font-semibold text-sm">Instala ACMC</p>
                <p className="text-xs text-blue-100">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarInstrucciones(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={cerrarBanner}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal con instrucciones */}
      {mostrarInstrucciones && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">{instrucciones.titulo}</h2>
              <button
                onClick={() => {
                  setMostrarInstrucciones(false);
                  cerrarBanner();
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-4">
              {/* Pasos */}
              <div className="space-y-3">
                {instrucciones.pasos.map((paso, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-blue-600">{paso.icono}</span>
                      <span className="text-gray-700 text-sm">{paso.texto}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nota */}
              {instrucciones.nota && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 text-sm">{instrucciones.nota}</p>
                </div>
              )}

              {/* Beneficios */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Beneficios de instalar:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Acceso rápido desde tu pantalla de inicio
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Funciona sin barra de navegador
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Actualizaciones automáticas
                  </li>
                </ul>
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => {
                  setMostrarInstrucciones(false);
                  cerrarBanner();
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de animación */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallBanner;
