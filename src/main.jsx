import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './themes/theme.css';
import './index.css';
import './App.css';
import './themes/responsive.css';
import './themes/animations.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
