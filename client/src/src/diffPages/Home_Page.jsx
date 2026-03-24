import readingNotes from "../../assets/reading-notes.png";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* NAVBAR */}
      <header className="w-full px-10 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold text-slate-900">
          StudyStrike
        </h1>

        <nav className="flex items-center gap-8 text-slate-900 text-sm">
          {/* <span className="cursor-pointer">Home</span> */}
          <Link to="/" className="cursor-pointer underline">
          Home
            </Link>
          {/* <span className="cursor-pointer">Study</span> */}
          <Link to="/study" className="cursor-pointer">
             Study
            </Link>
            <Link to="/create" className="cursor-pointer">
             Create
            </Link>
            <Link to="/dashboard" className="cursor-pointer">
             Dashboard
            </Link>
          <span className="cursor-pointer">Quiz</span>
          <Link to="/leaderboard" className="cursor-pointer">Leaderboard</Link>
        </nav>
        <div className="w-10 h-10 rounded-full bg-[#9D6381]" />
      </header>

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
            <button className="bg-[#9D6381] text-white px-6 py-3 rounded-xl">
              Start a learning account
            </button>

            <button className="border border-gray-300 px-6 py-3 rounded-xl">
              I’m a teacher
            </button>
          </div>
        </div>

        {/* RIGHT (IMAGE CARD) */}
        <div className="inline-block max-w-3xl">
          <div className="rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            
            {/* fake window bar */}
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