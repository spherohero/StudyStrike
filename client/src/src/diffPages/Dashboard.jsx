import React, { useState } from "react";
// LATER
// import React, { useState, useEffect } from "react";
// import { supabase } from "../lib/supabase";

const allDecks = [
  { title: "Biology Basics", terms: 100 },
  { title: "Chemistry", terms: 80 },
  { title: "Physics", terms: 120 },
  { title: "Math", terms: 60 },
  { title: "History", terms: 90 },
  { title: "CS Fundamentals", terms: 150 },
  { title: "Geography", terms: 70 },
  { title: "Economics", terms: 110 },
  { title: "Psychology", terms: 95 },
];

const DECKS_PER_PAGE = 6;

function DeckCard({ deck }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between h-[220px] hover:shadow-lg transition cursor-pointer">
      <div>
        <h3 className="text-lg font-semibold">{deck.title}</h3>
        <p className="text-gray-500 text-sm mt-2">
          {deck.terms} terms
        </p>
      </div>

      <button className="text-purple-600 text-sm font-medium self-end">
        Edit
      </button>
    </div>
  );
}

// export default function Desktop() {
//   const [page, setPage] = useState(1);
//   const [decks, setDecks] = useState([]);

//   // SUPABASE FETCH
//   useEffect(() => {
//     const fetchDecks = async () => {
//       const { data, error } = await supabase
//         .from("decks")
//         .select("*");

//       if (error) {
//         console.error("Supabase error:", error);
//       } else {
//         setDecks(data);
//       }
//     };

//     fetchDecks();
//   }, []);


export default function Desktop() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(allDecks.length / DECKS_PER_PAGE);

  const start = (page - 1) * DECKS_PER_PAGE;
  const currentDecks = allDecks.slice(
    start,
    start + DECKS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* HEADER */}
      <div className="w-full h-16 shadow-sm flex items-center justify-between px-8">
        <h1 className="text-xl font-bold">StudyStrike</h1>

        <div className="flex gap-8 text-sm">
          <span className="underline">Home</span>
          <span>Study</span>
          <span>Quiz</span>
          <span>Leaderboard</span>
        </div>

        <div className="w-10 h-10 bg-purple-400 rounded-full"></div>
      </div>

      {/* HERO */}
      <div className="bg-purple-400 text-white px-16 py-20">
        <h2 className="text-4xl font-bold">Your decks</h2>
        <p className="mt-4 text-lg opacity-90 max-w-xl">
          Create your own personalized flashcard decks and practice efficiently.
        </p>
      </div>

      {/* CONTENT */}
      <div className="px-16 py-10 flex flex-col gap-8">

        {/* SEARCH */}
        <div className="max-w-md border rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-gray-400">🔍</span>
          <input
            placeholder="Search decks..."
            className="w-full outline-none"
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDecks.map((deck, i) => (
            <DeckCard key={i} deck={deck} />
          ))}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-6 text-lg mt-6">

          {/* LEFT ARROW */}
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="disabled:opacity-30"
          >
            {"<"}
          </button>

          {/* PAGE NUMBERS */}
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`${
                page === i + 1
                  ? "font-bold underline"
                  : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          {/* RIGHT ARROW */}
          <button
            onClick={() =>
              setPage((p) => Math.min(p + 1, totalPages))
            }
            disabled={page === totalPages}
            className="disabled:opacity-30"
          >
            {">"}
          </button>

        </div>
      </div>
    </div>
  );
}
