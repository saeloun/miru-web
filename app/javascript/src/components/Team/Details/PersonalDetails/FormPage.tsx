
import React, { Fragment, useEffect } from "react";
import DatePicker from "react-datepicker";
import { useTeamDetails } from "context/TeamDetailsContext";
import { Formik, Form, Field, FormikProps } from "formik";
import * as Yup from "yup";
import "react-datepicker/dist/react-datepicker.css";

const TeamPersonalDetailSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  dob: Yup.date(),
  phoneNo: Yup.string().required("Phone Number cannot be blank"),
  email: Yup.string().email("Invalid email ID"),
  address: Yup.string(),
  linkedIn: Yup.string(),
  github: Yup.string()
});

interface FormValues {
  firstName: string;
  lastName: string;
  dob: Date;
  phoneNo: string;
  email: string;
  address: string;
  linkedIn: string;
  github: string;
}

const getInitialValues = () => ({
  firstName: "",
  lastName: "",
  dob: new Date(),
  phoneNo: "",
  email: "",
  address: "",
  linkedIn: "",
  github: ""
});

const FormPage = ({ setFormVisible }) => {
  const { updateDetails } = useTeamDetails();

  useEffect(() => {
    updateDetails("personal", {
      name: "Jane Cooper",
      dob: "04. 05. 1989",
      phone: "+123345234",
      email: "jane.cooper@gmail.com"
    });
  }, []);

  return (
    <Fragment>
      <Formik
        initialValues={getInitialValues()}
        validationSchema={TeamPersonalDetailSchema}
        onSubmit={() => {
          setFormVisible(false);
        }}
      >
        {(props: FormikProps<FormValues>) => {
          const { errors, touched, values, setFieldValue } = props;
          return (
            <Form>
              <div className="px-10 py-4 bg-miru-han-purple-1000 flex items-center justify-between">
                <h1 className="text-white font-bold text-2xl">Personal Details</h1>
                <div>
                  <button type="button" onClick={() => { setFormVisible(false); }} className="rounded-md py-1 px-2 tracking-widest text-xs mx-1 border border-miru-gray-1000 cursor-auto text-miru-gray-1000">Cancel</button>
                  <button type="submit" className="rounded-md py-1 px-2 tracking-widest text-xs mx-1 border bg-miru-gray-1000 cursor-auto text-miru-han-purple-1000">Update</button>
                </div>
              </div>
              <div className="bg-miru-gray-100 px-10 mt-4 h-full">
                <div className="flex py-10 border-b border-b-miru-gray-400">
                  <div className="w-1/5">
                    <span>Basic Details</span>
                  </div>
                  <div className="w-full ml-8">
                    <div className="flex justify-between">
                      <label className="text-miru-dark-purple-1000 font-medium text-sm">Name</label>
                      <div className="flex">
                        {errors.firstName && touched.firstName &&
                          <div className="tracking-wider block text-xs text-red-600">{errors.firstName}</div>
                        }
                        {errors.lastName && touched.lastName &&
                          <div className="tracking-wider block text-xs text-red-600 ml-2">{errors.lastName}</div>
                        }
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-6/12 pr-2 mt-2">
                        <Field className={`w-full py-1 px-2 ${errors.firstName && touched.firstName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="firstName" />
                      </div>
                      <div className="w-6/12 pl-2 mt-2">
                        <Field className={`w-full py-1 px-2 ${errors.lastName && touched.lastName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="lastName" />
                      </div>
                    </div>
                    <div className="flex mt-4">
                      <div className="w-6/12 pr-2 mt-2">
                        <div>
                          <label className="text-miru-dark-purple-1000 font-medium text-sm">Date of Birth</label>
                        </div>
                        <DatePicker
                          wrapperClassName="datePicker p-2 mt-2 w-full invoice-datepicker"
                          calendarClassName="miru-calendar invoice-datepicker-option"
                          {...props}
                          dateFormat="dd.MM.yyyy"
                          selected={values.dob}
                          onChange={val => {
                            setFieldValue("dob", val);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex py-10 border-b border-b-miru-gray-400">
                  <div className="w-1/5">
                    <span>Contact Details</span>
                  </div>
                  <div className="w-full ml-8">
                    <div className="flex">
                      <div className="w-6/12 pr-2">
                        <div className="flex">
                          <label className="text-miru-dark-purple-1000 font-medium text-sm">Phone Number</label>
                          {errors.phoneNo && touched.phoneNo &&
                            <div className="tracking-wider block text-xs text-red-600 ml-2">{errors.phoneNo}</div>
                          }
                        </div>
                        <Field className={`w-full mt-2 p-1 ${errors.firstName && touched.firstName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="phoneNo" />
                      </div>
                      <div className="w-6/12 pl-2 mt-2">
                        <div className="flex justify-between">
                          <label className="text-miru-dark-purple-1000 font-medium text-sm">Email ID (Personal)</label>
                          {errors.email && touched.email &&
                            <div className="tracking-wider block text-xs text-red-600 ml-2">{errors.email}</div>
                          }
                        </div>
                        <Field className={`w-full mt-2 p-1 ${errors.email && touched.email && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="email" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-miru-dark-purple-1000 font-medium text-sm">Address</label>
                      <Field component={(props) => (
                        <textarea className="w-full" {...props}></textarea>
                      )} className={`w-full mt-2 py-1 ${errors.lastName && touched.lastName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="email" />

                    </div>
                  </div>
                </div>
                <div className="flex py-10">
                  <div className="w-1/5">
                    <span>Contact Details</span>
                  </div>
                  <div className="w-full ml-8">
                    <div className="flex">
                      <div className="w-6/12 pr-2">
                        <label className="text-miru-dark-purple-1000 font-medium text-sm">LinkedIn</label>
                        <Field className={`w-full mt-2 py-1 ${errors.firstName && touched.firstName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="linkedIn" />
                      </div>
                      <div className="w-6/12 pl-2">
                        <label className="text-miru-dark-purple-1000 font-medium text-sm">Github</label>
                        <Field className={`w-full mt-2 py-1 ${errors.lastName && touched.lastName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="github" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          );
        }
        }
      </Formik>

    </Fragment >
  );
};

export default FormPage;
