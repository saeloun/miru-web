import React from "react";

import dayjs from "dayjs";
import { GlobeIcon, InfoIcon, MapPinIcon, PhoneIcon } from "miruIcons";

import { Divider } from "common/Divider";
import { InfoDescription } from "common/Mobile/InfoDescription";

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
}) => (
  <div className="mt-12 px-4 py-2">
    <div className="py-4">
      <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
        <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic Details
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
              date_of_birth && dayjs(date_of_birth).format(date_format)
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
          <InfoDescription description={email_id} title="Email ID (Personal)" />
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
              description={`${
                addresses.address_line_1 ? `${addresses.address_line_1},` : ""
              }
            ${addresses.address_line_2 ? `${addresses.address_line_2},` : ""}
            ${addresses.city ? `${addresses.city},` : ""}
            ${addresses.state ? `${addresses.state},` : ""}
            ${addresses.country ? `${addresses.country} -` : ""}
            ${addresses.pin ? addresses.pin : ""}`}
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
          <InfoDescription description={linkedin} title="LinkedIn" />
        </div>
        <div className="w-1/2 px-2">
          <InfoDescription description={github} title="Github" />
        </div>
      </div>
    </div>
  </div>
);

export default MobilePersonalDetails;
