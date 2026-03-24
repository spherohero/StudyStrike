import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function StudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (deckId) {
      loadDeckAndCards();
    } else {
      setLoading(false);
    }
  }, [deckId]);

  async function loadDeckAndCards() {
    setLoading(true);
    try {
      const [decksRes, cardsRes] = await Promise.all([
        fetch("/api/decks"),
        fetch(`/api/decks/${deckId}/cards`),
      ]);
      const allDecks = await decksRes.json();
      const cardsData = await cardsRes.json();

      const found = allDecks.find((d) => d.id === parseInt(deckId));
      if (found) setDeck(found);
      if (Array.isArray(cardsData)) setCards(cardsData);
    } catch {
      setError("Failed to load deck");
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setFlipped(false);
    setTimeout(() => setIndex((prev) => (prev + 1) % cards.length), 150);
  }

  function prevCard() {
    setFlipped(false);
    setTimeout(() => setIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1)), 150);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar activePage="study" />
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">Loading deck…</p>
        </div>
      </div>
    );
  }

  if (!deckId || error) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar activePage="study" />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <p className="text-gray-400 text-xl">{error || "No deck selected."}</p>
          <button onClick={() => navigate("/dashboard")} className="bg-[#9D6381] text-white px-6 py-3 rounded-xl text-sm">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar activePage="study" />
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center">
          <p className="text-gray-400 text-xl">This deck has no cards yet.</p>
          <button onClick={() => navigate(`/create/${deckId}`)} className="bg-[#9D6381] text-white px-6 py-3 rounded-xl text-sm">
            Add Cards
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      <Navbar activePage="study" />

      {/* DECK TITLE */}
      <div className="px-16 py-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{deck?.title || "Study"}</h2>
          {deck?.description && <p className="text-gray-400 text-sm mt-1">{deck.description}</p>}
        </div>
        <button
          onClick={() => navigate(`/create/${deckId}`)}
          className="text-sm text-gray-500 hover:underline"
        >
          Edit Deck
        </button>
      </div>

      {/* FLASHCARD */}
      <div className="flex flex-col items-center gap-6 px-4">

        {/* Card with flip */}
        <div
          onClick={() => setFlipped(!flipped)}
          className="w-full max-w-2xl h-[380px] cursor-pointer"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* FRONT */}
            <div
              className="absolute inset-0 bg-white shadow-xl rounded-2xl flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="text-xs uppercase tracking-widest text-gray-300 mb-4">Term</span>
              <h3 className="text-2xl text-center font-medium">{card.front}</h3>
            </div>

            {/* BACK */}
            <div
              className="absolute inset-0 bg-purple-50 shadow-xl rounded-2xl flex flex-col items-center justify-center p-8"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <span className="text-xs uppercase tracking-widest text-purple-300 mb-4">Definition</span>
              <h3 className="text-2xl text-center font-medium">{card.back}</h3>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-400">Click card to flip</p>

        {/* NAV */}
        <div className="flex gap-6 items-center">
          <button
            onClick={prevCard}
            className="w-10 h-10 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-xl"
          >
            ‹
          </button>
          <span className="text-sm text-gray-500 min-w-[60px] text-center">
            {index + 1} / {cards.length}
          </span>
          <button
            onClick={nextCard}
            className="w-10 h-10 rounded-full border flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-xl"
          >
            ›
          </button>
        </div>
      </div>

      {/* ALL CARDS LIST */}
      <div className="flex flex-col items-center mt-14 gap-3 px-4">
        <h3 className="text-lg font-semibold self-start max-w-2xl w-full mb-2">All cards in this deck</h3>
        {cards.map((c, i) => (
          <div
            key={c.id}
            onClick={() => { setIndex(i); setFlipped(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={`w-full max-w-2xl p-5 rounded-xl border flex justify-between items-center cursor-pointer transition hover:shadow-md ${
              i === index ? "border-[#9D6381] bg-purple-50" : "border-gray-100"
            }`}
          >
            <div>
              <p className="font-semibold text-sm">{c.front}</p>
              <p className="text-gray-500 text-sm">{c.back}</p>
            </div>
            {i === index && <span className="text-xs text-[#9D6381] font-medium">Current</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
