import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./src/diffPages/Login.jsx";
import Home from "./src/diffPages/Home_Page.jsx";
import Dashboard from "./src/diffPages/Dashboard.jsx";
import Study from "./src/diffPages/Study_Page.jsx";
import Create from "./src/diffPages/Create_Edit_Card.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study" element={<Study />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </BrowserRouter>
  );
}