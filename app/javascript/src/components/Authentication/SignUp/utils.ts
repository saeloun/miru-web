import * as Yup from "yup";

export const signUpFormInitialValues = {
  first_name: "",
  last_name: "",
  email: "",
  isAgreedTermsOfServices: false,
  password: "",
  confirm_password: "",
};

export const signUpFormValidationSchema = Yup.object().shape({
  first_name: Yup.string()
    .matches(/^[A-Za-z ]*$/, "Please enter valid first name")
    .max(20, "Maximum 20 characters are allowed")
    .required("First name cannot be blank"),
  last_name: Yup.string()
    .matches(/^[A-Za-z ]*$/, "Please enter valid last name")
    .max(20, "Maximum 20 characters are allowed")
    .required("Last name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  password: Yup.string()
    .matches(/^\S.*\S$/, "Password cannot start or end with a blank space")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\W\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
      "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .required("Password cannot be blank"),
  confirm_password: Yup.string()
    .matches(/^\S.*\S$/, "Password cannot start or end with a blank space")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\W\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
      "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password cannot be blank"),
  isAgreedTermsOfServices: Yup.boolean().oneOf(
    [true],
    "Please agree to the terms and privacy policy to continue"
  ),
});
