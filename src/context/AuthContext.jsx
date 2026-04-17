import React, { createContext, useContext, useState, useEffect } from "react";

/* ─── Create Context ─── */
const AuthContext = createContext();

/* ─── Provider ─── */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ─── Load user from localStorage (on app start) ─── */
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("cgms_user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Error loading user:", err);
      localStorage.removeItem("cgms_user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── LOGIN ─── */
  const login = (userData) => {
    if (!userData) return;

    console.log("✅ LOGIN SUCCESS:", userData);

    setUser(userData);
    localStorage.setItem("cgms_user", JSON.stringify(userData));
  };

  /* ─── LOGOUT ─── */
  const logout = () => {
    console.log("🚪 LOGOUT");

    setUser(null);
    localStorage.removeItem("cgms_user");
  };

  /* ─── Check role (optional future use) ─── */
  const hasRole = (roleId) => {
    return user?.id === roleId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ─── Hook ─── */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};