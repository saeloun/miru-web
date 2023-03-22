import * as Yup from "yup";

export const signUpFormInitialValues = {
  firstName: "",
  lastName: "",
  email: "",
  isAgreedTermsOfServices: false,
  password: "",
  confirm_password: "",
};

export const signUpFormValidationSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[A-Za-z ]*$/, "Please enter valid first name")
    .required("First name can not be blank"),
  lastName: Yup.string()
    .matches(/^[A-Za-z ]*$/, "Please enter valid last name")
    .required("Last name can not be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  password: Yup.string()
    .matches(/^\S.*\S$/, "Password can not start or end with a blank space")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
      "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .required("Password can not be blank"),
  confirm_password: Yup.string()
    .matches(/^\S.*\S$/, "Password can not start or end with a blank space")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
      "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Password can not be blank"),
});
