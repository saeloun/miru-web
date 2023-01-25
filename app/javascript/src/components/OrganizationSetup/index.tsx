import React, { useState } from "react";

import Steps from "rc-steps";
import "rc-steps/assets/index.css";

import companiesApi from "apis/companies";

import CompanyDetailsForm from "./CompanyDetailsForm";
import FinancialDetailsForm from "./FinancialDetailsForm";
import { CompanyDetails, FinancialDetails } from "./interface";
import Step from "./Step";
import { organizationSetupSteps } from "./utils";

const OrganizationSetup = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    company_name: "",
    business_phone: "",
    address: "",
    logo_url: null,
    country: "",
    timezone: "",
    logo: null,
  });

  const onNextBtnClick = (companyDetails: CompanyDetails) => {
    const newStepNo = currentStep + 1;
    setCurrentStep(newStepNo);
    setCompanyDetails(companyDetails);
  };

  const generatePayload = (
    companyDetails: CompanyDetails,
    financialDetails: FinancialDetails
  ) => {
    const { company_name, business_phone, address, logo, country, timezone } =
      companyDetails;

    const { base_currency, standard_rate, year_end, date_format } =
      financialDetails;
    const formD = new FormData();
    formD.append("company[name]", company_name);
    formD.append("company[address]", address);
    formD.append("company[business_phone]", business_phone);
    formD.append("company[country]", country);
    formD.append("company[base_currency]", base_currency);
    formD.append("company[standard_price]", standard_rate.toString());

    formD.append("company[fiscal_year_end]", year_end);
    formD.append("company[date_format]", date_format);
    formD.append("company[timezone]", timezone);
    if (logo) {
      formD.append("company[logo]", logo);
    }

    return formD;
  };

  const onSaveBtnClick = async (financialDetails: FinancialDetails) => {
    const payload = generatePayload(companyDetails, financialDetails);
    await companiesApi.create(payload);
  };

  return (
    <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-36">
      <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
        <h1 className="text-center font-manrope text-4xl font-extrabold text-miru-han-purple-1000">
          Setup Org
        </h1>
        <div className="mx-auto mt-6 mb-11 w-full">
          <Steps
            current={currentStep - 1}
            itemRender={props => <Step {...props} />}
            items={organizationSetupSteps}
            labelPlacement="horizontal"
          />
        </div>
        {currentStep == 1 ? (
          <CompanyDetailsForm onNextBtnClick={onNextBtnClick} />
        ) : (
          <FinancialDetailsForm onSaveBtnClick={onSaveBtnClick} />
        )}
      </div>
    </div>
  );
};

export default OrganizationSetup;
