/* A visit to /admin (no #) is sent to the admin sign-in at /#/admin. */
try { if (/^\/admin\/?$/.test(location.pathname)) history.replaceState(null, "", "/#/admin"); } catch (e) {}
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './themes/theme.css';
import './App.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
