import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDecks, duplicateDeck } from "./api";

const DECKS_PER_PAGE = 6;

function DeckCard({ deck, onDuplicate }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between h-[220px] hover:shadow-xl transition-shadow duration-200 cursor-pointer border border-gray-100">
      <div onClick={() => navigate(`/study/${deck.id}`)}>
        <h3 className="text-lg font-semibold text-gray-800 truncate">{deck.title}</h3>
        {deck.description && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{deck.description}</p>
        )}
        <p className="text-gray-400 text-xs mt-3">
          Created {new Date(deck.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate(`/study/${deck.id}`)}
          className="flex-1 bg-purple-100 text-purple-700 text-sm font-medium py-2 rounded-xl hover:bg-purple-200 transition"
        >
          Study
        </button>
        <button
          onClick={() => navigate(`/decks/${deck.id}/edit`)}
          className="flex-1 bg-yellow-100 text-yellow-700 text-sm font-medium py-2 rounded-xl hover:bg-yellow-200 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDuplicate(deck.id)}
          className="px-3 bg-gray-100 text-gray-500 text-sm font-medium py-2 rounded-xl hover:bg-gray-200 transition"
          title="Duplicate deck"
        >
          ⧉
        </button>
      </div>
    </div>
  );
}

export default function Desktop() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDecks();
      setDecks(data);
    } catch (err) {
      setError("Could not load decks. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(deckId) {
    try {
      await duplicateDeck(deckId);
      await fetchDecks(); // refresh list
    } catch (err) {
      alert("Failed to duplicate deck.");
    }
  }

  const filtered = decks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / DECKS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * DECKS_PER_PAGE;
  const currentDecks = filtered.slice(start, start + DECKS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER */}
      <div className="w-full h-16 shadow-sm flex items-center justify-between px-8 sticky top-0 bg-white z-10">
        <h1 className="text-xl font-bold tracking-tight">StudyStrike</h1>
        <div className="flex gap-8 text-sm text-gray-600">
          <span className="font-semibold text-gray-900 underline underline-offset-4">Home</span>
          <Link to="/study/0" className="hover:text-gray-900 transition">Study</Link>
          <Link to="/create-deck" className="hover:text-gray-900 transition">Create</Link>
        </div>
        <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
          U
        </div>
      </div>

      {/* HERO */}
      <div className="bg-purple-500 text-white px-16 py-16">
        <h2 className="text-4xl font-bold">Your decks</h2>
        <p className="mt-3 text-lg opacity-80 max-w-xl">
          Create personalized flashcard decks and study efficiently.
        </p>
        <button
          onClick={() => navigate("/create-deck")}
          className="mt-6 bg-white text-purple-600 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition text-sm"
        >
          + New Deck
        </button>
      </div>

      {/* CONTENT */}
      <div className="px-16 py-10 flex flex-col gap-8 flex-1">
        {/* SEARCH */}
        <div className="max-w-md border rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
          <span className="text-gray-400 text-lg">🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search decks..."
            className="w-full outline-none text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        {/* STATES */}
        {loading && (
          <div className="flex justify-center items-center py-20 text-gray-400">
            Loading decks...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-6 py-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-4">
            <p className="text-lg">{search ? "No decks match your search." : "No decks yet."}</p>
            {!search && (
              <button
                onClick={() => navigate("/create-deck")}
                className="bg-purple-500 text-white px-6 py-3 rounded-xl text-sm hover:bg-purple-600 transition"
              >
                Create your first deck
              </button>
            )}
          </div>
        )}

        {/* GRID */}
        {!loading && !error && currentDecks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} onDuplicate={handleDuplicate} />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 text-sm mt-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              className="px-3 py-2 rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition"
            >
              ‹
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg transition ${
                  safePage === i + 1
                    ? "bg-purple-500 text-white font-bold"
                    : "hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              className="px-3 py-2 rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
