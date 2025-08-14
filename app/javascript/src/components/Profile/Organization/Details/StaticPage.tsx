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
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";

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
    countryName,
    companyCurrency,
    companyRate,
    companyFiscalYear,
    companyDateFormat,
    companyTimezone,
    companyWorkingHours,
    companyWorkingDays,
  },
}) => (
  <div className="mt-4 space-y-6 px-4 md:px-10 lg:px-0">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <InfoIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Basic Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0">
          <div className="flex-shrink-0">
            <Avatar
              classNameImg="h-full min-w-full"
              classNameInitials="text-4xl font-bold capitalize text-white"
              classNameInitialsWrapper="bg-miru-gray-1000"
              initialsLetterCount={1}
              name={companyName}
              size="h-20 w-20 lg:h-24 lg:w-24"
              url={logoUrl}
            />
          </div>
          <div className="flex-1">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-miru-dark-purple-600">
                Company Name
              </span>
              <p className="text-base font-medium text-miru-dark-purple-1000">
                {companyName}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <PhoneIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Contact Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <span className="text-sm font-semibold text-miru-dark-purple-600">
            Business Phone
          </span>
          <p className="text-base font-medium text-miru-dark-purple-1000">
            {companyPhone || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <MapPinIcon
            className="mr-2"
            color="#1D1A31"
            size={16}
            weight="bold"
          />
          Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <span className="text-sm font-semibold text-miru-dark-purple-600">
            Address
          </span>
          <p className="text-base font-medium text-miru-dark-purple-1000">
            {companyAddr || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <MoneyIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Currency and Standard Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Base Currency
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyCurrency || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Standard Rate
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyRate || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <CalendarIcon
            className="mr-2"
            color="#1D1A31"
            size={16}
            weight="bold"
          />
          Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Timezone
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyTimezone || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Date Format
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyDateFormat || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Fiscal Year End
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {getFilterValue(companyFiscalYear) || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-miru-dark-purple-1000">
          <ClockIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Working Days & Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Weekly Working Days
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyWorkingDays || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-miru-dark-purple-600">
              Weekly Working Hours
            </span>
            <p className="text-base font-medium text-miru-dark-purple-1000">
              {companyWorkingHours || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default StaticPage;
