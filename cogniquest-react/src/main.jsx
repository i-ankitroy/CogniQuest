import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed — it double-invokes state updaters in dev,
// which breaks ref-based game logic (double matchCount increments, etc.)
createRoot(document.getElementById('root')).render(<App />)
