import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'                    // Tailwind base/components/utilities (lowest priority)
import './styles/design-tokens.css'     // CSS custom properties (override Tailwind vars)
import './styles/components.css'        // Component classes (highest priority)
import App from './App.tsx'
import { initializeAnnotations } from './domains/annotations'

// Initialize annotation system before rendering
initializeAnnotations();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
