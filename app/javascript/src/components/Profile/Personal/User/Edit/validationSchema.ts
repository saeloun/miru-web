import * as Yup from "yup";

export const userSchema = {
  first_name: Yup.string()
    .required("Please enter first name")
    .max(20, "Maximum 20 characters are allowed"),
  last_name: Yup.string()
    .required("Please enter last name")
    .max(20, "Maximum 20 characters are allowed"),
  addresses: Yup.object().shape({
    address_line_1: Yup.string().required("Please enter address line 1"),
    country: Yup.string().required("Please enter country"),
    state: Yup.string().required("Please enter state"),
    city: Yup.string().required("Please enter city"),
    pin: Yup.string().required("Please enter zipcode"),
  }),
  is_email: Yup.boolean(),
  email_id: Yup.string()
    .nullable()
    .when("is_email", {
      is: true,
      then: Yup.string().email("Please enter valid email"),
    }),
  changePassword: Yup.boolean(),
  password: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string()
      .required("Please enter password")
      .matches(/^\S.*\S$/, "Password cannot start or end with a blank space")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
        "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      ),
  }),
  currentPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string().required("Please enter current password"),
  }),

  confirmPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string()
      .matches(/^\S.*\S$/, "Password cannot start or end with a blank space")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s\x00-\x1F\x7F])[\S\s]{8,}$/, // eslint-disable-line
        "Must Contain at least 8 Characters, One Uppercase, One Lowercase, One Number and One Special Character"
      )
      .oneOf([Yup.ref("password"), null], "Passwords don't match"),
  }),
};
