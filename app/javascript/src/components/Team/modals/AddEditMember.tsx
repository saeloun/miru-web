
import React, { useState } from "react";
import { post, put } from "apis/team";
import { useList } from "context/TeamContext";
import { Formik, Form, Field, FormikProps } from "formik";
import { X } from "phosphor-react";
import * as Yup from "yup";

const TeamMemberSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  email: Yup.string().email("Invalid email ID").required("Email ID cannot be blank")
});

const getInitialvalues = (user) => ({
  id: user?.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role ? user.role : "employee"
});

interface FormValues {
  id?: string
  firstName: string,
  lastName: string,
  email: string,
  role: string
}
interface Props {
  user: any,
  isEdit: boolean
}

const EditClient = ({
  user = {},
  isEdit = false
}: Props) => {

  const [apiError, setApiError] = useState<string>(""); // eslint-disable-line
  const { setModalState } = useList();

  const handleSubmit = async values => {
    const { id, firstName, lastName, email, role } = values;
    const payload = {
      firstName,
      lastName,
      email,
      role
    };
    if (isEdit) {
      payload["id"] = id;
    }
    try {
      if (isEdit) {
        await put(user.id, payload);
      } else {
        await post(payload);
      }
      setModalState("");
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">{isEdit ? "Edit Member": "Add Member"}</h6>
              <button type="button" onClick={() => { setModalState(""); }}>
                <X size={16} color="#CDD6DF" weight="bold" />
              </button>
            </div>
            <Formik
              initialValues={getInitialvalues(user)}
              validationSchema={TeamMemberSchema}
              onSubmit={handleSubmit}
            >
              {(props: FormikProps<FormValues>) => {
                const { touched, errors } = props;
                return (
                  <Form>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Name</label>
                          <div className="tracking-wider block text-xs text-red-600 flex">
                            {errors.firstName && touched.firstName &&
                              <div>{errors.firstName}</div>
                            }
                            {errors.lastName && touched.lastName &&
                              <div className="ml-2">{errors.lastName}</div>
                            }
                          </div>
                        </div>
                        <div className="flex">
                          <div className="mt-1">
                            <Field className={`form__input ${errors.firstName && touched.firstName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="firstName" disabled={isEdit} />
                          </div>
                          <div className="mt-1 ml-8">
                            <Field className={`form__input ${errors.lastName && touched.lastName && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="lastName" disabled={isEdit} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Email</label>
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.email && touched.email &&
                              <div>{errors.email}</div>
                            }
                          </div>
                        </div>
                        <div className="mt-1">
                          <Field className={`form__input ${errors.email && touched.email && "border-red-600 focus:ring-red-600 focus:border-red-600"} `} name="email" disabled={isEdit} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <label className="form__label">Role</label>
                        <div className="mt-1 flex">
                          <div className="flex items-center">
                            <Field type="radio" id="role-1" name="role" className="hidden custom__radio" value="admin" />
                            <label htmlFor="role-1" className="flex items-center cursor-pointer text-xl">
                              <i className="custom__radio-text"></i>
                              <span className="text-sm">Admin</span>
                            </label>
                          </div>
                          <div className="flex items-center ml-8">
                            <Field type="radio" id="role-2" name="role" className="hidden custom__radio" value="employee" />
                            <label htmlFor="role-2" className="flex items-center cursor-pointer text-xl">
                              <i className="custom__radio-text"></i>
                              <span className="text-sm">Employee</span>
                            </label>
                          </div>
                          <div className="flex items-center">
                            <Field type="radio" id="role-1" name="role" className="hidden custom__radio" value="book_keeper" />
                            <label htmlFor="role-1" className="flex items-center cursor-pointer text-xl">
                              <i className="custom__radio-text"></i>
                              <span className="text-sm">Book Keeper</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="tracking-wider mt-7 block text-xs text-red-600">{apiError}</p>
                    <div className="actions mt-4">
                      <input
                        type="submit"
                        name="commit"
                        value="SAVE CHANGES"
                        className="form__input_submit"
                      />
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
