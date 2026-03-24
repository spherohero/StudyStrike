import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";

export default function Navbar({ activePage }) {
  const { user, logout } = useContext(BackendAuthConnection);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="w-full h-16 shadow-md flex items-center justify-between px-8 bg-white sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold text-slate-900">StudyStrike</Link>

      <nav className="flex gap-8 text-sm text-slate-700">
        <Link to="/" className={activePage === "home" ? "underline font-semibold" : "hover:underline"}>Home</Link>
        {user && (
          <>
            <Link to="/dashboard" className={activePage === "dashboard" ? "underline font-semibold" : "hover:underline"}>Dashboard</Link>
            <Link to="/study" className={activePage === "study" ? "underline font-semibold" : "hover:underline"}>Study</Link>
            <Link to="/create" className={activePage === "create" ? "underline font-semibold" : "hover:underline"}>Create</Link>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-500">{user.name || user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">
            <div className="w-10 h-10 rounded-full bg-[#9D6381] hover:opacity-80 transition" title="Login" />
          </Link>
        )}
      </div>
    </div>
  );
}
