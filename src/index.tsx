import React from 'react';
import ReactDOM from 'react-dom/client';
import { IconContext } from 'react-icons';
import './index.css';
import './styles/animations.css'; // Import custom animations
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import and initialize i18n
import './i18n';

// Set up React Icons context provider at the app level 
// to prevent "cannot be used as a JSX component" errors
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <IconContext.Provider value={{ className: "react-icons" }}>
      <App />
    </IconContext.Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 