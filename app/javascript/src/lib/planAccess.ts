export const hasProAccess = (
  company?: {
    pro_access?: boolean;
    plan_tier?: string;
    current_plan_label?: string;
    plan_label?: string;
    trial_active?: boolean;
  } | null
) => {
  if (!company) return false;

  if (company.pro_access === true) return true;

  if (company.trial_active) return true;

  const label = company.current_plan_label || company.plan_label;
  if (label === "paid" || label === "pro_trial") return true;

  return company.plan_tier === "paid";
};

export const getStoredCompany = () => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("company");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};
