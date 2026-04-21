import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";
import QuizSetupModal from "./QuizSetupModal.jsx";
import { importCardsFromCSV } from "../../lib/CSV_Import.js";
const DECKS_PER_PAGE = 6;
function DeckCard({ deck, onDelete, onDuplicate, onExport, onQuiz, onShare}){
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between h-[220px] hover:shadow-lg transition">
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{deck.title}</h3>
          <Link
            to={`/leaderboard/${deck.id}`}
            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-200 transition font-medium"
          >
            Strikers
          </Link>
        </div>
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
        <button
        onClick={() => onQuiz(deck.id)}
        className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition"
        >
        Quiz
        </button>
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
          onClick={() => onShare(deck.id)}
          className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
        >
          Share
        </button>
        <button
          onClick={() => onDelete(deck.id)}
          className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition"
        >
          Delete
        </button>
        <Link
        to={`/leaderboard/${deck.id}`}
        className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-lg hover:bg-pink-200 transition"
        >
        Leaderboard
      </Link>
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
      if (res.ok) {
        // Server returns CSV directly
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deck_${deckId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to export deck');
      }
    } catch {
      alert('Network error during export');
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const title = file.name.replace(/\.[^/.]+$/, "").replace(/_StudyStrike$/, "").replace(/_/g, " ");

        const res = await fetch("/api/decks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, title, description: "Imported from CSV" }),
        });
        
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to create deck for import');
          return;
        }

        const newDeckId = data.id;
        const importResult = await importCardsFromCSV(file, newDeckId);

        if (importResult.success) {
          fetchDecks(); // Refresh
          alert('Deck imported successfully');
        } else {
          fetchDecks(); // Refresh anyway
          alert(importResult.error || 'Failed to import cards from CSV');
        }
      } catch {
        alert('Error parsing or importing CSV file');
      }
    };
    input.click();
  }

  // New deck modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit deck modal state
  const [editingDeck, setEditingDeck] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [quizModal, setQuizModal] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [quizCount, setQuizCount] = useState(20);
  const [shareModal, setShareModal] = useState(null);
  const [shareCode, setShareCode] = useState("");
  const [shareExpires, setShareExpires] = useState("");
  const [joinModal, setJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    setLoading(true);
    try {
      const res = await fetch("/api/decks", {credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        // Show all decks (owned + shared via invite)
        setDecks(data);
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
    const deckToDelete = decks.find(d => d.id === deckId);
    const isOwner = deckToDelete && deckToDelete.user_id === user?.id;
    
    // differentiate owner and shared access user deletion actions
    // owner deletes: hard removal from all users
    // guest delete: only removes their own personal access/visibility
    const confirmMsg = isOwner 
      ? "Delete this deck and all its cards? This will remove it for everyone."
      : "Remove your access to this deck?";
      
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
        credentials: "include"
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isOwner) {
          // Owner deleted the deck - remove from list
          setDecks(decks.filter(d => d.id !== deckId));
        } else {
          // Non-owner removed their access - remove from list
          setDecks(decks.filter(d => d.id !== deckId));
        }
        alert(data.message || "Success");
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Network error");
    }
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
  // front end implementation of a share button
  async function handleShare(deckId) {
    try {
      const res = await fetch(`/api/decks/${deckId}/invite`, {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (res.ok) {
        setShareModal(deckId);
        setShareCode(data.invite_code);
        setShareExpires(data.invite_expires_at);
      } else {
        alert(data.error || "Failed to generate invite code");
      }
    } catch {
      alert("Network error");
    }
  }
  async function handleJoinDeck() {
    if (!inviteCode.trim()) {
      alert("Please enter an invite code");
      return;
    }
    try {
      const res = await fetch("/api/decks/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: inviteCode.toUpperCase() })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Successfully joined deck!");
        setJoinModal(false);
        setInviteCode("");
        fetchDecks(); // Refresh deck list
      } else {
        alert(data.error || "Failed to join deck");
      }
    } catch {
      alert("Network error");
    }
  }
  function handleQuiz(deckId) {
  setQuizMode(null);
  setQuizModal(deckId);
}
async function handleGenerateQuiz(mode, count) {
  const deckId =quizModal;
  try {
    //here i did the manuall quiz build part
    if (mode=== 'manual') {
      //sends post req to craete the quiz
      const resObj = await fetch('/api/quizzes', {
        method:'POST',
        headers: {'Content-Type': 'application/json' },
        credentials:'include',
        body: JSON.stringify({
        deck_id:deckId,
        title:'Custom Quiz'}),
      });
      //gets the data back form the api
      const datBuff= await resObj.json();
      if (resObj.ok) {
        setQuizModal(null);
        //takes u to the quiz bulider page
        navigate(`/quiz-builder/${datBuff.id}/${quizModal}`);}
      return;
    }
    //hits the generate quiz endpint with the deck id
    const resObj = await fetch(`/api/decks/${deckId}/generate-quiz`, {
      method:'POST',
      headers: {'Content-Type':'application/json' },
      credentials: 'include',
      body: JSON.stringify({mode, count }),
    });
    //grabs raw text then parses it
    const rawTxt =await resObj.text();
    const datBuff= JSON.parse(rawTxt);
    if (resObj.ok) {
      setQuizModal(null);
      //sends to the quiz page
      navigate(`/quiz/${datBuff.id}`);
    }
  }catch(err) {}}
  function openEditModal(deck) {
    setEditingDeck(deck);
    setEditTitle(deck.title);
    setEditDesc(deck.description|| "");
  }

  async function handleEditSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/decks/${editingDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDesc }),
      });
      const updated = await res.json();
      if (res.ok) {
        setDecks(decks.map((d) => (d.id === editingDeck.id ? updated : d)));
        setEditingDeck(null);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
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
          <button
            onClick={() => setJoinModal(true)}
            className="bg-white/90 text-[#9D6381] font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            Join Deck
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
                onQuiz={handleQuiz}
                onShare={handleShare}
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
      {/* EDIT DECK MODAL */}
      {editingDeck && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Rename Deck</h3>
            <input
              placeholder="Deck title *"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
              className="w-full border rounded-xl px-4 py-3 mb-3 text-sm outline-none focus:border-[#9D6381]"
            />
            <textarea
              placeholder="Description (optional)"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full border rounded-xl px-4 py-3 mb-4 text-sm outline-none focus:border-[#9D6381] resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleEditSave}
                disabled={saving || !editTitle.trim()}
                className="flex-1 bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#8a5270] transition"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => setEditingDeck(null)}
                className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    {quizModal &&(
    <QuizSetupModal
      deckId={quizModal}
      onClose={() =>setQuizModal(null)}
      // share page below to show 6 char alphanumeric code for TEACHERS role to use only
      // as well as JOIN page for invite codes for all roles
      onStart={(mode, count) =>handleGenerateQuiz(mode, count)}/>)}
    {joinModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Join Deck</h3>
          <p className="text-gray-600 mb-4">Enter the 6-character invite code to join a shared deck:</p>
          <input
            type="text"
            placeholder="Enter invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-4 text-sm outline-none focus:border-[#9D6381]"
            maxLength={6}
          />
          <div className="flex gap-3">
            <button
              onClick={handleJoinDeck}
              className="flex-1 bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#8a5270] transition"
            >
              Join Deck
            </button>
            <button
              onClick={() => setJoinModal(false)}
              className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    {shareModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Share Deck</h3>
          <p className="text-gray-600 mb-4">Share this deck with students using the invite code below:</p>
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-1">Invite Code</p>
            <p className="text-2xl font-mono font-bold text-[#9D6381]">{shareCode}</p>
            <p className="text-xs text-gray-400 mt-2">Expires: {new Date(shareExpires).toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareCode);
                alert("Code copied to clipboard!");
                setShareModal(null);
              }}
              className="flex-1 bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#8a5270] transition"
            >
              Copy Code
            </button>
            <button
              onClick={() => setShareModal(null)}
              className="flex-1 border py-3 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
