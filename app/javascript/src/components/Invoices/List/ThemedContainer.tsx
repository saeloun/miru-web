import React, { useState, useEffect } from "react";
import Container from "./container";
import AdminDashboard from "../AdminDashboard";
import ThemeToggle from "../ThemeToggle";

const ThemedContainer = props => {
  const [theme, setTheme] = useState<"classic" | "admin">("classic");

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("miru-invoice-theme") as
      | "classic"
      | "admin";
    if (savedTheme && (savedTheme === "classic" || savedTheme === "admin")) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme preference
  const handleThemeChange = (newTheme: "classic" | "admin") => {
    setTheme(newTheme);
    localStorage.setItem("miru-invoice-theme", newTheme);
  };

  return (
    <>
      {theme === "classic" ? (
        <Container {...props} />
      ) : (
        <AdminDashboard
          summary={props.summary}
          invoices={props.invoices}
          filterParams={props.filterParams}
          setFilterParams={props.setFilterParams}
          isDesktop={props.isDesktop}
          fetchInvoices={props.fetchInvoices}
        />
      )}

      <ThemeToggle currentTheme={theme} onThemeChange={handleThemeChange} />
    </>
  );
};

export default ThemedContainer;
