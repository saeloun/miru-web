export const CompensationDetailsState = {
  earnings: [
    { type: "Monthly Salary", amount: 125000 },
    { type: "SGST (9%)", amount: 11250 },
    { type: "CGST (9%)", amount: 11250 },
  ],
  deductions: [{ type: "TDS", amount: 12500 }],
  total: {
    amount: 147500,
  },
};
