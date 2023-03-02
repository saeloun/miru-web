import React from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  InfoIcon,
  MapPinIcon,
  MoneyIcon,
  PhoneIcon,
  CalendarIcon,
} from "miruIcons";

dayjs.extend(customParseFormat);

const StaticPage = ({
  orgDetails: {
    logoUrl,
    companyName,
    companyAddr,
    companyPhone,
    countryName, //eslint-disable-line
    companyCurrency,
    companyRate,
    companyFiscalYear,
    companyDateFormat,
    companyTimezone,
  },
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <InfoIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />{" "}
          Basic Details
        </span>
      </div>
      <div className="w-72">
        <div className="flex h-120 w-30 flex-col items-center justify-center rounded border-miru-dark-purple-100 px-2 text-center text-xs">
          {logoUrl ? (
            <img alt="org_logo" className="h-full min-w-full" src={logoUrl} />
          ) : (
            <div className="flex h-120 w-30 items-center justify-center rounded-full bg-miru-gray-1000 text-5xl font-bold capitalize text-white">
              {companyName?.substring(0, 1)}
            </div>
          )}
        </div>
        <div className="mt-3 flex px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Company Name
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">{companyName}</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <PhoneIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Contact Details
        </span>
      </div>
      <div className="w-72">
        <div className="flex px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Business Phone
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {companyPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <MapPinIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Address
        </span>
      </div>
      <div className="w-72">
        <div className="flex w-full flex-col">
          <span className="text-xs text-miru-dark-purple-1000">Address</span>
          <p className="text-miru-dark-purple-1000">{companyAddr}</p>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <span className="mr-2 w-13">
            <MoneyIcon color="#1D1A31" size={13.5} weight="bold" />
          </span>
          Currency and Standard Rate
        </span>
      </div>
      <div className="w-72">
        <div className="flex px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Base Currency
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {companyCurrency}
            </p>
          </div>
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Standard Rate
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">{companyRate}</p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-8">
      <div className="w-18">
        <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <CalendarIcon
            className="mr-2"
            color="#1D1A31"
            size={13.5}
            weight="bold"
          />
          Date & Time
        </span>
      </div>
      <div className="w-72">
        <div className="flex px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">Timezone</span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {companyTimezone}
            </p>
          </div>
        </div>
        <div className="mt-3 flex px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Date format
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {companyDateFormat}
            </p>
          </div>
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Fiscal Year End
            </span>
            <p className="min-h-24 text-miru-dark-purple-1000">
              {companyFiscalYear}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
