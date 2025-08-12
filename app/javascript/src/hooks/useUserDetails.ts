import { useState, useEffect } from "react";
import axios from "axios";
import { useAuthState } from "context/auth";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface UserDetails {
  user: any;
  company: any;
  companyRole: string;
  loading: boolean;
  error: string | null;
}

export const useUserDetails = (forceRefresh = false): UserDetails => {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    user: null,
    company: null,
    companyRole: "",
    loading: true,
    error: null,
  });
  const [retryCount, setRetryCount] = useState(0);
  const { isLoggedIn } = useAuthState();

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get("/internal_api/v1/users/_me");
      const { user, company, company_role } = response.data;

      // Store in localStorage for persistence
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("company_role", company_role || "");
        if (company) {
          localStorage.setItem("company", JSON.stringify(company));
        }
      }

      setUserDetails({
        user,
        company,
        companyRole: company_role,
        loading: false,
        error: null,
      });

      return true; // Success
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      return false; // Failure
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setUserDetails({
        user: null,
        company: null,
        companyRole: "",
        loading: false,
        error: "Not logged in",
      });
      return;
    }

    // Try to get from localStorage first
    const storedUser = localStorage.getItem("user");
    const storedCompanyRole = localStorage.getItem("company_role");
    const storedCompany = localStorage.getItem("company");

    if (storedUser) {
      setUserDetails({
        user: JSON.parse(storedUser),
        company: storedCompany ? JSON.parse(storedCompany) : null,
        companyRole: storedCompanyRole || "",
        loading: false,
        error: null,
      });
    } else {
      // Fetch from server if not in localStorage
      const attemptFetch = async () => {
        const success = await fetchUserDetails();
        
        if (!success && retryCount < MAX_RETRIES) {
          // Retry after delay
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        } else if (!success) {
          setUserDetails(prev => ({
            ...prev,
            loading: false,
            error: "Failed to fetch user details after multiple attempts",
          }));
        }
      };

      attemptFetch();
    }
  }, [isLoggedIn, retryCount]);

  return userDetails;
};