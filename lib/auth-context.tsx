"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    agreePolicy: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on mount
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      const checkAuth = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/auth/check", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (response.ok) {
            setIsAuthenticated(true);
            // Redirect to dashboard if authenticated
            if (
              window.location.pathname === "/" ||
              window.location.pathname === "/login"
            ) {
              router.push("/dashboard");
            }
          } else {
            setIsAuthenticated(false);
            setToken(null);
            localStorage.removeItem("authToken");
            if (
              window.location.pathname !== "/login" &&
              window.location.pathname !== "/signup"
            ) {
              router.push("/login");
            }
          }
        } catch (error) {
          console.error("Error checking auth:", error);
          setIsAuthenticated(false);
          setToken(null);
          localStorage.removeItem("authToken");
          if (
            window.location.pathname !== "/login" &&
            window.location.pathname !== "/signup"
          ) {
            router.push("/login");
          }
        }
      };
      checkAuth();
    } else {
      setIsAuthenticated(false);
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/signup"
      ) {
        router.push("/login");
      }
    }
  }, [router]);

  const login = async (email: string, password: string) => {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }
    setToken(data.token);
    localStorage.setItem("authToken", data.token);
    setIsAuthenticated(true);
    router.push("/dashboard");
  };

  const signup = async (
    email: string,
    password: string,
    agreePolicy: boolean
  ) => {
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, agreePolicy }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }
    setToken(data.token);
    localStorage.setItem("authToken", data.token);
    setIsAuthenticated(true);
    router.push("/dashboard");
  };

  const logout = async () => {
    if (!token) {
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem("authToken");
      router.push("/login");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setIsAuthenticated(false);
        setToken(null);
        localStorage.removeItem("authToken");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error during logout:", error);
      setIsAuthenticated(false);
      setToken(null);
      localStorage.removeItem("authToken");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
