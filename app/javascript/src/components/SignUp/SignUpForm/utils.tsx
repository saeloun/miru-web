import * as Yup from "yup";

export const signUpFormInitialValues = {
  firstName: "",
  lastName: "",
  email: "",
  isAgreedTermsOfServices: false,
};

export const signUpFormValidationSchema = Yup.object().shape({
  firstName: Yup.string().required("First name can not be blank"),
  lastName: Yup.string().required("Last name can not be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  isAgreedTermsOfServices: Yup.boolean().oneOf(
    [true],
    "You have to accept the Terms of Service and Privacy Policy"
  ),
});
