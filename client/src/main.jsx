import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { FlashProvider } from './context/FlashContext';
import './index.css';
// Bootstrap CSS & JS (necessário para componentes como Carousel)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#198754',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#198754',
                },
              },
              error: {
                style: {
                  background: '#dc3545',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#dc3545',
                },
              },
            }}
          />
          <App />
        </AuthProvider>
      </FlashProvider>
    </BrowserRouter>
  </React.StrictMode>
);
