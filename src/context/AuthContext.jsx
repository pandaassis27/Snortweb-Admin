import React, { createContext, useState, useEffect, useContext } from "react";
import { authAPI } from "../services/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("adminToken");
    setAdmin(null);
  };

  useEffect(() => {
    let logoutTimer;

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          setLoading(false);
          return;
        }

        const decoded = jwtDecode(token);

        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          logout();
          setLoading(false);
          return;
        }

        const { data } = await authAPI.getProfile();

        setAdmin(data);

        const timeUntilExpiry = (decoded.exp - currentTime) * 1000;

        logoutTimer = setTimeout(() => {
          logout();
        }, timeUntilExpiry);
      } catch (err) {
        console.error(err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const handleUnauthorized = () => {
      logout();
      setLoading(false);
    };

    window.addEventListener("auth-unauthorized", handleUnauthorized);

    return () => {
      clearTimeout(logoutTimer);
      window.removeEventListener(
        "auth-unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    const { data } = await authAPI.login({
      usernameOrEmail,
      password,
    });

    localStorage.setItem("adminToken", data.token);

    setAdmin({
      _id: data._id,
      username: data.username,
      email: data.email,
      role: data.role,
    });

    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await authAPI.register({
      username,
      email,
      password,
    });

    localStorage.setItem("adminToken", data.token);

    setAdmin({
      _id: data._id,
      username: data.username,
      email: data.email,
      role: data.role,
    });

    return data;
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

export const useAuth = () => useContext(AuthContext);
