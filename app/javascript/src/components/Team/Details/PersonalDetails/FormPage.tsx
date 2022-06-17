
import React from "react";
import { Field, useField, useFormikContext } from "formik";
import DatePicker from "react-datepicker";

const FormPage = ({ props }) => {
  const { errors, touched } = props;
  const { setFieldValue } = useFormikContext();
  const [field] = useField("dob");

  return (
    <div className="bg-miru-gray-100 px-10 mt-4 h-full">
      <div className="flex py-10 border-b border-b-miru-gray-400">
        <div className="w-1/5">
          <span>Basic Details</span>
        </div>
        <div className="w-full">
          <h6>Name</h6>
          <div className="flex">
            <div className="w-6/12 pr-2 mt-2">
              <Field className={`w-full py-1 ${errors.firstName && touched.firstName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="firstName" />
            </div>
            <div className="w-6/12 pl-2 mt-2">
              <Field className={`w-full py-1 ${errors.lastName && touched.lastName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="lastName" />
            </div>
          </div>
          <div className="flex mt-4">
            <div className="w-6/12">
              <DatePicker
                wrapperClassName="datePicker invoice-datepicker"
                calendarClassName="miru-calendar invoice-datepicker-option"
                {...field}
                {...props}
                dateFormat="dd.MM.yyyy"
                selected={(field.value && new Date(field.value)) || null}
                onChange={val => {
                  setFieldValue("dob", val);
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </div >
  );
};

export default FormPage;
