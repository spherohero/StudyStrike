import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
export default function QuizBuilder(){
  const { quizId, deckId } = useParams();
  const navigate= useNavigate();
  const [cards, setCards]= useState([]);
  const [step, setStep] = useState(1);
  const [selectedCards, setSelectedCards]= useState([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [options, setOptions]= useState(["", "", ""]);
  const [savedOpts, setSavedOpts] = useState({});
  useEffect(() => {
    async function fetchCards(){
      //grabs cards for this deck
      const resObj = await fetch(`/api/decks/${deckId}/cards`);
      const datBuff= await resObj.json();
      setCards(datBuff);
    }
    fetchCards();
  }, [deckId]);
  function goToCard(index){
    //restores saved options wen going back
    setCurrIdx(index);
    let prevOpts = savedOpts[index];
    if (!prevOpts) prevOpts = ["", "", ""];
    setOptions(prevOpts);
  }
  if (step ===1) {
    return(
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-xl font-medium mb-1">Select cards for your quiz</h1>
        <p className="text-sm text-gray-400 mb-5">{selectedCards.length} selected</p>
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
          {cards.map((card) => {
            const isSlct = selectedCards.find(c => c.id === card.id);
            let rowCls = "hover:bg-gray-50";
            if (isSlct) rowCls= "bg-[#f9f0f5]";
            let chkCls ="border-gray-300";
            if (isSlct) chkCls = "bg-[#9D6381] border-[#9D6381]";
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (isSlct) {
                    setSelectedCards(prev => prev.filter(c => c.id !== card.id));
                  } else {
                    setSelectedCards(prev => [...prev, card]);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-0 transition-colors ${rowCls}`}
                >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${chkCls}`}>
                  {isSlct && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>)}
                </div>
                <span className="text-sm">{card.front}</span>
              </div>);
          })}
        </div>
        {(() => {
          let pluralTxt = "s";
          if (selectedCards.length === 1) pluralTxt = "";
          return (
            <button
              onClick={() => setStep(2)}
              disabled={selectedCards.length === 0}
              className="w-full bg-[#9D6381] disabled:opacity-40 text-white py-3 rounded-xl text-sm font-medium"
            >
            Continue with {selectedCards.length} card{pluralTxt} →
            </button>
          );
        })()}
      </div>
    );
  }
  if (step === 3) {
    let pluralTxt = "s";
    if (selectedCards.length === 1) pluralTxt = "";
    return (
      <div className="max-w-sm mx-auto p-8 text-center mt-16">
        <div className="w-12 h-12 rounded-full bg-[#f9f0f5] flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11l5 5L18 6" stroke="#9D6381" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-medium mb-2">Quiz ready!</h1>
        <p className="text-sm text-gray-400 mb-8">
          {selectedCards.length} question{pluralTxt} added successfully
        </p>
        <div className="flex flex-col gap-3">
          <button
          onClick={() => navigate(`/quiz/${quizId}`)}
          className="w-full bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium"
          >
          Take the quiz →
          </button>
          <button
            onClick={() => navigate(`/dashboard`)}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm"
          >
          Back to deck
          </button>
        </div>
      </div>
    );
  }
  const currCard= selectedCards[currIdx];
  const progPct = ((currIdx + 1) / selectedCards.length) * 100;
  const isLast= currIdx === selectedCards.length - 1;
  async function handleAdd() {
    //saves options for this card incase they come bak
    setSavedOpts(prev => ({ ...prev, [currIdx]: options }));
    await fetch(`/api/quizzes/${quizId}/questions`, {
      method:"POST",
      headers: { "Content-Type":"application/json" },
      credentials:"include",
      body: JSON.stringify({
        question: currCard.front,
        option_a: currCard.back,
        option_b: options[0],
        option_c: options[1],
        option_d: options[2],
        correct_option:"A",}),
    });
    //goes to next card or finishes
    if (!isLast) {
      goToCard(currIdx + 1);
    } else {
      setStep(3);}
  }
  return (
    <div className="max-w-lg mx-auto p-8">
      <div className="h-1 bg-gray-100 rounded-full mb-5">
        <div
        className="h-1 bg-[#9D6381] rounded-full transition-all duration-300"
        style={{ width: `${progPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mb-5">
        {(() => {
          let backTxt = "Previous";
          if (currIdx === 0) backTxt = "Back to cards";
          let backFn = () => goToCard(currIdx - 1);
          if (currIdx === 0) backFn = () => setStep(1);
          return (
            <button
              onClick={backFn}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {backTxt}
            </button>
          );
        })()}
        <p className="text-sm text-gray-400">
          <span className="font-medium text-gray-700">{currIdx + 1}</span> / {selectedCards.length}
        </p>
      </div>
      <div className="border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">Question</p>
        <p className="text-sm text-gray-800">{currCard.front}</p>
        <hr className="my-3 border-gray-100" />
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1">
          Correct answer{" "}
          <span className="normal-case bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px]">
            auto-filled
          </span>
        </p>
        <p className="text-sm text-gray-800">{currCard.back}</p>
      </div>
      <div className="border border-gray-200 rounded-xl p-4 mb-5">
        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-3">Wrong answers</p>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <input
              type="text"
              placeholder={`Wrong option ${i + 1}`}
              value={options[i]}
              onChange={(e) => {
                const nxtOpts = [...options];
                nxtOpts[i] = e.target.value;
                setOptions(nxtOpts);}}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#9D6381] focus:ring-1 focus:ring-[#9D6381]/20"
            />
          </div>
        ))}
      </div>
      {(() => {
        let btnTxt= "Add & continue →";
        if (isLast) btnTxt ="Finish quiz";
        return (
          <button
          onClick={handleAdd}
          className="w-full bg-[#9D6381] text-white py-3 rounded-xl text-sm font-medium"
          >
          {btnTxt}
          </button>
        );
      })()}
    </div>
  );
}