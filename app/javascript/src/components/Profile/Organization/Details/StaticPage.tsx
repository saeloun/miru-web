import React from "react";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  InfoIcon,
  MapPinIcon,
  MoneyIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
} from "miruIcons";
import { Avatar } from "StyledComponents";

dayjs.extend(customParseFormat);

const fiscalYearOptions = [
  {
    label: "December",
    value: "Dec",
  },
  {
    label: "March",
    value: "Mar",
  },
  {
    label: "September",
    value: "Sep",
  },
];

const getFilterValue = companyFiscalYear => {
  if (companyFiscalYear) {
    const fiscalYear = fiscalYearOptions.find(
      item => item.value === companyFiscalYear
    );

    return fiscalYear ? fiscalYear.label : "";
  }

  return "";
};

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
    companyWorkingHours,
    companyWorkingDays,
  },
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-4 md:min-h-screen md:px-10 lg:min-h-full">
    <div className="flex flex-col gap-y-6 border-b border-b-miru-gray-400 py-6 md:flex-row md:py-8 md:px-2 lg:gap-y-0 lg:px-0">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center font-manrope text-sm font-medium leading-5 text-miru-dark-purple-1000">
          <div>
            <InfoIcon
              className="mr-2"
              color="#1D1A31"
              size={13.5}
              weight="bold"
            />
          </div>
          <p>Basic Details</p>
        </div>
      </div>
      <div className="w-72">
        <div className="mb-6 flex h-20 w-20 flex-col items-start rounded border-miru-dark-purple-100 text-center text-xs lg:mb-0 lg:h-120 lg:w-30 lg:items-center lg:justify-center lg:px-2">
          <Avatar
            classNameImg="h-full min-w-full"
            classNameInitials="text-4xl lg:text-5xl lg:font-bold capitalize text-white"
            classNameInitialsWrapper="bg-miru-gray-1000"
            initialsLetterCount={1}
            name={companyName}
            size="h-20 w-20 lg:h-30 lg:w-30"
            url={logoUrl}
          />
        </div>
        <div className="flex p-0 lg:mt-3 lg:px-2">
          <div className="flex w-6/12 flex-col">
            <span className="pb-1 font-manrope text-xs font-normal leading-4 text-miru-dark-purple-1000 md:pb-0">
              Company Name
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyName}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-start gap-y-6 border-b border-b-miru-gray-400 py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center font-manrope text-sm font-medium text-miru-dark-purple-1000 md:items-baseline lg:items-center">
          <div className="relative top-0 md:top-0.25 lg:top-0">
            <PhoneIcon
              className="mr-2"
              color="#1D1A31"
              size={13.5}
              weight="bold"
            />
          </div>
          <p>Contact Details</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex md:px-2">
          <div className="flex w-6/12 flex-col">
            <p className="pb-1 text-xs text-miru-dark-purple-1000 md:pb-0">
              Business Phone
            </p>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-miru-gray-400 py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <div>
            <MapPinIcon
              className="mr-2"
              color="#1D1A31"
              size={13.5}
              weight="bold"
            />
          </div>
          <p>Address</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex w-full flex-col md:px-2">
          <span className="pb-1 text-xs text-miru-dark-purple-1000 md:pb-0">
            Address
          </span>
          <p className="font-manrope text-base font-medium text-miru-dark-purple-1000">
            {companyAddr}
          </p>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-miru-gray-400 py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-baseline text-sm font-medium text-miru-dark-purple-1000">
          <span className="mr-2 w-13">
            <div className="relative top-0.25">
              <MoneyIcon color="#1D1A31" size={13.5} weight="bold" />
            </div>
          </span>
          <p>Currency and Standard Rate</p>
        </div>
      </div>
      <div className="w-72">
        <div className="flex md:px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Base Currency
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyCurrency}
            </p>
          </div>
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Standard Rate
            </span>
            <p className="min-h-24 font-manrope text-base font-medium  text-miru-dark-purple-1000">
              {companyRate}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 border-b border-b-miru-gray-400 py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <div>
            <CalendarIcon
              className="mr-2"
              color="#1D1A31"
              size={13.5}
              weight="bold"
            />
          </div>
          <p>Date & Time</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex md:px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">Timezone</span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyTimezone}
            </p>
          </div>
        </div>
        <div className="mt-6 flex md:mt-3 md:px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Date format
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyDateFormat}
            </p>
          </div>
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Fiscal Year End
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {getFilterValue(companyFiscalYear)}
            </p>
          </div>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-y-6 py-6 md:flex-row md:gap-y-0 md:py-8">
      <div className="w-full md:w-18">
        <div className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
          <div>
            <ClockIcon
              className="mr-2"
              color="#1D1A31"
              size={13.5}
              weight="bold"
            />
          </div>
          <p>Days & Hours</p>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="flex md:px-2">
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Weekly working days
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyWorkingDays || "-"}
            </p>
          </div>
          <div className="flex w-6/12 flex-col">
            <span className="text-xs text-miru-dark-purple-1000">
              Weekly working hours
            </span>
            <p className="min-h-24 font-manrope text-base font-medium text-miru-dark-purple-1000">
              {companyWorkingHours || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
