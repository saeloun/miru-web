import React, { useState } from "react";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import { BASIC_PLAN_CHARGE, TEAM_MEMBER_CHARGE } from "../../constants";

const PlanDetails = () => {
  const [teamMembersCount, setTeamMembersCount] = useState<number>(1);
  const [planTotal, setPlanTotal] = useState<number>(
    TEAM_MEMBER_CHARGE + BASIC_PLAN_CHARGE
  );

  const membersCountSchema = Yup.object().shape({
    membersCount: Yup.number()
      .moreThan(0, "Team members can not be 0")
      .typeError("Enter valid data")
      .required("Field can not be empty"),
  });

  const handleCountChange = value => {
    const count = value.membersCount;
    setTeamMembersCount(count);
    setPlanTotal(count * TEAM_MEMBER_CHARGE + BASIC_PLAN_CHARGE);
  };

  return (
    <div className="modal__modal main-modal bg-miru-dark-purple-1000 font-manrope">
      <div className="modal__container modal-container  w-96">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title"> Plan Details</h6>
          </div>
          <div className="modal__form flex-col">
            <div className="field mt-4 flex justify-between">
              <div className="field_with_errors py-2">
                <label className="text-xs font-normal leading-4 text-miru-dark-purple-1000">
                  Number of Team Members
                </label>
              </div>
              <Formik
                validateOnChange
                validationSchema={membersCountSchema}
                initialValues={{
                  membersCount: 1,
                }}
                onSubmit={values => handleCountChange(values)}
              >
                {({ errors, touched }) => (
                  <Form className="w-1/2">
                    <Field
                      className="focus:outline-none block h-8 w-full appearance-none rounded border-0 bg-miru-gray-100 px-3 text-right text-sm font-medium leading-4 text-miru-dark-purple-1000"
                      name="membersCount"
                      type="text"
                    />
                    {errors.membersCount && touched.membersCount ? (
                      <div className="mt-2 text-xs font-normal leading-4 text-miru-chart-pink-600">
                        {errors.membersCount}
                      </div>
                    ) : null}
                  </Form>
                )}
              </Formik>
            </div>
            <div className="my-6 bg-miru-gray-100 p-4">
              <div className="border-b-2 border-miru-gray-400 pb-4">
                <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-1000">
                  Plan
                </h5>
                <div className="mt-2 flex justify-between">
                  <div className="w-3/4 text-left">
                    <h1 className="pb-1 text-base font-semibold leading-5 text-miru-dark-purple-1000">
                      Basic plan
                    </h1>
                    <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-400">
                      Basic plan includes all features.
                      <br />
                      This is a one-time charge.
                    </h5>
                  </div>
                  <div className="text-right">
                    <h3 className="pb-1 text-base font-bold leading-5 text-miru-dark-purple-1000">
                      ${BASIC_PLAN_CHARGE}
                    </h3>
                    <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-400">
                      charged <br /> once
                    </h5>
                  </div>
                </div>
              </div>
              <div className="border-b-2 border-miru-gray-400 py-4">
                <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-1000">
                  Add-Ons
                </h5>
                <div className="mt-2 flex justify-between">
                  <div className="w-3/4 text-left">
                    <h1 className="pb-1 text-base font-semibold leading-5 text-miru-dark-purple-1000">
                      {teamMembersCount} team{" "}
                      {teamMembersCount === 1 ? "member" : "members"}
                    </h1>
                    <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-400">
                      Basic plan comes with additional <br />{" "}
                      {TEAM_MEMBER_CHARGE}$ per user per month
                    </h5>
                  </div>
                  <div className="text-right">
                    <h3 className="pb-1 text-base font-bold leading-5 text-miru-dark-purple-1000">
                      {teamMembersCount * TEAM_MEMBER_CHARGE}$/mo
                    </h3>
                    <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-400">
                      charged <br /> every month
                    </h5>
                  </div>
                </div>
              </div>
              <div className="flex justify-between py-6">
                <h5 className="text-2xl font-bold leading-8 text-miru-dark-purple-1000">
                  Total
                </h5>
                <div className="text-right">
                  <h3 className="pb-1 text-2xl font-bold leading-8 text-miru-dark-purple-1000">
                    {planTotal}$
                  </h3>
                  <h5 className="text-xs font-normal leading-4 text-miru-dark-purple-400">
                    plus taxes
                  </h5>
                </div>
              </div>
            </div>
            <div className="actions">
              <button
                className="focus:outline-none flex h-10 w-full cursor-pointer justify-center rounded border border-transparent bg-miru-han-purple-1000 py-2 px-4 font-manrope text-base font-bold tracking-widest text-miru-white-1000 shadow-sm hover:bg-miru-han-purple-600"
                type="submit"
              >
                REVIEW AND PAY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;
