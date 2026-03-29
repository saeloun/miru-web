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
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <InfoIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Basic Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0">
          <div className="flex-shrink-0">
            <Avatar
              classNameImg="h-full min-w-full"
              classNameInitials="text-2xl font-semibold capitalize text-white"
              classNameInitialsWrapper="bg-secondary"
              initialsLetterCount={1}
              name={companyName}
              size="h-20 w-20 lg:h-24 lg:w-24"
              url={logoUrl}
            />
          </div>
          <div className="flex-1">
            <div className="space-y-1">
              <span className="text-sm font-semibold text-muted-foreground">
                Company Name
              </span>
              <p className="text-base font-medium text-foreground">
                {companyName}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <PhoneIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Contact Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <span className="text-sm font-semibold text-muted-foreground">
            Business Phone
          </span>
          <p className="text-base font-medium text-foreground">
            {companyPhone || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
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
          <span className="text-sm font-semibold text-muted-foreground">
            Address
          </span>
          <p className="text-base font-medium text-foreground">
            {companyAddr || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <MoneyIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Currency and Standard Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Base Currency
            </span>
            <p className="text-base font-medium text-foreground">
              {companyCurrency || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Standard Rate
            </span>
            <p className="text-base font-medium text-foreground">
              {companyRate || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
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
            <span className="text-sm font-semibold text-muted-foreground">
              Timezone
            </span>
            <p className="text-base font-medium text-foreground">
              {companyTimezone || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Date Format
            </span>
            <p className="text-base font-medium text-foreground">
              {companyDateFormat || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Fiscal Year End
            </span>
            <p className="text-base font-medium text-foreground">
              {getFilterValue(companyFiscalYear) || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-bold text-foreground">
          <ClockIcon className="mr-2" color="#1D1A31" size={16} weight="bold" />
          Working Days & Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Weekly Working Days
            </span>
            <p className="text-base font-medium text-foreground">
              {companyWorkingDays || "-"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Weekly Working Hours
            </span>
            <p className="text-base font-medium text-foreground">
              {companyWorkingHours || "-"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default StaticPage;
