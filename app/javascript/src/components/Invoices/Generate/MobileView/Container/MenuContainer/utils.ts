import * as Yup from "yup";

export const invoiceDetailsFormInitialValues = {
  billedTo: "",
  issueDate: "",
  dueDate: "",
  invoiceNumber: "",
  referenceNumber: "",
};

export const invoiceDetailsSchema = Yup.object().shape({
  issueDate: Yup.date().typeError("Invalid date"),
  dueDate: Yup.date().typeError("Invalid date"),
  invoiceNumber: Yup.string().typeError("Invalid number"),
  referenceNumber: Yup.string().typeError("Invalid number"),
});
