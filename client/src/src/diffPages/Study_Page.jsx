import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function StudyPage() {
  const [flipped, setFlipped] = useState(false);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);

  // Fetch from Supabase
  async function fetchCards() {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.log("Using fallback data");

      // fallback (your original)
      setCards([
        {
          question: "What is the powerhouse of the cell?",
          answer: "Mitochondria",
        },
        {
          question: "What is DNA?",
          answer: "Deoxyribonucleic acid",
        },
      ]);
    } else {
      setCards(data);
    }
  }

  useEffect(() => {
    fetchCards();
  }, []);

  // Navigation
  const nextCard = () => {
    setFlipped(false);
    setIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setIndex((prev) =>
      prev === 0 ? cards.length - 1 : prev - 1
    );
  };

  // Delete (optional but useful)
  async function handleDelete(id) {
    await supabase.from("cards").delete().eq("id", id);
    fetchCards();

    // prevent index overflow
    setIndex(0);
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">

      {/* HEADER */}
      <div className="w-full h-16 shadow-md flex items-center justify-between px-6">
        <h1 className="text-xl font-bold">StudyStrike</h1>

        <div className="flex gap-10 text-sm">
          <span className="underline">Home</span>
          <span>Study</span>
          <span>Quiz</span>
          <span>Leaderboard</span>
        </div>

        <div className="w-10 h-10 bg-purple-400 rounded-full"></div>
      </div>

      {/* TITLE */}
      <div className="px-16 py-10">
        <h2 className="text-3xl font-bold">Deck Title</h2>
      </div>

      {/* FLASHCARD */}
      <div className="flex flex-col items-center gap-6">

        <div
          onClick={() => setFlipped(!flipped)}
          className="w-[656px] h-[406px] perspective cursor-pointer"
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 ${
              flipped ? "rotate-y-180" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT */}
            <div className="absolute w-full h-full bg-white shadow-lg rounded-2xl flex items-center justify-center p-6 backface-hidden">
              <h3 className="text-xl text-center">
                {cards[index]?.question || "Loading..."}
              </h3>
            </div>

            {/* BACK */}
            <div className="absolute w-full h-full bg-purple-100 shadow-lg rounded-2xl flex items-center justify-center p-6 rotate-y-180 backface-hidden">
              <h3 className="text-xl text-center">
                {cards[index]?.answer || "Loading..."}
              </h3>
            </div>
          </div>
        </div>

        <p className="text-sm">Click to flip</p>

        {/* NAV */}
        <div className="flex gap-4 items-center">
          <button onClick={prevCard}>{"<"}</button>
          <span>
            {cards.length > 0 ? index + 1 : 0} / {cards.length}
          </span>
          <button onClick={nextCard}>{">"}</button>
        </div>

        {/* BUTTON */}
        <button className="bg-purple-400 text-white px-6 py-3 rounded-xl">
          Quiz Mode
        </button>
      </div>

      {/* LIST (NOW LIVE FROM SUPABASE) */}
      <div className="flex flex-col items-center mt-10 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="w-[980px] p-6 shadow-md rounded-xl flex justify-between items-center"
          >
            <div>
              <span className="font-bold">{card.question}</span>
              <p>{card.answer}</p>
            </div>

            {/* DELETE BUTTON */}
            <button
              onClick={() => handleDelete(card.id)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
