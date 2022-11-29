import React, { useState } from "react";

import { Formik, Form, Field, FormikProps } from "formik";
import { XIcon } from "miruIcons";
import * as Yup from "yup";

import teamApi from "apis/team";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";

const TeamMemberSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank"),
});

const getInitialvalues = user => ({
  id: user?.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role ? user.role : "employee",
});

interface FormValues {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}
interface Props {
  user: any;
  isEdit: boolean;
}

const EditClient = ({ user = {}, isEdit = false }: Props) => {
  const [apiError, setApiError] = useState<string>(""); // eslint-disable-line
  const { setModalState } = useList();

  const handleSubmit = async values => {
    const { id, firstName, lastName, email, role } = values;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      role,
    };

    if (isEdit) payload["id"] = id;

    if (!user.isTeamMember) payload["recipient_email"] = email;

    try {
      if (isEdit) {
        if (user.isTeamMember) {
          await teamApi.updateTeamMember(user.id, payload);
        } else {
          await teamApi.updateInvitedMember(user.id, payload);
        }
      } else {
        await teamApi.inviteMember(payload);
      }
      setModalState("");
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center px-4">
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-10 flex items-start justify-center overflow-auto"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)",
        }}
      >
        <div className="relative h-full w-full px-4 md:flex md:items-center md:justify-center">
          <div className="modal-width transform rounded-lg bg-white px-6 pb-6 shadow-xl transition-all sm:max-w-md sm:align-middle">
            <div className="mt-6 flex items-center justify-between">
              <h6 className="text-base font-extrabold">
                {isEdit
                  ? user.isTeamMember
                    ? "Edit User Details"
                    : "Edit Invitation"
                  : "Create New User"}
              </h6>
              <button
                type="button"
                onClick={() => {
                  setModalState(TeamModalType.NONE);
                }}
              >
                <XIcon color="#CDD6DF" size={16} weight="bold" />
              </button>
            </div>
            <Formik
              initialValues={getInitialvalues(user)}
              validationSchema={TeamMemberSchema}
              onSubmit={handleSubmit}
            >
              {(props: FormikProps<FormValues>) => {
                const { touched, errors, isValid, dirty } = props;

                return (
                  <Form>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Name</label>
                        </div>
                        <div className="flex">
                          <div className="mt-1">
                            <Field
                              data-cy="new-member-firstName"
                              name="firstName"
                              placeholder="First Name"
                              className={`form__input ${
                                errors.firstName &&
                                touched.firstName &&
                                "border-red-600 focus:border-red-600 focus:ring-red-600"
                              } `}
                            />
                            <div className="block flex text-xs tracking-wider text-red-600">
                              {errors.firstName && touched.firstName && (
                                <div>{errors.firstName}</div>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 ml-8">
                            <Field
                              data-cy="new-member-lastName"
                              name="lastName"
                              placeholder="Last Name"
                              className={`form__input ${
                                errors.lastName &&
                                touched.lastName &&
                                "border-red-600 focus:border-red-600 focus:ring-red-600"
                              } `}
                            />
                            <div className="block flex text-xs tracking-wider text-red-600">
                              {errors.lastName && touched.lastName && (
                                <div className="ml-2">{errors.lastName}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Email</label>
                        </div>
                        <div className="mt-1">
                          <Field
                            data-cy="new-member-email"
                            disabled={isEdit}
                            name="email"
                            placeholder="Enter email ID"
                            className={`form__input disabled:opacity-50 ${
                              errors.email &&
                              touched.email &&
                              "border-red-600 focus:border-red-600 focus:ring-red-600"
                            } `}
                          />
                          <div className="block text-xs tracking-wider text-red-600">
                            {errors.email && touched.email && (
                              <div>{errors.email}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="field">
                        <label className="form__label block text-xs font-normal tracking-wider text-miru-dark-purple-1000">
                          Role
                        </label>
                        <div className="mt-1 flex">
                          <div className="sm:space-XIcon-10 space-y-4 sm:flex sm:items-center sm:space-y-0">
                            <div className="flex items-center">
                              <Field
                                className="custom__radio hidden"
                                id="role-1"
                                name="role"
                                type="radio"
                                value="admin"
                              />
                              <label
                                className="flex cursor-pointer items-center text-xl"
                                data-cy="admin-radio-button"
                                htmlFor="role-1"
                              >
                                <i className="custom__radio-text" />
                                <span className="text-sm">Admin</span>
                              </label>
                            </div>
                            <div className="ml-8 flex items-center">
                              <Field
                                className="custom__radio hidden"
                                id="role-2"
                                name="role"
                                type="radio"
                                value="employee"
                              />
                              <label
                                className="flex cursor-pointer items-center text-xl"
                                data-cy="employee-radio-button"
                                htmlFor="role-2"
                              >
                                <i className="custom__radio-text" />
                                <span className="text-sm">Employee</span>
                              </label>
                            </div>
                            <div className="ml-8 flex items-center">
                              <Field
                                className="custom__radio hidden"
                                id="role-3"
                                name="role"
                                type="radio"
                                value="book_keeper"
                              />
                              <label
                                className="flex cursor-pointer items-center text-xl"
                                htmlFor="role-3"
                              >
                                <i className="custom__radio-text" />
                                <span className="text-sm">Book Keeper</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-7 block text-xs tracking-wider text-red-600">
                      {apiError}
                    </p>
                    <div className="actions mt-4">
                      <button
                        data-cy="send-invite-button"
                        disabled={!(dirty && isValid)}
                        name="commit"
                        type="submit"
                        className={
                          !isValid || !dirty
                            ? "focus:outline-none flex h-10 w-full justify-center rounded border border-transparent bg-miru-gray-1000 py-1 px-4 font-sans text-base font-medium tracking-widest text-miru-white-1000 shadow-sm"
                            : "form__input_submit"
                        }
                      >
                        {isEdit ? "SAVE CHANGES" : "SEND INVITE"}
                      </button>
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
