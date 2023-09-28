export const employeeTypes = [
  { label: "Salaried Employee", value: "salaried" },
  { label: "Contractor", value: "contractor" },
];

export function getLabelForValue(valueToFind: string): string | null {
  const foundType = employeeTypes.find(type => type.value === valueToFind);

  return foundType ? foundType.label : null;
}
