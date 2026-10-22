import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// No StrictMode: its dev double-mount loses the WebGL context in the r3f Canvas (blank white page).
createRoot(document.getElementById('root')).render(<App />)
