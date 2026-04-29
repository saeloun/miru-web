type LineItemDisplayNameInput = {
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
};

export const getLineItemDisplayName = (
  item: LineItemDisplayNameInput
): string => {
  const fullName = [item.first_name, item.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || item.name || "";
};
