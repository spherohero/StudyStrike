import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BackendAuthConnection } from "../../context/BackendAuthConnection.jsx";

export default function Login() {
  const { login, register } = useContext(BackendAuthConnection);
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STUD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) return;
    setError("");
    setLoading(true);

    let result;
    if (isSignUp) {
      result = await register(email, password, role, name);
      if (result.success) {
        // auto-login after register
        result = await login(email, password);
      }
    } else {
      result = await login(email, password);
    }

    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <Link to="/" className="text-sm text-gray-400 hover:underline block mb-4">← Back to home</Link>
        <h2 className="text-xl font-bold mb-6">{isSignUp ? "Create Account" : "Login"}</h2>

        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm outline-none focus:border-[#9D6381]"
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setRole("STUD")}
                className={`flex-1 py-2 rounded-lg text-sm border transition ${role === "STUD" ? "bg-[#9D6381] text-white border-[#9D6381]" : "border-gray-200"}`}
              >
                Student
              </button>
              <button
                onClick={() => setRole("TEACH")}
                className={`flex-1 py-2 rounded-lg text-sm border transition ${role === "TEACH" ? "bg-[#9D6381] text-white border-[#9D6381]" : "border-gray-200"}`}
              >
                Teacher
              </button>
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm outline-none focus:border-[#9D6381]"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 mb-2 text-sm outline-none focus:border-[#9D6381]"
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#9D6381] hover:bg-[#8a5270] text-white py-3 rounded-lg text-sm font-medium mt-4 disabled:opacity-50 transition"
        >
          {loading ? "Please wait…" : isSignUp ? "Create Account" : "Login"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-[#9D6381] cursor-pointer hover:underline"
          >
            {isSignUp ? "Login" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
}
