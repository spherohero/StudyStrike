export default function Login() {
  return (
    <div className= "min-h-screen bg-gray-100 flex items-center justify-center">
      <div className= "bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <h2 className= "text-xl font-bold mb-6">Login</h2>
        {/* This is the email part I did*/}
        <input
          type= "email"
          placeholder= "Email"
          className= "w-full border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm outline-none focus:border-red-400"
        />
        {/* This is the password I did*/}
        <input
          type= "password"
          placeholder= "Password"
          className= "w-full border border-gray-200 rounded-lg px-4 py-3 mb-6 text-sm outline-none focus:border-red-400"
        />
        {/* This is the submit button I did */}
        <button className= "w-full bg-red-400 hover:bg-red-500 text-white py-3 rounded-lg text-sm font-medium">
          Login
        </button>
        {/* This is the link to signup I did*/}
        <p className="text-center text-sm text-gray-500 mt-4">
          Dont have an account?{" "}
          <span className= "text-red-400 cursor-pointer hover:underline">Sign up</span>
        </p>
      </div>
    </div>
  )
}