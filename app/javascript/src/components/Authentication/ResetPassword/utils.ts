import * as Yup from "yup";

export const resetPasswordFormInitialValues = {
  password: "",
  confirm_password: "",
};

export const resetPasswordFormValidationSchema = Yup.object().shape({
  password: Yup.string()
    .matches(/^\S.*\S$/, "Password cannot start or end with a blank space")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_\w\s\x00-\x1F\x7F])[\S]{8,}$/, // eslint-disable-line
      "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .required("Password cannot be blank"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password cannot be blank"),
});
