// src/components/InstallPWA.jsx
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * Componente que muestra un banner para instalar la PWA
 * Solo aparece cuando:
 * 1. El navegador soporta instalación de PWA
 * 2. La app no está ya instalada
 * 3. El usuario no ha descartado el banner
 */
const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Verificar si ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
    
    if (isStandalone) {
      return; // Ya está instalada, no mostrar banner
    }

    // Verificar si el usuario ya descartó el banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // No mostrar por 7 días después de descartar
      }
    }

    // Para iOS, mostrar instrucciones manuales
    if (isIOSDevice) {
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Para Android/Chrome, escuchar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('✅ PWA instalada exitosamente');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    // Mostrar prompt de instalación
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`📱 Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} instalación`);
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
    setShowBanner(false);
    setShowIOSInstructions(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner principal */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Smartphone size={28} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Instalar App</h3>
            <p className="text-sm text-white/90 mb-3">
              Accede más rápido desde tu pantalla de inicio
            </p>
            
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Download size={18} />
              {isIOS ? 'Ver instrucciones' : 'Instalar ahora'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de instrucciones para iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <h2 className="text-xl font-bold mb-2">Instalar en iPhone/iPad</h2>
              <p className="text-white/90 text-sm">Sigue estos pasos para agregar la app a tu pantalla de inicio</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Toca el botón Compartir</p>
                  <p className="text-sm text-gray-500">El ícono de cuadrado con flecha hacia arriba en Safari</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Busca "Agregar a Inicio"</p>
                  <p className="text-sm text-gray-500">Desliza hacia abajo en el menú que aparece</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Toca "Agregar"</p>
                  <p className="text-sm text-gray-500">¡Listo! La app aparecerá en tu pantalla de inicio</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={handleDismiss}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
