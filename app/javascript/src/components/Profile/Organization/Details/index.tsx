import React, { useEffect, useState } from "react";

import companiesApi from "apis/companies";
import Loader from "common/Loader/index";
import DetailsHeader from "components/Profile/Common/DetailsHeader";
import { useUserContext } from "context/UserContext";
import { Outlet, useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";
import worldCountries from "world-countries";

import MobileHeader from "./MobileHeader";
import StaticPage from "./StaticPage";

const initialState = {
  id: null,
  logoUrl: "",
  companyName: "",
  companyAddr: "",
  companyPhone: "",
  countryName: "",
  companyCurrency: "",
  companyRate: 0.0,
  companyFiscalYear: "",
  companyDateFormat: "",
  companyTimezone: "",
  logo: null,
  companyWorkingHours: "",
  companyWorkingDays: "",
};

const OrgDetails = () => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();
  const [orgDetails, setOrgDetails] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const getData = async () => {
    setIsLoading(true);
    const res = await companiesApi.index();
    const companyDetails = { ...res.data.company_details };
    const {
      logo,
      name,
      address,
      business_phone,
      currency,
      standard_price,
      fiscal_year_end,
      date_format,
      timezone,
      id,
      working_hours,
      working_days,
    } = companyDetails;

    const { address_line_1, address_line_2, city, state, pin, country } =
      address;

    const {
      name: { common: CountryName },
    } = country
      ? worldCountries.find(worldCountry => worldCountry["cca2"] === country)
      : { name: { common: "" } };

    const companyAddrParts = [
      address_line_1,
      address_line_2,
      city,
      state,
      pin,
      CountryName,
    ];

    const companyAddr = companyAddrParts
      .filter(part => part !== null && part !== undefined && part !== "")
      .join(", ");

    setOrgDetails({
      logoUrl: logo,
      companyName: name,
      companyAddr,
      companyPhone: business_phone,
      countryName: address.country,
      companyCurrency: currency,
      companyRate: parseFloat(standard_price),
      companyFiscalYear: fiscal_year_end,
      companyDateFormat: date_format,
      companyTimezone: timezone,
      id,
      logo: null,
      companyWorkingHours: working_hours,
      companyWorkingDays: working_days,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    sendGAPageView();
    getData();
  }, []);

  const handleEditClick = () => {
    navigate(`/settings/profile/organization/edit`, { replace: true });
  };

  const handleBackBtnClick = () => {
    navigate(isDesktop ? `/settings/organization` : "/settings", {
      replace: true,
    });
  };

  return (
    <div className="flex w-full flex-col">
      {isDesktop ? (
        <DetailsHeader
          showButtons
          editAction={handleEditClick}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Organization Settings"
        />
      ) : (
        <MobileHeader
          title="Organization Settings"
          onBackArrowClick={handleBackBtnClick}
          onEditBtnClick={handleEditClick}
        />
      )}
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <StaticPage orgDetails={orgDetails} />
      )}
      <Outlet />
    </div>
  );
};

export default OrgDetails;
