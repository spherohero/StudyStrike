import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCards, createCard, updateCard, deleteCard, getDecks } from "./api";

export default function Create_Edit_Card() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
  }, [deckId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [cardsData, decksData] = await Promise.all([
        getCards(deckId),
        getDecks(),
      ]);
      setCards(cardsData);
      const found = decksData.find((d) => String(d.id) === String(deckId));
      setDeck(found || null);
    } catch (err) {
      setError("Could not load cards. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave() {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateCard(editingId, front.trim(), back.trim());
        setCards(cards.map((c) => (c.id === editingId ? updated : c)));
        showToast("Card updated!");
      } else {
        const created = await createCard(deckId, front.trim(), back.trim());
        setCards([...cards, created]);
        showToast("Card added!");
      }
      setFront("");
      setBack("");
      setEditingId(null);
    } catch (err) {
      showToast("Failed to save card.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this card?")) return;
    try {
      await deleteCard(id);
      setCards(cards.filter((c) => c.id !== id));
      if (editingId === id) {
        setFront("");
        setBack("");
        setEditingId(null);
      }
      showToast("Card deleted.");
    } catch (err) {
      showToast("Failed to delete card.", "error");
    }
  }

  function handleEdit(card) {
    setFront(card.front);
    setBack(card.back);
    setEditingId(card.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setFront("");
    setBack("");
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight">StudyStrike</h1>
        <div className="flex gap-8 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <Link to={`/study/${deckId}`} className="hover:text-gray-900 transition">Study</Link>
          <span className="font-semibold text-gray-900 underline underline-offset-4">Edit</span>
        </div>
        <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
          U
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
        {/* PAGE TITLE */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {deck ? deck.title : "Edit Deck"}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {cards.length} card{cards.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => navigate(`/study/${deckId}`)}
            className="bg-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-600 transition"
          >
            Study →
          </button>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            {editingId ? "Edit Card" : "Add New Card"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Term / Front</label>
              <textarea
                className="border border-gray-200 p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 transition text-sm min-h-[100px]"
                placeholder="e.g. Mitochondria"
                value={front}
                onChange={(e) => setFront(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Definition / Back</label>
              <textarea
                className="border border-gray-200 p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 transition text-sm min-h-[100px]"
                placeholder="e.g. Powerhouse of the cell"
                value={back}
                onChange={(e) => setBack(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !front.trim() || !back.trim()}
              className="bg-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving..." : editingId ? "Update Card" : "Add Card"}
            </button>
            {(editingId || front || back) && (
              <button
                onClick={handleCancel}
                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* CARD LIST */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading cards...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-6 py-4 text-sm">
            {error}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No cards yet — add your first one above!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
              Cards ({cards.length})
            </h2>
            {cards.map((card, i) => (
              <div
                key={card.id}
                className={`bg-white rounded-xl border p-5 flex justify-between items-start gap-4 transition-all duration-150 ${
                  editingId === card.id
                    ? "border-purple-300 shadow-md"
                    : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex gap-4 items-start flex-1 min-w-0">
                  <span className="text-xs text-gray-300 font-medium mt-0.5 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Front</p>
                      <p className="font-semibold text-gray-800 text-sm break-words">{card.front}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Back</p>
                      <p className="text-gray-600 text-sm break-words">{card.back}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(card)}
                    className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-yellow-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
