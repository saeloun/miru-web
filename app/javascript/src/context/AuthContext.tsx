import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Paths } from "constants/index";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  current_workspace_id: number;
  confirmed_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const csrfToken =
      document.querySelector('[name="csrf-token"]')?.getAttribute("content") ||
      "";

    try {
      const response = await fetch("/api/v1/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          user: { email, password },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Store auth data
        const authToken = data.user.token;
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        setToken(authToken);
        setUser(data.user);

        toast.success("Welcome back!");

        // Navigate to time tracking or intended destination
        navigate(Paths.TIME_TRACKING);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Login failed" }));

        const errorMessage =
          errorData.error || errorData.errors || "Invalid email or password";

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please try again.");
      throw error;
    }
  };

  const logout = async () => {
    const csrfToken =
      document.querySelector('[name="csrf-token"]')?.getAttribute("content") ||
      "";

    try {
      // Call logout API
      await fetch("/api/v1/users/logout", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "X-Auth-Token": token || "",
          "X-Auth-Email": user?.email || "",
          "X-CSRF-Token": csrfToken,
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    // Clear local state regardless of API result
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);

    // Navigate to login
    navigate(Paths.LOGIN);
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
