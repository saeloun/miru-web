import { useState, useEffect } from "react";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  confirmed?: boolean;
  calendar_enabled?: boolean;
  calendar_connected?: boolean;
  current_workspace_id?: number;
}

interface UseCurrentUserReturn {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage current user data from the _me endpoint
 * This ensures we always have fresh user data from the server instead of relying on localStorage
 */
export const useCurrentUser = (): UseCurrentUserReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/internal_api/v1/users/_me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN":
            document
              .querySelector('[name="csrf-token"]')
              ?.getAttribute("content") || "",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);

        return data.user;
      } else if (response.status === 401) {
        // User not authenticated
        setCurrentUser(null);

        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMessage);
      setCurrentUser(null);

      return null;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return {
    currentUser,
    loading,
    error,
    refetch,
  };
};

export default useCurrentUser;
