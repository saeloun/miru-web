import * as Yup from "yup";

export const invoiceDetailsFormInitialValues = (invoiceNumber, reference) => {
  const invoiceDetails = {
    billedTo: "",
    issueDate: "",
    dueDate: "",
    invoiceNumber,
    referenceNumber: reference,
  };

  return invoiceDetails;
};

export const invoiceDetailsSchema = Yup.object().shape({
  issueDate: Yup.date().typeError("Invalid date"),
  dueDate: Yup.date().typeError("Invalid date"),
  invoiceNumber: Yup.string().required("Invalid number"),
  referenceNumber: Yup.string().typeError("Invalid number"),
});
