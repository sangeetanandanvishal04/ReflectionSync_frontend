// src/context/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { decodeToken } from "../utils/jwt";
import { useNavigate } from "react-router-dom";

type User = { id?: number; email?: string; role?: string } | null;
type AuthContextType = {
  token: string | null;
  user: User;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;

  // password reset flows
  forgotPassword: (email: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string, confirmPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User>(() => decodeToken(localStorage.getItem("token")));
  const nav = useNavigate();

  useEffect(() => {
    setUser(decodeToken(token));
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const t = res.data?.access_token;
    if (!t) throw new Error("No token in response");
    setToken(t);
  }

  async function signup(email: string, password: string) {
    await api.post("/auth/signup", { email, password });
  }

  function logout() {
    setToken(null);
    nav("/login");
  }

  // ----- password reset related -----
  async function forgotPassword(email: string) {
    // POST /auth/forgot-password/{email}
    await api.post(`/auth/forgot-password/${encodeURIComponent(email)}`);
  }

  async function resendOtp(email: string) {
    await api.post(`/auth/resend-otp/${encodeURIComponent(email)}`);
  }

  async function verifyOtp(email: string, otp: string) {
    // POST /auth/otp-verification { email, otp }
    await api.post("/auth/otp-verification", { email, otp });
  }

  async function resetPassword(email: string, newPassword: string, confirmPassword: string) {
    // POST /auth/reset-password { email, new_password, confirm_password }
    await api.post("/auth/reset-password", {
      email,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        signup,
        logout,
        forgotPassword,
        resendOtp,
        verifyOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}