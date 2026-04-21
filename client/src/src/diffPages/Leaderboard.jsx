import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
const boardConfetiColors = [
  "#9D6381", "#E8735A", "#f6d860", "#7ec8e3",
  "#b5ead7", "#ffb7b2", "#c7f2a4", "#ffc8dd",
];
function ConfettiBg({ count = 18 }) {
  const confPieces = Array.from({ length: count }, (_, i) => ({
    colorVal: boardConfetiColors[i % boardConfetiColors.length],
    leftPos: `${(i * 7.3) % 100}%`,
    sizeVal: 5 + (i % 4),
    delayVal: `${(i * 0.19).toFixed(2)}s`,
    durVal: `${2 +(i % 5) * 0.35}s`,
    circleShape: i % 3 === 0,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      {confPieces.map((p, i) => (
        <div
          key={i}
          style={{
            position:"absolute",
            left: p.leftPos,
            top:"-8px",
            width: p.sizeVal,
            height: p.sizeVal,
            backgroundColor: p.colorVal,
            borderRadius: p.circleShape ?"50%" : "2px",
            opacity: 0.8,
            animation: `confettiFall ${p.durVal} ${p.delayVal} ease-in infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(130px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
const topThreeWinn = [
  {
    icon:"👑",
    bobAnim: true,
    circleBg:"#f6d860",
    circleText: "#7a6000",
    border:"2px solid #f6d860",
    confettiCount: 22,
  },
  {
    icon: "🥈",
    bobAnim:false,
    circleBg: "#D3D1C7",
    circleText:"#444441",
    border: "1.5px solid #D3D1C7",
    confettiCount:16,
  },
  {
    icon: "🥉",
    bobAnim: false,
    circleBg:"#F5C4B3",
    circleText: "#993C1D",
    border:"1.5px solid #F5C4B3",
    confettiCount: 16,
  },
];
function TopCard({ user, config, rank }) {
  //renders top 3 podium cards
  let crownAnimStr = undefined;
  if (config.bobAnim) crownAnimStr= "crownBob 2.2s ease-in-out infinite";
  let nameLtr ="?";
  if (user.name) nameLtr = user.name[0].toUpperCase();
  let dayStr ="points";
  if (user.points === 1) dayStr= "point";
  return (
    <div
      className="relative flex-1 overflow-hidden bg-white rounded-2xl flex flex-col items-center gap-2 pt-5 pb-4 px-3"
      style={{ border: config.border }}
    >
      <ConfettiBg count={config.confettiCount} />
      <span
        style={{
          fontSize: 26,
          lineHeight: 1,
          display:"inline-block",
          animation: crownAnimStr,
        }}
      >
        {config.icon}
      </span>
      <div
        className="flex items-center justify-center rounded-full z-10"
        style={{ width: 56, height: 56, backgroundColor: config.circleBg }}
      >
        <span style={{ fontSize: 26, fontWeight: 500, color: config.circleText, lineHeight: 1 }}>
          {rank}
        </span>
      </div>
      <div className="w-11 h-11 rounded-full bg-[#E8735A] flex items-center justify-center text-white text-sm font-medium z-10">
        {nameLtr}
      </div>
      <span className="text-sm font-medium text-gray-800 z-10">{user.name}</span>
      <span className="text-sm font-medium z-10" style={{ color:"#9D6381" }}>
        🔥 {user.days} points
      </span>
      <style>{`
        @keyframes crownBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
export default function Leaderboard() {
  const { deckId } =useParams();
  const [leaderboard, setLeaderboard]= useState([]);
  const [loading, setLoading] = useState(true);
  //runs on mount fetches the leaderboard
  useEffect(() => {
  //fetches leaderboard for this deck
  setLoading(true);
  fetch(`/api/decks/${deckId}/leaderboard`, { credentials:"include" })
    .then((resObj) => resObj.json())
    .then((datBuff) => setLeaderboard(datBuff.map(r => ({
      rank: r.rank,
      name: r.user_name,
      days: r.total_deck_points
    }))))
    .catch(()=> setLeaderboard([]))
    .finally(() =>setLoading(false));
}, [deckId]);
  //top 3 get the podium cards evryone else goes in the list
  const top3= leaderboard.slice(0, 3);
  const belowTop = leaderboard.slice(3);
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar activePage="leaderboard" />
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
            <p className="text-sm text-gray-400 mt-1">Ranked by points</p>
          </div>
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex items-center justify-center text-gray-400 text-sm">
              Loading...
            </div>
          )}
          {!loading && leaderboard.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400 text-sm">
              No entries yet — be the first!
            </div>
          )}
          {!loading && top3.length > 0 && (
            //podium cards for top 3
            <div className="flex gap-3">
              {top3.map((user, i) => (
                <TopCard key={user.rank ?? i} user={user} config={topThreeWinn[i]} rank={i + 1} />
              ))}
            </div>
          )}
          {!loading && belowTop.length > 0 && (
            //rest of the list below top 3
            <div className="flex flex-col gap-3">
              {belowTop.map((user, i) => {
                let dayStr= "points";
                if (user.points === 1) dayStr = "point";
                let nameLtr ="?";
                if (user.name) nameLtr= user.name[0].toUpperCase();
                return (
                  <div
                    key={user.rank ?? i + 3}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4"
                    style={{ animation: `rowIn 0.4s ${i * 0.1}s ease both` }}
                  >
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span style={{ fontSize: 22, fontWeight: 500, color:"#888780", lineHeight: 1 }}>
                        {i + 4}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#E8735A] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {nameLtr}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-600">{user.name}</span>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>🔥</span>
                    <span>{user.days} points</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <style>{`
          @keyframes rowIn {
            from { opacity: 0; transform: translateX(-16px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          `}</style>
        </div>
      </main>
    </div>
  );
}