import * as Yup from "yup";

export const userSchema = {
  first_name: Yup.string().required("Please enter first name"),
  last_name: Yup.string().required("Please enter last name"),
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
};
