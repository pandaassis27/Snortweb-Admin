import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("adminToken");
      if (token) {
        try {
          const { data } = await authAPI.getProfile();
          setAdmin(data);
        } catch (error) {
          console.error("Profile fetch error:", error.message);
          localStorage.removeItem("adminToken");
          setAdmin(null);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const login = async (usernameOrEmail, password) => {
    const { data } = await authAPI.login({ usernameOrEmail, password });
    localStorage.setItem("adminToken", data.token);
    setAdmin({ _id: data._id, username: data.username, email: data.email });
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await authAPI.register({ username, email, password });
    localStorage.setItem("adminToken", data.token);
    setAdmin({ _id: data._id, username: data.username, email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
