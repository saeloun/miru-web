import React, { useEffect, useState } from "react";

import { Country } from "country-state-city";
import { Outlet, useNavigate } from "react-router-dom";

import companiesApi from "apis/companies";
import Loader from "common/Loader/index";
import { sendGAPageView } from "utils/googleAnalytics";

import StaticPage from "./StaticPage";

import DetailsHeader from "../../DetailsHeader";

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
};

const OrgDetails = () => {
  const navigate = useNavigate();
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
    } = companyDetails;
    const { name: CountryName } = Country.getCountryByCode(address.country);

    setOrgDetails({
      logoUrl: logo,
      companyName: name,
      companyAddr: `${address.address_line_1} ${address.address_line_2}, ${address.city}, ${address.state} ${address.pin}, ${CountryName}`,
      companyPhone: business_phone,
      countryName: address.country,
      companyCurrency: currency,
      companyRate: parseFloat(standard_price),
      companyFiscalYear: fiscal_year_end,
      companyDateFormat: date_format,
      companyTimezone: timezone,
      id,
      logo: null,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    sendGAPageView();
    getData();
  }, []);

  const handleEditClick = () => {
    navigate(`/profile/edit/organization`, { replace: true });
  };

  return (
    <div className="flex w-full flex-col">
      <DetailsHeader
        showButtons
        editAction={handleEditClick}
        isDisableUpdateBtn={false}
        subTitle=""
        title="Organization Settings"
      />
      {isLoading ? <Loader /> : <StaticPage orgDetails={orgDetails} />}
      <Outlet />
    </div>
  );
};

export default OrgDetails;
