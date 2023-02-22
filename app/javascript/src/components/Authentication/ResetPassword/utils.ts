import * as Yup from "yup";

export const resetPasswordFormInitialValues = {
  password: "",
  confirm_password: "",
};

export const resetPasswordFormValidationSchema = Yup.object().shape({
  password: Yup.string()
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/, // eslint-disable-line
      "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
    )
    .required("Password can not be blank"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Password can not be blank"),
});
