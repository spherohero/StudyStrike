import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";
import Navbar from "../components/Navbar.jsx";
const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"];
const OPTION_LABELS = ["A", "B", "C", "D"];
export default function QuizPage() {
  const { quizId } = useParams();
  const {user} = useContext(BackendAuthConnection);
  const navigate= useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions]= useState([]);
  const [attempts,setAttempts] = useState([]);
  const [loading, setLoading]=useState(true);
  const [currIdx,setCurrIdx] = useState(0);
  const [answers, setAnswers]= useState({});
  const [submitted,setSubmitted] = useState(false);
  const [result, setResult]=useState(null);
  const [submitting,setSubmitting] = useState(false);
  useEffect(() => {
    async function loadQuiz() {
      try {
        //grabs quiz and questions from api
        const resObj = await fetch(`/api/quizzes/${quizId}`, { credentials:"include" });
        const datBuff= await resObj.json();
        setQuiz(datBuff.quiz);
        setQuestions(datBuff.questions);
      } catch(err) {}
      finally { setLoading(false); }
    }
    async function loadAttempts() {
      try {
        //gets past attemps for this quiz
        const resObj =await fetch("/api/my-quiz-attempts", { credentials:"include" });
        if (resObj.ok) {
          const datBuff= await resObj.json();
          setAttempts(datBuff.filter((a) => String(a.quiz_id) ===String(quizId)).slice(0, 5));
        }
      } catch(err) {}
    }
    loadQuiz();
    loadAttempts();
  }, [quizId]);
  function handleSelect(letter) {
    if (submitted) return;
    const qId =questions[currIdx].id;
    //updates the answers state with selected letter
    setAnswers((prev) => ({ ...prev, [qId]: letter }));
  }
  function handleNext() {
    //moves to next question
    if (currIdx + 1 < questions.length) setCurrIdx((i) => i + 1);
  }
  async function handleSubmit() {
    setSubmitting(true);
    try {
      //builds answer array then submits
      const ansArr = questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id] || "A",
      }));
      const resObj = await fetch(`/api/quizzes/${quizId}/submit`, {
        method:"POST",
        headers: { "Content-Type":"application/json" },
        credentials:"include",
        body: JSON.stringify({ answers: ansArr }),
      });
      //gets result back and sets it
      const datBuff =await resObj.json();
      setResult(datBuff);
      setSubmitted(true);
    } catch(err) {}
    finally { setSubmitting(false); }
  }
  function handleRestart() {
    //resets evrything back to start
    setCurrIdx(0);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
        <Navbar activePage="quiz" />
        <div className="flex flex-1 items-center justify-center text-gray-400 text-lg">Loading quiz...</div>
      </div>
    );
  }
  const currQ= questions[currIdx];
  const ansCnt =Object.keys(answers).length;
  const allAns= ansCnt === questions.length;
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col">
      <Navbar activePage="quiz" />
      <main className="flex flex-1 justify-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col gap-6">
          {!submitted ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-gray-400 hover:text-gray-600 transition"
                    aria-label="Back to dashboard"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-base font-semibold text-gray-700">{quiz.title}</h1>
                </div>
                <span className="text-sm text-gray-400">{currIdx + 1} of {questions.length}</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-1 bg-[#9D6381] rounded-full transition-all"
                  style={{ width: `${((currIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
                <h2 className="text-lg font-semibold text-gray-800">{currQ.question}</h2>
                <div className="flex flex-col gap-3">
                  {OPTION_KEYS.map((key, i) => {
                    const ltr= OPTION_LABELS[i];
                    const isSlct = answers[currQ.id] === ltr;
                    let btnCls ="border-gray-200 hover:bg-gray-50 cursor-pointer";
                    if (isSlct) btnCls= "border-[#9D6381] bg-white";
                    let circleCls = "bg-gray-100 text-gray-500";
                    if (isSlct) circleCls ="bg-[#9D6381] text-white";
                    let txtCls= "text-gray-700";
                    if (isSlct) txtCls = "text-gray-800 font-medium";
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelect(ltr)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center gap-4 ${btnCls}`}
                       >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition ${circleCls}`}>
                          {ltr}
                        </span>
                        <span className={`text-sm ${txtCls}`}>
                          {currQ[key]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setCurrIdx((i) => i - 1)}
                    disabled={currIdx === 0}
                    className={`px-6 py-2 rounded-xl text-sm transition border ${
                      currIdx === 0
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Back
                  </button>
                  {currIdx + 1 < questions.length ? (
                    <button
                      onClick={handleNext}
                      disabled={!answers[currQ.id]}
                      className={`px-6 py-2 rounded-xl text-white text-sm transition ${
                        answers[currQ.id] ? "bg-[#9D6381] hover:bg-[#8a5270]" : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    (() => {
                      let subBtnCls ="bg-gray-300 cursor-not-allowed";
                      if (allAns) subBtnCls= "bg-[#9D6381] hover:bg-[#8a5270]";
                      let subTxt= "Submit quiz";
                      if (submitting) subTxt ="Submitting...";
                      return (
                        <button
                        onClick={handleSubmit}
                        disabled={submitting || !allAns}
                        className={`px-6 py-2 rounded-xl text-white text-sm transition ${subBtnCls}`}
                        >
                        {subTxt}
                        </button>
                      );})())}
                </div>
              </div>
              <div className="flex gap-2 items-center justify-center">
                {questions.map((q, i) => {
                  const isActv= i === currIdx;
                  const ansChk = !!answers[q.id];
                  let dotCls ="w-2.5 h-2.5 bg-gray-300";
                  if (isActv) dotCls= "w-6 h-2.5 bg-[#9D6381]";
                  else if (ansChk) dotCls = "w-2.5 h-2.5 bg-[#c9a0b8]";
                  return (
                    <button
                    key={q.id}
                    onClick={() =>setCurrIdx(i)}
                    className={`rounded-full transition-all ${dotCls}`}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            //results page after submitting
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 flex flex-col gap-4 items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#f9f0f5] flex items-center justify-center text-3xl">
                  {result.score / result.total_questions >= 0.8 ? "🎉" : result.score / result.total_questions >= 0.5 ? "👍" : "📚"}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Quiz Complete!</h2>
                <p className="text-gray-500 text-lg">
                  You scored{" "}
                  <span className="text-[#9D6381] font-semibold">
                    {result.score} / {result.total_questions}
                  </span>
                </p>
                <p className="text-gray-400 text-sm">{Math.round((result.score / result.total_questions) * 100)}% correct</p>
                <div className="flex gap-4 mt-4">
                  <button onClick={handleRestart} className="bg-[#9D6381] text-white px-6 py-3 rounded-xl hover:bg-[#8a5270] transition">
                    Retry Quiz
                  </button>
                  <button onClick={() => navigate("/dashboard")} className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-50 transition">
                    Back to Dashboard
                  </button>
                </div>
              </div>
              {attempts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3">
                  <h3 className="font-semibold text-gray-800">Past Attempts</h3>
                  {attempts.map((a, i) => (
                    <div key={a.id} className="flex justify-between items-center px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                      <span className="text-gray-600 text-sm">Attempt {attempts.length - i}</span>
                      <span className="text-[#9D6381] font-medium text-sm">{a.score}/{a.total_questions}</span>
                    </div>
                  ))}</div>)}
                  </div>)}
              </div>
      </main>
    </div>
  );
}