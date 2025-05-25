// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@radix-ui/themes/styles.css";
import { Theme } from '@radix-ui/themes';
import './index.css'
import App from './App.tsx'
import { NotificationProvider } from './contexts/NotificationProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  {/* <StrictMode> */}
  <Theme>
    <NotificationProvider>
    <App />
    </NotificationProvider>
  </Theme>
  {/* </StrictMode>, */}
  </BrowserRouter>
)
