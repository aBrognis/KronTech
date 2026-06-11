import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DesignerApp from './DesignerApp'
import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/global.css'

const saved = localStorage.getItem('kt-theme')
if (saved === 'light') document.documentElement.classList.add('light')

const isDesigner = new URLSearchParams(window.location.search).get('mode') === 'designer'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDesigner ? <DesignerApp /> : <App />}
  </React.StrictMode>
)
