import React from "react";

import { ProjectsIcon } from "miruIcons";

import { getLabelForEmployeeType } from "./helpers";

const StaticPage = ({ employmentDetails }) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-4 lg:px-10">
    <div className="border-b border-b-miru-gray-400 py-10 lg:flex">
      <div className="flex py-5 lg:w-1/5 lg:py-0 lg:pr-4">
        <ProjectsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="flex flex-wrap text-sm font-medium text-miru-dark-purple-1000">
          Current Employment
        </span>
      </div>
      <div className="lg:w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Employee ID
            </span>
            <p className="text-miru-dark-purple-1000">
              {employmentDetails.current_employment.employee_id || "-"}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Designation
            </span>
            <p className="text-miru-dark-purple-1000">
              {employmentDetails.current_employment.designation || "-"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Email ID (Official)
            </span>
            <p className="text-miru-dark-purple-1000">
              {employmentDetails.current_employment.email || "-"}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Employee Type
            </span>
            <p className="text-miru-dark-purple-1000">
              {getLabelForEmployeeType(
                employmentDetails.current_employment.employment_type
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Joining
            </span>
            <p className="text-miru-dark-purple-1000">
              {employmentDetails.current_employment.joined_at || "-"}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Resignation
            </span>
            <p className="text-miru-dark-purple-1000">
              {employmentDetails.current_employment.resigned_at || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="py-10 lg:flex">
      <div className="flex py-5 lg:w-1/5 lg:py-0 lg:pr-4">
        <ProjectsIcon
          className="mr-4 mt-1 text-miru-dark-purple-1000"
          size={16}
          weight="bold"
        />
        <span className="flex flex-wrap text-sm font-medium text-miru-dark-purple-1000">
          Previous Employment
        </span>
      </div>
      <div className="flex w-4/5 flex-col items-center justify-center">
        {employmentDetails?.previous_employments[0]?.company_name ? (
          employmentDetails.previous_employments.map((previous, index) => (
            <div className="mb-4 flex w-full" key={index}>
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">
                  Company
                </span>
                <p className="text-miru-dark-purple-1000">
                  {previous.company_name}
                </p>
              </div>
              <div className="w-6/12">
                <span className="text-xs text-miru-dark-purple-1000">Role</span>
                <p className="text-miru-dark-purple-1000">{previous.role}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs">No previous employments found</div>
        )}
      </div>
    </div>
  </div>
);
export default StaticPage;
