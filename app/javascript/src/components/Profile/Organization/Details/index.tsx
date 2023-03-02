import React, { useEffect, useState } from "react";

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
    setOrgDetails({
      logoUrl: companyDetails.logo,
      companyName: companyDetails.name,
      companyAddr: companyDetails.address,
      companyPhone: companyDetails.business_phone,
      countryName: companyDetails.country,
      companyCurrency: companyDetails.currency,
      companyRate: parseFloat(companyDetails.standard_price),
      companyFiscalYear: companyDetails.fiscal_year_end,
      companyDateFormat: companyDetails.date_format,
      companyTimezone: companyDetails.timezone,
      id: companyDetails.id,
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
