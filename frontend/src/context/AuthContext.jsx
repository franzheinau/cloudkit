import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ck_token"));
  const [user, setUser]   = useState(() => localStorage.getItem("ck_user"));

  const saveToken = (t, username) => {
    localStorage.setItem("ck_token", t);
    localStorage.setItem("ck_user", username);
    setToken(t);
    setUser(username);
  };

  const logout = () => {
    localStorage.removeItem("ck_token");
    localStorage.removeItem("ck_user");
    setToken(null);
    setUser(null);
  };

  // 🔥 helper biar gak crash kalau response bukan JSON
  const parseJSON = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Response bukan JSON:", text);
      throw new Error("Server error (bukan JSON)");
    }
  };

  const register = useCallback(async (username, password) => {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await parseJSON(res);

    if (!res.ok) throw new Error(data.detail || "Registrasi gagal");

    saveToken(data.access_token, username);
  }, []);

  const login = useCallback(async (username, password) => {
    const form = new URLSearchParams({ username, password });

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    const data = await parseJSON(res);

    if (!res.ok) throw new Error(data.detail || "Login gagal");

    saveToken(data.access_token, username);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API };