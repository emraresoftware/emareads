import React from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';
import PopupApp from './PopupApp';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
