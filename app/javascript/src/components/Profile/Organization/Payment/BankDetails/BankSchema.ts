import * as Yup from "yup";

const BankSchema = Yup.object().shape({
  bankName: Yup.string()
    .required("Name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  routingNumber: Yup.string()
    .max(9, "Routing number must have 9 characters")
    .min(9, "Routing number must have 9 characters"),
  accountNumber: Yup.string()
    .max(12, "Account number must have 12 characters")
    .min(12, "Account number must have 12 characters"),
  accountType: Yup.string().required("Account type cannot be blank"),
});

export default BankSchema;
