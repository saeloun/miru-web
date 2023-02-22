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
  firstName: Yup.string().required("First name can not be blank"),
  lastName: Yup.string().required("Last name can not be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
  // isAgreedTermsOfServices: Yup.boolean().oneOf(
  //   [true],
  //   "You have to accept the Terms of Service and Privacy Policy"
  // ),
  password: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/, // eslint-disable-line
      "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .required("Password can not be blank"),
  confirm_password: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/, // eslint-disable-line
      "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Password can not be blank"),
});
