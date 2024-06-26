import React from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { InfoIcon, KeyIcon, PhoneIcon, MapPinIcon, GlobeIcon } from "miruIcons";

dayjs.extend(customParseFormat);
const StaticPage = ({
  personalDetails,
  handleEditClick,
  isCalledFromSettings,
}) => (
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
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Date of Birth
            </span>
            <p className="text-miru-dark-purple-1000">
              {personalDetails.date_of_birth}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <PhoneIcon className="mr-2" color="#1D1A31" size={13.5} />
          Contact Details
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Phone Number
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {personalDetails.phone_number}
            </p>
          </div>
          <div className="w-6/12">
            <span className="text-xs text-miru-dark-purple-1000">
              Email ID (Personal)
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {personalDetails.email_id}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-1/5 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <MapPinIcon className="mr-2" color="#1D1A31" size={13.5} />
          Address
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-full">
            <span className="text-xs text-miru-dark-purple-1000">Address</span>
            <p className="text-miru-dark-purple-1000">
              {personalDetails.addresses && (
                <>
                  {personalDetails.addresses.address_line_1},
                  {personalDetails.addresses.address_line_2}
                  {personalDetails.addresses.city},
                  {personalDetails.addresses.state},
                  {personalDetails.addresses.country} -
                  {personalDetails.addresses.pin}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-1/5 pr-4">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <GlobeIcon className="mr-2" color="#1D1A31" size={13.5} />
          Social Profiles
        </span>
      </div>
      <div className="w-4/5">
        <div className="flex">
          <div className="w-6/12 break-all pr-4">
            <span className="text-xs text-miru-dark-purple-1000">LinkedIn</span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {personalDetails.linkedin}
            </p>
          </div>
          <div className="w-6/12 break-all pr-4">
            <span className="text-xs text-miru-dark-purple-1000">Github</span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {personalDetails.github}
            </p>
          </div>
        </div>
      </div>
    </div>
    {isCalledFromSettings && (
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
    )}
  </div>
);

export default StaticPage;
