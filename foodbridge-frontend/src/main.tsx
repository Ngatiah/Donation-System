// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "@radix-ui/themes/styles.css";
import { Theme } from '@radix-ui/themes';
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  {/* <StrictMode> */}
  <Theme>
    <App />
  </Theme>
  {/* </StrictMode>, */}
  </BrowserRouter>
)
