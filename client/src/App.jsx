import {BrowserRouter,Routes, Route}from'react-router-dom'
import Login from'./src/diffPages/Login'
import Home from'./src/diffPages/Home'
export default function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/"element={<Login />}/>
    <Route path="/home" element={<Home />}/>
    </Routes>
    </BrowserRouter>
  )
}