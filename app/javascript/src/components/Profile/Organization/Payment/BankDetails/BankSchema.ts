import * as Yup from "yup";

const BankSchema = Yup.object().shape({
  bankName: Yup.string()
    .required("Name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  routingNumber: Yup.string()
    .max(9, "Routing number must have 9 characters")
    .min(9, "Routing number must have 9 characters"),
  accountNumber: Yup.string()
    .max(17, "Maximum 17 characters are allowed")
    .min(6, "Minimum 6 characters are required"),
  accountType: Yup.string().required("Account type cannot be blank"),
});

export default BankSchema;
