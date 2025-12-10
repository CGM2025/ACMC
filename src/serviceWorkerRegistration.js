// src/serviceWorkerRegistration.js

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // En localhost, verificar si existe el service worker
        checkValidServiceWorker(swUrl, config);
        
        navigator.serviceWorker.ready.then(() => {
          console.log('📱 PWA: Service Worker listo (localhost)');
        });
      } else {
        // En producción, registrar normalmente
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('✅ PWA: Service Worker registrado');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nuevo contenido disponible
              console.log('🔄 PWA: Nueva versión disponible');

              if (config && config.onUpdate) {
                config.onUpdate(registration);
              } else {
                // Si no hay callback de onUpdate, mostrar notificación manual
                showUpdateNotification();
              }
            } else {
              // Contenido cacheado para uso offline
              console.log('📦 PWA: Contenido cacheado para uso offline');
              
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('❌ PWA: Error registrando Service Worker:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No se encontró service worker, recargar
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker encontrado, registrar
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('📴 PWA: Sin conexión a internet. App funcionando offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Mostrar notificación de actualización disponible
function showUpdateNotification() {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #2563eb;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <span>🔄 Nueva versión disponible</span>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #2563eb;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">
        Actualizar
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        color: white;
        border: none;
        padding: 4px;
        cursor: pointer;
        font-size: 18px;
      ">
        ✕
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
}

// Verificar si la app está instalada como PWA
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Verificar si se puede instalar
export function canInstallPWA() {
  return 'BeforeInstallPromptEvent' in window || 
         ('serviceWorker' in navigator && !isPWAInstalled());
}
