import * as Yup from "yup";

export const addEditFormInitialValues = editData => {
  if (editData.id || editData.timesheet_entry_id) {
    const editFormInitialValues = {
      name: editData.name || `${editData.first_name} ${editData.last_name}`,
      description: editData.description,
      date: editData.date,
      rate: editData.rate,
      quantity: editData.quantity,
    };

    return editFormInitialValues;
  }

  const addFormInitialValues = {
    name: "",
    description: "",
    date: "",
    rate: "",
    quantity: "",
  };

  return addFormInitialValues;
};

export const addEditFormSchema = Yup.object().shape({
  name: Yup.string().required("Name cannot be blank"),
  description: Yup.string().typeError("Invalid Note"),
  date: Yup.date().typeError("Invalid date"),
  rate: Yup.number().typeError("Invalid number"),
  quantity: Yup.number().typeError("Invalid number"),
});
