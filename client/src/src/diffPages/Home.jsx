export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* This is the navbar I did */}
      <nav className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">StudyStrike</span>
        <div className="flex gap-6 text-sm text-gray-600">
        <span className="cursor-pointer hover:text-red-400">Quiz</span>
        <span className="cursor-pointer hover:text-red-400">Leaderboard</span>
        <span className="cursor-pointer hover:text-red-400">Home</span>
        <span className="cursor-pointer hover:text-red-400">Study</span>
        </div>
        {/* This is the profile circle I did */}
        <div className="w-8 h-8 bg-red-400 rounded-full"></div>
        </nav>
        {/* This is the welcome message I did */}
        <h1 className="text-2xl font-bold mb-6">Welcome back, Name</h1>
        <div className="p-8">
        {/* This is the cards row I did */}
        <div className="flex gap-4">
            {/* This is the continue card I did */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex-1">
            <p className="text-sm text-gray-500 mb-4">12 / 20 cards mastered</p>
            <p className="font-bold mb-1">Subject name"SWE" - Chapter 3</p>
            <button className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Continue</button>
            </div>
            {/* This is the start quiz card I did */}
          <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex flex-col items-center justify-center">
            <p className="font-bold mb-4">Start Quiz</p>
            <button className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium text-sm">
            Begin</button>
            </div>
            {/* This is the browse sets card I did */}
            <div className="bg-white rounded-2xl shadow-md p-6 flex-1 flex flex-col items-center justify-center">
            <p className="font-bold mb-4">Browse Sets</p>
            <button className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium">
            Explore</button>
          </div>
         </div>
        </div>
    </div>)}