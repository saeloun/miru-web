import React from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { InfoIcon, KeyIcon } from "miruIcons";

dayjs.extend(customParseFormat);

const StaticPage = ({ personalDetails, handleEditClick }) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic
          Details
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">Name</span>
            <p className="text-miru-dark-purple-1000">
              {personalDetails.first_name} {personalDetails.last_name}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="flex w-full flex-row py-6">
        <div className="w-2/12 pr-4">
          <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
            <KeyIcon className="mr-2" color="#1D1A31" size={13.5} />
            Password
          </span>
        </div>
        <div className="w-9/12">
          <div className="ml-2">
            <button
              className="cursor-pointer rounded border border-miru-han-purple-600 p-1 text-xs font-bold text-miru-han-purple-600"
              onClick={handleEditClick}
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
