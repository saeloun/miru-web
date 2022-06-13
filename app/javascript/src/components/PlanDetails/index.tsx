import React, { useState } from "react";
import { ToastContainer } from "react-toastify";

import Toastr from "common/Toastr";

const PlanDetails = () => {
  const [teamMembersCount, setTeamMembersCount] = useState<number>(1);
  const [planTotal, setPlanTotal] = useState<number>(15);

  const handleCountChange = (e) => {
    if (e.target.value) {
      const count = parseInt(e.target.value);
      if (isNaN(count)) {
        Toastr.error("Please enter valid data");
        setTeamMembersCount(1);
        setPlanTotal(15);
      } else if (count == 0) {
        Toastr.error("Number of team members can not be zero");
        setTeamMembersCount(1);
        setPlanTotal(15);
      } else {
        setTeamMembersCount(count);
        setPlanTotal(count * 5 + 10);
      }
    } else {
      setTeamMembersCount(e.target.value);
      setPlanTotal(10);
    }
  };

  return (
    <div className="modal__modal main-modal font-manrope bg-miru-dark-purple-1000">
      <ToastContainer />
      <div className="modal__container modal-container  w-96">
        <div className="modal__content modal-content">
          <div className="modal__position">
            <h6 className="modal__title"> Plan Details</h6>
          </div>

          <div className="modal__form flex-col">
            <div className="field mt-4 flex justify-between">
              <div className="field_with_errors py-2">
                <label className="font-normal text-xs leading-4 text-miru-dark-purple-1000">
                  Number of Team Members
                </label>
              </div>
              <input
                type="text"
                value={teamMembersCount}
                onChange={(e) => {
                  handleCountChange(e);
                }}
                className="px-3 w-1/2 h-8 rounded appearance-none border-0 block bg-miru-gray-100 font-medium leading-4 text-sm text-miru-dark-purple-1000 text-right focus:outline-none"
              />
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
                      $10
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
                      {teamMembersCount * 5}$/mo
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
