import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";

export default function Create_Edit_Card() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(BackendAuthConnection);

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(!!deckId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (deckId) {
      loadDeckAndCards();
    }
  }, [deckId]);

  async function loadDeckAndCards() {
    setLoading(true);
    try {
      const [deckRes, cardsRes] = await Promise.all([
        fetch("/api/decks"),
        fetch(`/api/decks/${deckId}/cards`),
      ]);
      const allDecks = await deckRes.json();
      const cardsData = await cardsRes.json();

      const found = allDecks.find((d) => d.id === parseInt(deckId));
      if (found) setDeck(found);
      if (Array.isArray(cardsData)) setCards(cardsData);
    } catch {
      setError("Failed to load deck data");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!question.trim() || !answer.trim()) return;
    if (!deckId) {
      setError("No deck selected. Go to Dashboard and create a deck first.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        // Update existing card
        const res = await fetch(`/api/cards/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: question, back: answer }),
        });
        const updated = await res.json();
        if (res.ok) {
          setCards(cards.map((c) => (c.id === editingId ? updated : c)));
        } else {
          setError(updated.error || "Failed to update card");
        }
      } else {
        // Create new card
        const res = await fetch(`/api/decks/${deckId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: question, back: answer }),
        });
        const newCard = await res.json();
        if (res.ok) {
          setCards([...cards, newCard]);
        } else {
          setError(newCard.error || "Failed to create card");
        }
      }
      setQuestion("");
      setAnswer("");
      setEditingId(null);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCards(cards.filter((c) => c.id !== id));
        if (editingId === id) {
          setEditingId(null);
          setQuestion("");
          setAnswer("");
        }
      }
    } catch {
      setError("Failed to delete card");
    }
  }

  function handleEdit(card) {
    setQuestion(card.front);
    setAnswer(card.back);
    setEditingId(card.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setQuestion("");
    setAnswer("");
    setEditingId(null);
    setError("");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar activePage="create" />
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">Loading deck…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar activePage="create" />

      <div className="flex flex-col items-center w-full px-10 py-10">
        {/* HEADER */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {deck ? deck.title : "Create / Edit a Deck"}
            </h1>
            {deck?.description && (
              <p className="text-gray-400 text-sm mt-1">{deck.description}</p>
            )}
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>

        {!deckId && (
          <div className="w-full max-w-3xl bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-5 py-4 mb-6 text-sm">
            No deck selected. <button onClick={() => navigate("/dashboard")} className="underline">Go to Dashboard</button> and create or open a deck first.
          </div>
        )}

        {/* FORM */}
        <div className="w-full max-w-3xl flex flex-col gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <textarea
              className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#9D6381] resize-none"
              placeholder="Term / Question"
              value={question}
              maxLength={300}
              rows={2}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <span className={`text-xs self-end ${question.length >= 280 ? "text-red-400" : "text-gray-300"}`}>
              {question.length}/300
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <textarea
              className="border rounded-xl px-4 py-3 text-sm outline-none focus:border-[#9D6381] resize-none"
              placeholder="Definition / Answer"
              value={answer}
              maxLength={300}
              rows={2}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
            <span className={`text-xs self-end ${answer.length >= 280 ? "text-red-400" : "text-gray-300"}`}>
              {answer.length}/300
            </span>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !question.trim() || !answer.trim()}
              className="bg-[#9D6381] text-white px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#8a5270] transition"
            >
              {saving ? "Saving…" : editingId ? "Update Card" : "Add Card"}
            </button>
            <button
              onClick={handleCancel}
              className="bg-[#FFD671] px-6 py-3 rounded-xl text-sm font-medium hover:opacity-80 transition"
            >
              Cancel
            </button>
            {cards.length > 0 && (
              <button
                onClick={() => navigate(`/study/${deckId}`)}
                className="ml-auto bg-purple-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-purple-600 transition"
              >
                Study this deck →
              </button>
            )}
          </div>
        </div>

        {/* CARD LIST */}
        {cards.length === 0 && deckId && (
          <p className="text-gray-400 text-sm">No cards yet — add your first one above.</p>
        )}
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`flex justify-between items-center p-5 rounded-xl shadow-sm border transition ${
                editingId === card.id ? "border-[#9D6381] bg-purple-50" : "border-gray-100"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{card.front}</p>
                <p className="text-gray-500 text-sm truncate">{card.back}</p>
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button
                  onClick={() => handleEdit(card)}
                  className="bg-[#FFB703] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
