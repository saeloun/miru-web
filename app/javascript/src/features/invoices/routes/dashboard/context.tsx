// features/invoices/routes/dashboard/context.tsx
// Dashboard context for state management

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { DashboardData } from "./loader";

interface DashboardState {
  data: DashboardData | null;
  selectedInvoices: Set<string>;
  filters: {
    status?: string[];
    clientId?: string;
    dateRange?: { from: Date; to: Date };
    search?: string;
  };
  view: "grid" | "table";
  theme: "classic" | "admin";
}

type DashboardAction =
  | { type: "SET_DATA"; payload: DashboardData }
  | { type: "SELECT_INVOICE"; payload: string }
  | { type: "DESELECT_INVOICE"; payload: string }
  | { type: "SELECT_ALL_INVOICES"; payload: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_FILTER"; payload: Partial<DashboardState["filters"]> }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_VIEW"; payload: "grid" | "table" }
  | { type: "SET_THEME"; payload: "classic" | "admin" };

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, data: action.payload };

    case "SELECT_INVOICE":
      return {
        ...state,
        selectedInvoices: new Set([...state.selectedInvoices, action.payload]),
      };

    case "DESELECT_INVOICE": {
      const newSet = new Set(state.selectedInvoices);
      newSet.delete(action.payload);

      return { ...state, selectedInvoices: newSet };
    }

    case "SELECT_ALL_INVOICES":
      return {
        ...state,
        selectedInvoices: new Set(action.payload),
      };

    case "CLEAR_SELECTION":
      return { ...state, selectedInvoices: new Set() };

    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case "CLEAR_FILTERS":
      return { ...state, filters: {} };

    case "SET_VIEW":
      return { ...state, view: action.payload };

    case "SET_THEME":
      localStorage.setItem("invoice-theme", action.payload);

      return { ...state, theme: action.payload };

    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  actions: {
    selectInvoice: (id: string) => void;
    deselectInvoice: (id: string) => void;
    selectAllInvoices: (ids: string[]) => void;
    clearSelection: () => void;
    setFilter: (filter: Partial<DashboardState["filters"]>) => void;
    clearFilters: () => void;
    setView: (view: "grid" | "table") => void;
    setTheme: (theme: "classic" | "admin") => void;
  };
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: { data: DashboardData; refetch: () => void };
}) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    data: value.data,
    selectedInvoices: new Set(),
    filters: {},
    view: "table",
    theme:
      (localStorage.getItem("invoice-theme") as "classic" | "admin") || "admin",
  });

  const actions = {
    selectInvoice: (id: string) =>
      dispatch({ type: "SELECT_INVOICE", payload: id }),
    deselectInvoice: (id: string) =>
      dispatch({ type: "DESELECT_INVOICE", payload: id }),
    selectAllInvoices: (ids: string[]) =>
      dispatch({ type: "SELECT_ALL_INVOICES", payload: ids }),
    clearSelection: () => dispatch({ type: "CLEAR_SELECTION" }),
    setFilter: (filter: Partial<DashboardState["filters"]>) =>
      dispatch({ type: "SET_FILTER", payload: filter }),
    clearFilters: () => dispatch({ type: "CLEAR_FILTERS" }),
    setView: (view: "grid" | "table") =>
      dispatch({ type: "SET_VIEW", payload: view }),
    setTheme: (theme: "classic" | "admin") =>
      dispatch({ type: "SET_THEME", payload: theme }),
  };

  return (
    <DashboardContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
}
