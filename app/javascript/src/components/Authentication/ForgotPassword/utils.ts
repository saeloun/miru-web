import * as Yup from "yup";

export const forgotPasswordFormInitialValues = {
  email: "",
};

export const forgotPasswordFormValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
});
