import React from "react";

import dayjs from "dayjs";
import { GlobeIcon, InfoIcon, MapPinIcon, PhoneIcon } from "miruIcons";

import { Divider } from "common/Divider";
import { InfoDescription } from "common/Mobile/InfoDescription";

const MobilePersonalDetails = ({ personalDetails }) => (
  <div className="mt-12 px-4 py-2">
    <div className="py-4">
      <span className="flex flex-row items-center px-1 text-sm font-medium text-miru-dark-purple-1000">
        <InfoIcon className="mr-2" color="#1D1A31" size={13.5} /> Basic Details
      </span>
      <div className="mt-2 flex w-full flex-row">
        <div className="w-1/2 px-1">
          <InfoDescription
            description={`${personalDetails.first_name} ${personalDetails.last_name}`}
            title="Name"
          />
        </div>
        <div className="w-1/2 px-1">
          <InfoDescription
            title="Date of Birth"
            description={`${
              personalDetails.date_of_birth &&
              dayjs(personalDetails.date_of_birth, "YYYY-MM-DD").format(
                "MM.DD.YYYY"
              )
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
          <InfoDescription
            description={personalDetails.phone_number}
            title="Phone Number"
          />
        </div>
        <div className="w-1/2 px-1">
          <InfoDescription
            description={personalDetails.email_id}
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
          {personalDetails.addresses && (
            <InfoDescription
              title="Address"
              description={`${personalDetails.addresses.address_line_1},
                  ${personalDetails.addresses.address_line_2}
                  ${personalDetails.addresses.city},
                  ${personalDetails.addresses.state},
                  ${personalDetails.addresses.country} -
                  ${personalDetails.addresses.pin}`}
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
            description={personalDetails.linkedin}
            title="LinkedIn"
          />
        </div>
        <div className="w-1/2 px-2">
          <InfoDescription
            description={personalDetails.github}
            title="Github"
          />
        </div>
      </div>
    </div>
  </div>
);

export default MobilePersonalDetails;
