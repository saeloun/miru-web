import React, { useState } from "react";

import { TeamModalType } from "constants/index";

import { Formik, Form, Field, FormikProps } from "formik";
import { X } from "phosphor-react";
import * as Yup from "yup";

import teamApi from "apis/team";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

const TeamMemberSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  email: Yup.string()
    .email("Invalid email ID")
    .required("Email ID cannot be blank")
});

const getInitialvalues = (user) => ({
  id: user?.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role ? user.role : "employee",
  teamLead: user.teamLead ? 'true' : 'false',
  departmentId: user.department?.id,
});

interface FormValues {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  role: string;
  teamLead: string;
}
interface Props {
  user: any;
  isEdit: boolean;
}

const EditClient = ({ user = {}, isEdit = false }: Props) => {
  const { isAdminUser, user: currentUser } = useUserContext();
  const [apiError, setApiError] = useState<string>(""); // eslint-disable-line
  const { setModalState, departments } = useList();

  const handleSubmit = async (values) => {
    const { id, firstName, lastName, email, role, teamLead, departmentId } = values;
    const payload = {
      first_name: firstName,
      last_name: lastName,
      email,
      role,
      team_lead: teamLead === 'true',
      department_id: departmentId || currentUser['department_id'],
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
              <h6 className="text-base font-extrabold">
                {isEdit
                  ? user.isTeamMember
                    ? "Edit User Details"
                    : "Edit Invitation"
                  : "Create Invitation"}
              </h6>
              <button
                type="button"
                onClick={() => {
                  setModalState(TeamModalType.NONE);
                }}
              >
                <X size={16} color="#CDD6DF" weight="bold" />
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
                              className={`form__input ${
                                errors.firstName &&
                                touched.firstName &&
                                "border-red-600 focus:ring-red-600 focus:border-red-600"
                              } `}
                              data-cy="new-member-firstName"
                              name="firstName"
                              placeholder="First Name"
                            />
                            <div className="tracking-wider block text-xs text-red-600 flex">
                              {errors.firstName && touched.firstName && (
                                <div>{errors.firstName}</div>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 ml-8">
                            <Field
                              className={`form__input ${
                                errors.lastName &&
                                touched.lastName &&
                                "border-red-600 focus:ring-red-600 focus:border-red-600"
                              } `}
                              data-cy="new-member-lastName"
                              name="lastName"
                              placeholder="Last Name"

                            />
                            <div className="tracking-wider block text-xs text-red-600 flex">
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
                            className={`form__input disabled:opacity-50 ${
                              errors.email &&
                              touched.email &&
                              "border-red-600 focus:ring-red-600 focus:border-red-600"
                            } `}
                            name="email"
                            disabled={isEdit}
                            data-cy="new-member-email"
                            placeholder="Enter email ID"
                          />
                          <div className="tracking-wider block text-xs text-red-600">
                            {errors.email && touched.email && (
                              <div>{errors.email}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    { isAdminUser && <div className="mt-4">
                      <div className="field">
                        <label className="form__label">
                            Role
                        </label>
                        <div className="mt-1 flex">
                          <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                            <div className="flex items-center">
                              <Field
                                type="radio"
                                id="role-1"
                                name="role"
                                className="hidden custom__radio"
                                value="admin"
                              />
                              <label
                                data-cy="admin-radio-button"
                                htmlFor="role-1"
                                className="flex items-center cursor-pointer text-xl"
                              >
                                <i className="custom__radio-text"></i>
                                <span className="text-sm">Admin</span>
                              </label>
                            </div>
                            <div className="flex items-center ml-8">
                              <Field
                                type="radio"
                                id="role-2"
                                name="role"
                                className="hidden custom__radio"
                                value="employee"
                              />
                              <label
                                data-cy="employee-radio-button"
                                htmlFor="role-2"
                                className="flex items-center cursor-pointer text-xl"
                              >
                                <i className="custom__radio-text"></i>
                                <span className="text-sm">Employee</span>
                              </label>
                            </div>
                            <div className="flex items-center ml-8">
                              <Field
                                type="radio"
                                id="role-3"
                                name="role"
                                className="hidden custom__radio"
                                value="book_keeper"
                              />
                              <label
                                htmlFor="role-3"
                                className="flex items-center cursor-pointer text-xl"
                              >
                                <i className="custom__radio-text"></i>
                                <span className="text-sm">Book Keeper</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    }
                    { isAdminUser && <div className="mt-4">
                      <div className="field">
                        <label className="form__label">
                            Team Lead
                        </label>
                        <div className="mt-1 flex">
                          <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-10">
                            <div className="flex items-center">
                              <Field
                                type="radio"
                                id="team-lead-1"
                                name="teamLead"
                                className="hidden custom__radio"
                                value='false'
                              />
                              <label
                                htmlFor="team-lead-1"
                                className="flex items-center cursor-pointer text-xl"
                              >
                                <i className="custom__radio-text"></i>
                                <span className="text-sm">No</span>
                              </label>
                            </div>
                            <div className="flex items-center ml-8">
                              <Field
                                type="radio"
                                id="team-lead-2"
                                name="teamLead"
                                className="hidden custom__radio"
                                value='true'
                              />
                              <label
                                htmlFor="team-lead-2"
                                className="flex items-center cursor-pointer text-xl"
                              >
                                <i className="custom__radio-text"></i>
                                <span className="text-sm">Yes</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    }
                    { isAdminUser && <div className="mt-4">
                      <div className="field">
                        <div className="field_with_errors">
                          <label className="form__label">Department</label>
                        </div>
                        <div className="mt-1">
                          <Field
                            className="form__input"
                            name="departmentId"
                            as="select"
                          >
                            <option key={null} value={""}>Please select</option>
                            {departments.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </Field>
                        </div>
                      </div>
                    </div>
                    }
                    <p className="tracking-wider mt-7 block text-xs text-red-600">
                      {apiError}
                    </p>
                    <div className="actions mt-4">
                      <button
                        type="submit"
                        name="commit"
                        data-cy="send-invite-button"
                        disabled={!(dirty && isValid)}
                        className={
                          !isValid || !dirty
                            ? "tracking-widest h-10 w-full flex justify-center py-1 px-4 border border-transparent shadow-sm text-base font-sans font-medium text-miru-white-1000 bg-miru-gray-1000 focus:outline-none rounded"
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
