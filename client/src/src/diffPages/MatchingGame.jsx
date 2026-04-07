import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";

function Card({ card, isFlipped, isMatched, onClick }) {
  return (
    <div
      className={`w-24 h-24 bg-white border-2 rounded-lg cursor-pointer flex items-center justify-center text-sm font-medium transition-all duration-300 ${
        isFlipped || isMatched ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
      } ${isMatched ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      {isFlipped || isMatched ? (
        <div className="text-center p-1">
          {card.side === 'front' ? card.content : card.back}
        </div>
      ) : (
        '?'
      )}
    </div>
  );
}

export default function MatchingGame() {
  const { deckId } = useParams();
  const { user } = useContext(BackendAuthConnection);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    fetchCards();
  }, [deckId]);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await fetch(`/api/decks/${deckId}/cards`);
      const data = await res.json();
      if (res.ok) {
        // Create game cards: each flashcard becomes two cards (front and back)
        const gameCards = [];
        data.forEach((card, index) => {
          gameCards.push({
            id: `front-${index}`,
            content: card.front,
            back: card.back,
            side: 'front',
            pairId: index
          });
          gameCards.push({
            id: `back-${index}`,
            content: card.back,
            back: card.front,
            side: 'back',
            pairId: index
          });
        });
        // Shuffle the cards
        const shuffled = gameCards.sort(() => Math.random() - 0.5);
        setCards(shuffled);
      } else {
        setError(data.error || "Failed to load cards");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function startGame() {
    setGameStarted(true);
    setStartTime(Date.now());
    setMoves(0);
    setMatchedPairs(new Set());
    setFlippedCards([]);
    setEndTime(null);
  }

  function handleCardClick(cardId) {
    if (!gameStarted) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (flippedCards.includes(cardId) || matchedPairs.has(card.pairId) || flippedCards.length >= 2) {
      return;
    }

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        setMatchedPairs((prev) => {
          const next = new Set(prev);
          next.add(firstCard.pairId);
          if (next.size === cards.length / 2) {
            setEndTime(Date.now());
          }
          return next;
        });
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  }

  function resetGame() {
    setGameStarted(false);
    setFlippedCards([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setStartTime(null);
    setEndTime(null);
    // Reshuffle
    fetchCards();
  }

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><p>Loading game...</p></div>;
  if (error) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-red-500">{error}</p></div>;
  if (cards.length === 0) return <div className="min-h-screen bg-white flex items-center justify-center"><p>No cards in this deck</p></div>;

  const gameComplete = matchedPairs.size === cards.length / 2;
  const timeElapsed = startTime && (endTime || Date.now()) - startTime;
  const timeString = timeElapsed ? `${Math.floor(timeElapsed / 1000)}s` : '';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar activePage="dashboard" />

      <div className="px-16 py-10 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Flashcard Matching Game</h1>
          <p className="text-gray-600">Find matching pairs of front and back cards</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="text-lg">Moves: {moves}</div>
          {timeString && <div className="text-lg">Time: {timeString}</div>}
          {gameComplete && <div className="text-lg font-bold text-green-600">Complete!</div>}
        </div>

        {!gameStarted ? (
          <button
            onClick={startGame}
            className="bg-[#9D6381] text-white px-6 py-3 rounded-xl hover:bg-[#8a5270] transition"
          >
            Start Game
          </button>
        ) : (
          <button
            onClick={resetGame}
            className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition"
          >
            Reset Game
          </button>
        )}

        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              isFlipped={flippedCards.includes(card.id)}
              isMatched={matchedPairs.has(card.pairId)}
              onClick={() => handleCardClick(card.id)}
            />
          ))}
        </div>

        <Link
          to={`/study/${deckId}`}
          className="text-[#9D6381] hover:underline"
        >
          Back to Study Mode
        </Link>
      </div>
    </div>
  );
}
