import {Link} from "react-router-dom";
import React from "react";
const leaderboardData = [
{rank: 1, name: "Sarah",days: 10 },
{rank: 2, name: "James",days: 9 },
{rank: 3, name: "Alex",days: 5 },
{rank: 4, name: "Maria",days: 4 },
{rank: 5, name: "Chris",days: 3 },];
export default function Leaderboard() {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      {/* This is the header I did */}
      <div className="w-full h-16 shadow-md flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">StudyStrike</h1>
        <div className="flex gap-10 text-sm">
        <Link to="/"className="cursor-pointer">Home</Link>
        <Link to="/study"className="cursor-pointer">Study</Link>
        <Link to="/create"className="cursor-pointer">Create</Link>
        {/* This is the active leaderboard link I did */}
        <Link to="/leaderboard" className="cursor-pointer underline">Leaderboard</Link>
        </div>
        {/* This is the profile circle I did */}
        <Link to="/login" className="w-10 h-10 bg-purple-400 rounded-full" />
      </div>
      {/* This is the leaderboard content I did */}
      <div className="px-16 py-10">
        <h2 className="text-3xl font-bold mb-6">Leaderboard</h2>
        {/* This is the leaderboard list I did */}
        <div className="flex flex-col gap-4 max-w-2xl">
          {leaderboardData.map((user)=>(
            <div
            key={user.rank}
            className="p-6 shadow-md rounded-xl flex justify-between items-center">
            {/* This is the rank and name I did */}
            <span className="font-medium">#{user.rank} {user.name}</span>
            {/* This is the days count I did */}
            <span className="text-gray-500">{user.days} days</span>
        </div>))}
        </div>
      </div>
    </div>);}