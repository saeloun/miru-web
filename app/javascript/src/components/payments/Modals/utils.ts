import dayjs from "dayjs";

export const paymentEntryInitialValues = {
  invoice: null,
  transactionDate: dayjs(),
  transactionType: null,
  note: "",
  amount: "",
  showTransactionTypes: false,
};
