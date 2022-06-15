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
      .required("Field can not be empty")
  });

  const handleCountChange = (value) => {
    const count = value.membersCount;
    setTeamMembersCount(count);
    setPlanTotal(count * TEAM_MEMBER_CHARGE + BASIC_PLAN_CHARGE);
  };

  return (
    <div className="modal__modal main-modal font-manrope bg-miru-dark-purple-1000">
      <div className="modal__container modal-container  w-96">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title"> Plan Details</h6>
          </div>

          <div className="modal__form flex-col">
            <div className="field mt-4 flex justify-between bg-red">
              <div className="field_with_errors py-2">
                <label className="font-normal text-xs leading-4 text-miru-dark-purple-1000">
                  Number of Team Members
                </label>
              </div>
              <Formik
                initialValues={{
                  membersCount: 1
                }}
                validationSchema={membersCountSchema}
                validateOnChange={true}
                onSubmit={(values) => handleCountChange(values)}
              >
                {({ errors, touched }) => (
                  <Form className="w-1/2">
                    <Field
                      name="membersCount"
                      type="text"
                      className="px-3 w-full h-8 rounded appearance-none border-0 block bg-miru-gray-100 font-medium leading-4 text-sm text-miru-dark-purple-1000 text-right focus:outline-none"
                    />
                    {errors.membersCount && touched.membersCount ? (
                      <div className="mt-2 font-normal text-xs leading-4 text-miru-chart-pink-600">
                        {errors.membersCount}
                      </div>
                    ) : null}
                  </Form>
                )}
              </Formik>
            </div>

            <div className="my-6 p-4 bg-miru-gray-100">
              <div className="pb-4 border-b-2 border-miru-gray-400">
                <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-1000">
                  Plan
                </h5>
                <div className="mt-2 flex justify-between">
                  <div className="w-3/4 text-left">
                    <h1 className="pb-1 font-semibold text-base leading-5 text-miru-dark-purple-1000">
                      Basic plan
                    </h1>
                    <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-400">
                      Basic plan includes all features.
                      <br />
                      This is a one-time charge.
                    </h5>
                  </div>
                  <div className="text-right">
                    <h3 className="pb-1 font-bold text-base leading-5 text-miru-dark-purple-1000">
                      ${BASIC_PLAN_CHARGE}
                    </h3>
                    <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-400">
                      charged <br /> once
                    </h5>
                  </div>
                </div>
              </div>

              <div className="py-4 border-b-2 border-miru-gray-400">
                <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-1000">
                  Add-Ons
                </h5>
                <div className="mt-2 flex justify-between">
                  <div className="w-3/4 text-left">
                    <h1 className="pb-1 font-semibold text-base leading-5 text-miru-dark-purple-1000">
                      {teamMembersCount} team{" "}
                      {teamMembersCount === 1 ? "member" : "members"}
                    </h1>
                    <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-400">
                      Basic plan comes with additional <br /> 5$ per user per
                      month
                    </h5>
                  </div>
                  <div className="text-right">
                    <h3 className="pb-1 font-bold text-base leading-5 text-miru-dark-purple-1000">
                      {teamMembersCount * TEAM_MEMBER_CHARGE}$/mo
                    </h3>
                    <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-400">
                      charged <br /> every month
                    </h5>
                  </div>
                </div>
              </div>

              <div className="py-6 flex justify-between">
                <h5 className="font-bold text-2xl leading-8 text-miru-dark-purple-1000">
                  Total
                </h5>
                <div className="text-right">
                  <h3 className="pb-1 font-bold text-2xl leading-8 text-miru-dark-purple-1000">
                    {planTotal}$
                  </h3>
                  <h5 className="font-normal text-xs leading-4 text-miru-dark-purple-400">
                    plus taxes
                  </h5>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                type="submit"
                className="tracking-widest h-10 w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-base font-manrope font-bold text-miru-white-1000 bg-miru-han-purple-1000 hover:bg-miru-han-purple-600 focus:outline-none rounded cursor-pointer"
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
