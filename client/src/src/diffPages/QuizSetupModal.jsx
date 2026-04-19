import { useState } from "react";
export default function QuizSetupModal({ deckId, onClose, onStart }) {
  const [quizMode, setQuizMode]= useState(null);
  const [quizCount, setQuizCount] = useState(20);
  function toggleMode(m) {
    //toggles the quiz mode on or off
    setQuizMode(prev => {
      if (prev=== m) return null;
      return m;
    });
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-md flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Quiz</p>
          <h2 className="text-2xl font-semibold text-gray-900">Set up your quiz</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <hr className="border-gray-100" />
        <div className="flex items-center justify-between">
          <span className="text-gray-800 font-medium">Questions</span>
          <input
            type="number"
            min={1}
            value={quizCount}
            onChange={e =>setQuizCount(Number(e.target.value))}
            className="w-20 text-center border border-gray-200 rounded-xl py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#9D6381]"
          />
        </div>
        <hr className="border-gray-100" />
        <div className="flex items-center justify-between">
        <span className="text-gray-800 font-medium">True / False</span>
          {(() => {
            let trueFalseCls ="bg-gray-300";
            if (quizMode ==='tf') trueFalseCls= "bg-[#9D6381]";
            let trueFalseSlide ="translate-x-0.5";
            if (quizMode  === 'tf') trueFalseSlide = "translate-x-6";
            return (
              <button
                onClick={() => toggleMode('tf')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${trueFalseCls}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${trueFalseSlide}`} />
              </button>
            );
          })()}
        </div>
        <div className="flex items-center justify-between">
        <span className="text-gray-800 font-medium">Multiple choice</span>
          {(() => {
            let multChoiceCls = "bg-gray-300";
            if (quizMode  === 'mc') multChoiceCls ="bg-[#9D6381]";
            let multChoiceSlide= "translate-x-0.5";
            if (quizMode ==='mc') multChoiceSlide = "translate-x-6";
            return (
              <button
              onClick={() => toggleMode('mc')}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${multChoiceCls}`}
              >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${multChoiceSlide}`} />
              </button>
            );
          })()}
        </div>
        {(() => {
          let startBtnFn = () => {};
          if (quizMode) startBtnFn = () => onStart(quizMode, quizCount);
          return (
            <button
            onClick={startBtnFn}
            disabled={!quizMode}
            className="bg-[#9D6381] text-white py-3 rounded-xl hover:bg-[#8a5270] transition disabled:opacity-40 disabled:cursor-not-allowed font-semibold mt-2"
            >
            Start quiz
            </button>
          );
        })()}
        <button
        onClick={() =>onStart('manual', quizCount)}
        className="border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition font-semibold mt-2"
        >
        Create manually
        </button>
      </div>
    </div>
  );
}