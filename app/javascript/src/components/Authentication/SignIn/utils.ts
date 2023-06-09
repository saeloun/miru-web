import * as Yup from "yup";

export const signInFormInitialValues = {
  email: "",
  password: "",
};

export const signInFormValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  password: Yup.string().required("Password cannot be blank"),
});
