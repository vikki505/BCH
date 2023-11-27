import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from '@mui/material';
import defaultTheme from './themes/defaultTheme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={defaultTheme}>
    <React.StrictMode>
      <div style={{position: 'relative', height: '100%', width: '100%' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: "#74EBD5",
            backgroundImage: "linear-gradient(90deg, #74EBD5 0%, #9FACE6 100%)",
          }}
        />
        <App />
      </div>
    </React.StrictMode>
  </ThemeProvider>
);