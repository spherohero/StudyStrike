import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCards, getDecks } from "./api";

export default function StudyPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
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
    load();
  }, [deckId]);

  // Reset flip when navigating cards
  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (cards.length > 0 ? (prev + 1) % cards.length : 0));
    }, 150);
  };

  const prevCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setIndex((prev) =>
        cards.length > 0 ? (prev === 0 ? cards.length - 1 : prev - 1) : 0
      );
    }, 150);
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cards]);

  const card = cards[index];

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* HEADER */}
      <div className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-tight">StudyStrike</h1>
        <div className="flex gap-8 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900 transition">Home</Link>
          <span className="font-semibold text-gray-900 underline underline-offset-4">Study</span>
          <Link to="/create-deck" className="hover:text-gray-900 transition">Create</Link>
        </div>
        <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
          U
        </div>
      </div>

      {/* DECK TITLE */}
      <div className="px-16 pt-10 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {deck ? deck.title : deckId === "0" ? "Select a Deck" : "Loading..."}
          </h2>
          {deck?.description && (
            <p className="text-gray-400 text-sm mt-1">{deck.description}</p>
          )}
        </div>
        {deck && (
          <button
            onClick={() => navigate(`/decks/${deckId}/edit`)}
            className="bg-yellow-400 text-yellow-900 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-yellow-500 transition"
          >
            Edit Deck
          </button>
        )}
      </div>

      {/* STATES */}
      {loading && (
        <div className="flex justify-center items-center py-24 text-gray-400">Loading cards...</div>
      )}

      {error && (
        <div className="mx-16 mt-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-6 py-4 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && cards.length === 0 && (
        <div className="flex flex-col items-center py-24 gap-4 text-gray-400">
          <p className="text-lg">No cards in this deck yet.</p>
          <button
            onClick={() => navigate(`/decks/${deckId}/edit`)}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl text-sm hover:bg-purple-600 transition"
          >
            Add Cards
          </button>
        </div>
      )}

      {/* FLASHCARD */}
      {!loading && !error && cards.length > 0 && (
        <div className="flex flex-col items-center gap-6 mt-6">
          {/* Progress bar */}
          <div className="w-[656px] bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Card */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="w-[656px] h-[406px] cursor-pointer select-none"
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
                className="absolute w-full h-full bg-white shadow-xl rounded-2xl flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium">Term</span>
                <h3 className="text-2xl text-center text-gray-800 font-medium leading-relaxed">
                  {card?.front}
                </h3>
              </div>

              {/* BACK */}
              <div
                className="absolute w-full h-full bg-purple-500 shadow-xl rounded-2xl flex flex-col items-center justify-center p-8"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <span className="text-xs text-purple-200 uppercase tracking-widest mb-4 font-medium">Definition</span>
                <h3 className="text-2xl text-center text-white font-medium leading-relaxed">
                  {card?.back}
                </h3>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 tracking-wide">
            Click to flip · ← → to navigate · Space to flip
          </p>

          {/* NAVIGATION */}
          <div className="flex gap-6 items-center">
            <button
              onClick={prevCard}
              className="w-11 h-11 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-500 transition text-lg"
            >
              ‹
            </button>
            <span className="text-sm text-gray-500 w-20 text-center font-medium">
              {index + 1} / {cards.length}
            </span>
            <button
              onClick={nextCard}
              className="w-11 h-11 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-400 hover:text-purple-500 transition text-lg"
            >
              ›
            </button>
          </div>

          {/* RESTART */}
          <button
            onClick={() => { setIndex(0); setFlipped(false); }}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            ↺ Restart
          </button>
        </div>
      )}

      {/* CARD LIST */}
      {!loading && !error && cards.length > 0 && (
        <div className="flex flex-col items-center mt-12 gap-3 px-16">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest self-start max-w-4xl w-full">
            All Cards ({cards.length})
          </h3>
          {cards.map((c, i) => (
            <div
              key={c.id}
              onClick={() => { setIndex(i); setFlipped(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`w-full max-w-4xl p-5 rounded-xl flex justify-between items-center cursor-pointer transition-all duration-150 border ${
                i === index
                  ? "border-purple-300 bg-purple-50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
              }`}
            >
              <div className="flex gap-8 items-center flex-1 min-w-0">
                <span className="text-xs text-gray-400 font-medium w-6 shrink-0">{i + 1}</span>
                <span className="font-semibold text-gray-800 w-1/2 truncate">{c.front}</span>
                <span className="text-gray-400 text-sm">→</span>
                <span className="text-gray-600 text-sm flex-1 truncate">{c.back}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
