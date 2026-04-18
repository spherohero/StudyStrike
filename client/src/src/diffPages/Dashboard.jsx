import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";

const DECKS_PER_PAGE = 6;

function DeckCard({ deck, onDelete, onDuplicate, onExport }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between h-[220px] hover:shadow-lg transition">
      <div>
        <h3 className="text-lg font-semibold">{deck.title}</h3>
        {deck.description && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{deck.description}</p>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Created {new Date(deck.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mt-4">
        <Link
          to={`/study/${deck.id}`}
          className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 transition"
        >
          Study
        </Link>
        <Link
          to={`/game/${deck.id}`}
          className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-200 transition"
        >
          Play Game
        </Link>
        <Link
          to={`/create/${deck.id}`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition"
        >
          Edit
        </Link>
        <button
          onClick={() => onDuplicate(deck.id)}
          className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 transition"
        >
          Duplicate
        </button>
        <button
          onClick={() => onExport(deck.id)}
          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition"
        >
          Export
        </button>
        <button
          onClick={() => onDelete(deck.id)}
          className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(BackendAuthConnection);
  const navigate = useNavigate();

  const [decks, setDecks] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleExport(deckId) {
    try {
      const res = await fetch(`/api/decks/${deckId}/export`);
      const data = await res.json();
      if (res.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = (data.title || `deck_${deckId}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeTitle}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert(data.error || 'Failed to export deck');
      }
    } catch {
      alert('Network error during export');
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.title || !data.cards || !Array.isArray(data.cards)) {
          alert('Invalid deck file format');
          return;
        }
        const res = await fetch('/api/decks/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            title: data.title,
            description: data.description || '',
            cards: data.cards
          }),
        });
        const result = await res.json();
        if (res.ok) {
          fetchDecks(); // Refresh
          alert('Deck imported successfully');
        } else {
          alert(result.error || 'Failed to import deck');
        }
      } catch {
        alert('Error reading or parsing file');
      }
    };
    input.click();
  }

  // New deck modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    setLoading(true);
    try {
      const res = await fetch("/api/decks");
      const data = await res.json();
      if (res.ok) {
        // Filter to only show user's own decks
        const myDecks = data.filter((d) => d.user_id === user?.id);
        setDecks(myDecks);
      } else {
        setError(data.error || "Failed to load decks");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, title: newTitle, description: newDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        setDecks([data, ...decks]);
        setShowModal(false);
        setNewTitle("");
        setNewDesc("");
        // Go straight to editing the new deck
        navigate(`/create/${data.id}`);
      }
    } catch {
      // silently fail for now
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(deckId) {
    if (!confirm("Delete this deck and all its cards?")) return;
    // Optimistic remove for now. Add a backend delete route later if needed.
    setDecks(decks.filter((d) => d.id !== deckId));
  }

  async function handleDuplicate(deckId) {
    try {
      const res = await fetch(`/api/decks/${deckId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        fetchDecks(); // Refresh
      }
    } catch {
      // silently fail
    }
  }

  const filtered = decks.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / DECKS_PER_PAGE));
  const start = (page - 1) * DECKS_PER_PAGE;
  const currentDecks = filtered.slice(start, start + DECKS_PER_PAGE);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar activePage="dashboard" />

      {/* HERO */}
      <div className="bg-[#9D6381] text-white px-16 py-16">
        <h2 className="text-4xl font-bold">Your decks</h2>
        <p className="mt-3 text-lg opacity-90 max-w-xl">
          Create personalized flashcard decks and practice efficiently.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-[#9D6381] font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            + New Deck
          </button>
          <button
            onClick={handleImport}
            className="bg-white/90 text-[#9D6381] font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            Import Deck
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-16 py-10 flex flex-col gap-8">
        {/* SEARCH */}
        <div className="max-w-md border rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-gray-400">🔍</span>
          <input
            placeholder="Search decks..."
            className="w-full outline-none text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* STATES */}
        {loading && <p className="text-gray-400">Loading your decks…</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-2xl mb-2">No decks yet</p>
            <p className="text-sm">Click "+ New Deck" to get started</p>
          </div>
        )}

        {/* GRID */}
        {!loading && currentDecks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDecks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 text-lg mt-6">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="disabled:opacity-30">{"<"}</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={page === i + 1 ? "font-bold underline" : ""}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} className="disabled:opacity-30">{">"}</button>
          </div>
        )}
      </div>

      {/* NEW DECK MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">New Deck</h3>
            <input
              placeholder="Deck title *"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full border rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-[#9D6381]"
            />
            <textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full border rounded-xl px-4 py-3 mb-4 text-sm outline-none focus:border-[#9D6381] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#8a5270] transition"
              >
                {creating ? "Creating…" : "Create & Add Cards"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
