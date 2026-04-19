import readingNotes from "../../assets/reading-notes.png";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";

export default function HomePage() {
  const { user } = useContext(BackendAuthConnection);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar activePage="home" />

      {/* HERO */}
      <main className="flex flex-1 items-center justify-between px-16 py-16 gap-10">
        {/* LEFT */}
        <div className="flex flex-col gap-6 max-w-xl">
          <h2 className="text-5xl font-bold leading-tight">
            An open-source way to study
          </h2>
          <p className="text-gray-500 text-lg">
            Created by fellow college students
          </p>
          <div className="flex gap-4 flex-wrap">
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-[#9D6381] text-white px-6 py-3 rounded-xl hover:bg-[#8a5270] transition"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-[#9D6381] text-white px-6 py-3 rounded-xl hover:bg-[#8a5270] transition"
                >
                  Start a learning account
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  I'm a teacher
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT (IMAGE CARD) */}
        <div className="inline-block max-w-3xl">
          <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <div className="w-3 h-3 bg-green-400 rounded-full" />
            </div>
            <img
              src={readingNotes}
              alt="Reading Notes"
              className="w-full max-w-md h-auto object-cover"
            />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full px-16 py-8 border-t flex justify-between items-center text-sm">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-lg">StudyStrike</span>
          <div className="flex gap-6 text-gray-500">
            <span>Features</span>
            <span>Learn more</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
