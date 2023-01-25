import React from "react";

import Steps from "rc-steps";
import "rc-steps/assets/index.css";

import CompanyDetailsForm from "./CompanyDetailsForm";
import Step from "./Step";
import { organizationSetupSteps } from "./utils";

const OrganizationSetup = () => (
  <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-36">
    <div className="mx-auto min-h-full md:w-1/2 lg:w-352">
      <h1 className="text-center font-manrope text-4xl font-extrabold text-miru-han-purple-1000">
        Setup Org
      </h1>
      <div className="mx-auto mt-6 mb-11 w-full">
        <Steps
          current={0}
          itemRender={props => <Step {...props} currentStep={1} />}
          items={organizationSetupSteps}
          labelPlacement="horizontal"
        />
      </div>
      <CompanyDetailsForm />
    </div>
  </div>
);

export default OrganizationSetup;
