import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function Create_Edit_Card() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState(null);

  // 🔹 Fetch cards
  async function fetchCards() {
    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setCards(data);
  }

  useEffect(() => {
    fetchCards();
  }, []);

  // 🔹 Create or Update card
  async function handleSave() {
    if (!question || !answer) return;

    if (editingId) {
      // UPDATE
      await supabase
        .from("cards")
        .update({ question, answer })
        .eq("id", editingId);
    } else {
      // CREATE
      await supabase.from("cards").insert([{ question, answer }]);
    }

    setQuestion("");
    setAnswer("");
    setEditingId(null);
    fetchCards();
  }

  // 🔹 Delete
  async function handleDelete(id) {
    await supabase.from("cards").delete().eq("id", id);
    fetchCards();
  }

  // 🔹 Load into form for editing
  function handleEdit(card) {
    setQuestion(card.question);
    setAnswer(card.answer);
    setEditingId(card.id);
  }

  return (
    <div className="flex flex-col items-center w-full p-10">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">
        Create / edit a new deck
      </h1>

      {/* FORM */}
      <div className="w-full max-w-3xl flex flex-col gap-4 mb-10">

        <input
          className="border p-4 rounded-xl"
          placeholder="Term / Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <input
          className="border p-4 rounded-xl"
          placeholder="Definition / Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="bg-[#9D6381] text-white px-6 py-3 rounded-xl"
          >
            {editingId ? "Update Card" : "Save Card"}
          </button>

          <button
            onClick={() => {
              setQuestion("");
              setAnswer("");
              setEditingId(null);
            }}
            className="bg-[#FFD671] px-6 py-3 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* CARD LIST */}
      <div className="w-full max-w-3xl flex flex-col gap-6">

        {cards.map((card) => (
          <div
            key={card.id}
            className="flex justify-between items-center p-5 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            <div>
              <p className="font-bold">{card.question}</p>
              <p>{card.answer}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(card)}
                className="bg-[#FFB703] px-6 py-3 rounded-xl"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(card.id)}
                className="bg-[#EF4444] text-white px-6 py-3 rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
