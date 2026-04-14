import React from "react";

import { Divider } from "common/Divider";
import { InfoDescription } from "common/Mobile/InfoDescription";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { GlobeIcon, InfoIcon, KeyIcon, MapPinIcon, PhoneIcon } from "miruIcons";
import { i18n } from "../../../../i18n";

dayjs.extend(customParseFormat);

const MobilePersonalDetails = ({
  avatarUrl,
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

  const formattedDateOfBirth = date_of_birth
    ? dayjs(
        date_of_birth,
        [date_format, "YYYY-MM-DD", dayjs.ISO_8601],
        true
      ).format(date_format)
    : "";

  return (
    <div className="mt-12 px-4 py-2">
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <InfoIcon className="mr-2" color="#1D1A31" size={13.5} />{" "}
          {i18n.t("profile.basicDetails")}
        </span>
        <div className="px-1 pb-4 pt-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-accent">
            {avatarUrl ? (
              <img
                alt={
                  `${first_name || ""} ${last_name || ""}`.trim() ||
                  i18n.t("profile.profilePhoto")
                }
                className="h-full w-full object-cover"
                src={avatarUrl}
              />
            ) : (
              <span className="text-xl font-semibold text-primary">
                {first_name?.charAt(0)}
                {last_name?.charAt(0)}
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription
              description={`${first_name} ${last_name}`}
              title={i18n.t("name")}
            />
          </div>
          <div className="w-1/2 px-1">
            <InfoDescription
              title={i18n.t("profile.dateOfBirth")}
              description={formattedDateOfBirth}
            />
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <PhoneIcon className="mr-2" color="#1D1A31" size={13.5} />{" "}
          {i18n.t("profile.contactInformation")}
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription
              description={phone_number}
              title={i18n.t("clients.phoneNumber")}
            />
          </div>
          <div className="w-1/2 px-1">
            <InfoDescription
              description={email_id}
              title={i18n.t("profile.personalEmail")}
            />
          </div>
        </div>
      </div>
      <Divider />
      <div className="py-4">
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <MapPinIcon className="mr-2" color="#1D1A31" size={13.5} />{" "}
          {i18n.t("address")}
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="px-1">
            {addresses && (
              <InfoDescription
                title={i18n.t("address")}
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
        <span className="flex flex-row items-center px-1 text-sm font-medium text-foreground">
          <GlobeIcon className="mr-2" color="#1D1A31" size={13.5} />
          {i18n.t("profile.socialProfiles")}
        </span>
        <div className="mt-2 flex w-full flex-row">
          <div className="w-1/2 px-1">
            <InfoDescription
              description={linkedin}
              title={i18n.t("profile.linkedin")}
              wrapperClassName="break-all"
            />
          </div>
          <div className="w-1/2 px-2">
            <InfoDescription
              description={github}
              title={i18n.t("profile.github")}
              wrapperClassName="break-all"
            />
          </div>
        </div>
      </div>
      {isCalledFromSettings && (
        <div className="flex items-center justify-between pr-4">
          <span className="flex flex-row items-center text-sm font-medium text-foreground">
            <KeyIcon className="mr-2" color="#1D1A31" size={13.5} />
            {i18n.t("settings.password")}
          </span>
          <div className="ml-2">
            <button
              className="cursor-pointer p-1 text-xs font-bold text-primary"
              onClick={handleEditClick}
            >
              {i18n.t("settings.changePassword")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePersonalDetails;
