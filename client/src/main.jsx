import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Authenticator } from './context/BackendAuthConnection.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </StrictMode>,
)
