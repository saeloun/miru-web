import React from "react";

import { Divider } from "common/Divider";
import { InfoDescription } from "common/Mobile/InfoDescription";
import dayjs from "dayjs";
import { GlobeIcon, InfoIcon, KeyIcon, MapPinIcon, PhoneIcon } from "miruIcons";

const MobilePersonalDetails = ({
  personalDetails: {
    first_name,
    last_name,
    date_of_birth,
    phone_number,
    email_id,
    addresses,
    linkedin,
    github,
    date_format,
  },
  handleEditClick,
  isCalledFromSettings,
}) => {
  const {
    address_line_1 = "",
    address_line_2 = "",
    city = "",
    state = "",
    country = "",
    pin = "",
  } = addresses || {};

  return (
    <div className="mt-12 px-4 py-2">
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
          <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic
          Details
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription
              description={`${first_name} ${last_name}`}
              title="Name"
            />
          </div>
          <div className="w-1/2 px-1">
            <InfoDescription
              title="Date of Birth"
              description={`${
                date_of_birth &&
                dayjs(date_of_birth, date_format).format(date_format)
              }`}
            />
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
          <PhoneIcon className="mr-2" color="#1D1A31" size={13.5} /> Contact
          Details
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription description={phone_number} title="Phone Number" />
          </div>
          <div className="w-1/2 px-1">
            <InfoDescription
              description={email_id}
              title="Email ID (Personal)"
            />
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
          <MapPinIcon className="mr-2" color="#1D1A31" size={13.5} /> Address
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="px-1">
            {addresses && (
              <InfoDescription
                title="Address"
                description={`${address_line_1},
                  ${address_line_2}
                  ${city},
                  ${state},
                  ${country} -
                  ${pin}`}
              />
            )}
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
          <GlobeIcon className="mr-2" color="#1D1A31" size={13.5} />
          Social Profiles
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription
              description={linkedin}
              title="LinkedIn"
              wrapperClassName="break-all"
            />
          </div>
          <div className="w-1/2 px-2">
            <InfoDescription
              description={github}
              title="Github"
              wrapperClassName="break-all"
            />
          </div>
        </div>
      </div>
      {isCalledFromSettings && (
        <div className="flex items-center justify-between pr-4">
          <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
            <KeyIcon className="mr-2" color="#1D1A31" size={13.5} />
            Password
          </span>
          <div className="ml-2">
            <button
              className="cursor-pointer p-1 text-xs font-bold text-miru-han-purple-600"
              onClick={handleEditClick}
            >
              Change Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePersonalDetails;
