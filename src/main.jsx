import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// HashRouter is required (not BrowserRouter): the production build is loaded
// via a file:// URL (mainWindow.loadFile), and BrowserRouter's pushState-based
// routes cannot resolve paths like "file:///dashboard" — the window would show
// a blank page after any navigation or refresh.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
