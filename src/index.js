import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ConfiguracionProvider } from './contexts/ConfiguracionContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// PWA Service Worker

// Registrar Service Worker para PWA
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('✅ PWA: App lista para uso offline');
  },
  onUpdate: () => {
    console.log('🔄 PWA: Nueva versión disponible');
  }
});
