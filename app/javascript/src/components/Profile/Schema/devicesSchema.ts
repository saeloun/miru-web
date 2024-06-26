import * as Yup from "yup";

export const devicesSchema = Yup.object().shape({
  device_type: Yup.string()
    .required("Please enter device type")
    .max(10, "Maximum 10 characters are allowed"),
  name: Yup.string()
    .required("Please enter name")
    .max(20, "Maximum 20 characters are allowed"),
  serial_number: Yup.string()
    .required("Please enter serial number")
    .max(10, "Maximum 10 characters are allowed"),
  specifications: Yup.object().shape({
    ram: Yup.string()
      .required("Please enter ram")
      .max(10, "Maximum 10 characters are allowed"),
    graphics: Yup.string()
      .required("Please enter graphics")
      .max(10, "Maximum 10 characters are allowed"),
    processor: Yup.string()
      .required("Please enter processor")
      .max(10, "Maximum 10 characters are allowed"),
  }),
});
