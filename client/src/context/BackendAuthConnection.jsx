import { createContext, useState, useEffect } from 'react';
export const BackendAuthConnection = createContext();

export const Authenticator = ({ children }) => {
  // no user logged in then wait and check localStorage for login
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // now loading, fetch user data from cookie 
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // http call automatically sends cookie to /api/me
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); // save login state for user
        } else {
          // not logged in
          setUser(null);
        }
      } catch (error) {
        // *shrug* fail
        console.error('Error fetching profile:', error);
      } finally {
        // FORCE loading false no matter try fail or pass ^^
        setLoading(false);
      }
    };

    // actually fetch now
    fetchProfile();
  }, []);

  // login and save token to user temp storage
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/login', {
        // match same formatting as POSTMAN testing (post request with json email/pw)
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // me <3 stringify
        body: JSON.stringify({ email, password })
      });

      //this should return json that contains everything (login msg, user token, user data[id, email, role, name])
      const data = await response.json();

      if (response.ok) {
        // token saved -> user logged in
        setUser(data.user);
        return { 
          // hooray 
          success: true 
        };
      } else {
        return { 
          // probably failed with parsing the data or invalid token or anything
          success: false, 
          error: data.error 
        };
      }
    } catch (err) {
      console.error("Login API Error:", err);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  // registration
  const register = async (email, password, role, name) => {
    try {
      // same as postman registration
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name })
      });

      // if new user registers should return msg, user data[id, email, role, name]
      // if failed with reused, only error msg
      const data = await response.json();

      if (response.ok) {
      // same error checking as login
        return { 
          success: true 
        };
      } else {
        return { 
          success: false, 
          error: data.error 
        };
      }
    } catch (err) {
      console.error("Register API Error:", err);
      return { success: false, error: 'Network error occurred' };
    }
  };

  // logout user and ask to clear cookie
  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error("Logout API Error:", err);
    }
    setUser(null);
  };

// THIS IS WHAT U CALL TO USE LOGIN IN OTHER JSX FILES LIKE IN HEADER
// CALL useContext(BackendAuthConnection)

  return (
    <BackendAuthConnection.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </BackendAuthConnection.Provider>
  );
};
