import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { JourneyProvider } from './state/JourneyProvider.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <JourneyProvider>
      <App />
    </JourneyProvider>
  </StrictMode>,
);
