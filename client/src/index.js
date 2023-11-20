import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from '@mui/material';
import defaultTheme from './themes/defaultTheme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={defaultTheme}>
    <React.StrictMode>
    <div style={{ backgroundColor: '#ccccff', position: 'relative', height: '100%', width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
            height: '100%',
            background: 'rgb(221,217,195)',
            background: 'linear-gradient(180deg, rgba(221,217,195,1) 0%, rgba(176,198,225,1) 74%, rgba(176,198,225,1) 83%, rgba(202,217,235,1) 100%)'
            // backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            // backgroundSize: '20px 20px',
          }}
        />
      <App />
      </div>
    </React.StrictMode>
  </ThemeProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
