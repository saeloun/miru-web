/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useCallback, useEffect, useState } from "react";

import { DeleteIcon } from "miruIcons";
import Select from "react-select";
import * as Yup from "yup";

import companiesApi from "apis/companies";
import companyProfileApi from "apis/companyProfile";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
import Toastr from "common/Toastr";
import { CountryList } from "constants/countryList";
import { currencyList } from "constants/currencyList";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../../Header";

// const deleteImage = require("../../../../../../assets/images/delete.svg");
const editButton = require("../../../../../../assets/images/edit_image_button.svg");
const img = require("../../../../../../assets/images/plus_icon.svg");

const orgSchema = Yup.object().shape({
  companyName: Yup.string().required("Name cannot be blank"),
  companyPhone: Yup.string().required("Phone number cannot be blank"),
  companyRate: Yup.number()
    .typeError("Amount must be a number")
    .min(0, "please enter larger amount")
    .required("Rate cannot be blank"),
});

const fiscalYearOptions = [
  { value: "jan-dec", label: "January-December" },
  { value: "apr-mar", label: "April-March" },
];

const dateFormatOptions = [
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const customStyles = {
  control: provided => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
    minHeight: 32,
    padding: "0",
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
  }),
};

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

const OrgEdit = () => {
  const [orgDetails, setOrgDetails] = useState(initialState);

  const [errDetails, setErrDetails] = useState({
    companyNameErr: "",
    companyPhoneErr: "",
    companyRateErr: "",
  });

  const [currenciesOption, setCurrenciesOption] = useState([]);
  const [countriesOption, setCountriesOption] = useState([]);
  const [timezoneOption, setTimezoneOption] = useState([]);
  const [timezones, setTimezones] = useState({});
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getCountries = async () => {
    const countries = CountryList.map(item => ({
      value: item.code,
      label: item.name,
    }));
    setCountriesOption(countries);
  };

  const getCurrencies = async () => {
    const currencies = currencyList.map(item => ({
      value: item.code,
      label: `${item.name} (${item.symbol})`,
    }));
    setCurrenciesOption(currencies);
  };

  const countryMapTimezone = country => {
    const timeZonesForCountry = timezones[country];
    const timezoneOptionList = timeZonesForCountry.map(item => ({
      value: item,
      label: item,
    }));
    setTimezoneOption(timezoneOptionList);
  };

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

    const timezonesEntry = await companyProfileApi.get();
    setTimezones(timezonesEntry.data.timezones);

    const timeZonesForCountry =
      timezonesEntry.data.timezones[companyDetails.country];

    const timezoneOptionList = timeZonesForCountry.map(item => ({
      value: item,
      label: item,
    }));
    setTimezoneOption(timezoneOptionList);
    setIsLoading(false);
  };

  useEffect(() => {
    sendGAPageView();
    getCountries();
    getCurrencies();
    getData();
  }, []);

  const handleNameChange = useCallback(
    e => {
      setOrgDetails({ ...orgDetails, companyName: e.target.value });
      setIsDetailUpdated(true);
      setErrDetails({ ...errDetails, companyNameErr: "" });
    },
    [orgDetails, errDetails]
  );

  const handleAddrChange = useCallback(
    e => {
      setOrgDetails({ ...orgDetails, companyAddr: e.target.value });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const handlePhoneChange = useCallback(
    e => {
      setOrgDetails({ ...orgDetails, companyPhone: e.target.value });
      setIsDetailUpdated(true);
      setErrDetails({ ...errDetails, companyPhoneErr: "" });
    },
    [orgDetails]
  );

  const handleCountryChange = useCallback(
    option => {
      countryMapTimezone(option.value);
      const timeZonesForCountry = timezones[option.value];
      const timezoneOptionList = timeZonesForCountry.map(item => ({
        value: item,
        label: item,
      }));
      setTimezoneOption(timezoneOptionList);
      setOrgDetails({
        ...orgDetails,
        countryName: option.value,
        companyTimezone:
          option.value === "US"
            ? "(GMT-05:00) Eastern Time (US & Canada)"
            : timezoneOptionList[0].value,
      });
      setIsDetailUpdated(true);
    },
    [orgDetails, timezones]
  );

  const handleCurrencyChange = useCallback(
    option => {
      setOrgDetails({ ...orgDetails, companyCurrency: option.value });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const handleRateChange = useCallback(
    e => {
      setOrgDetails({ ...orgDetails, companyRate: e.target.value });
      setIsDetailUpdated(true);
      setErrDetails({ ...errDetails, companyRateErr: "" });
    },
    [orgDetails]
  );

  const handleFiscalYearChange = useCallback(
    option => {
      setOrgDetails({ ...orgDetails, companyFiscalYear: option.value });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const handleDateFormatChange = useCallback(
    option => {
      setOrgDetails({ ...orgDetails, companyDateFormat: option.value });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const handleTimezoneChange = useCallback(
    option => {
      setOrgDetails({ ...orgDetails, companyTimezone: option.value });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const onLogoChange = useCallback(
    e => {
      const file = e.target.files[0];
      setOrgDetails({
        ...orgDetails,
        logoUrl: URL.createObjectURL(file),
        logo: file,
      });
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const updateOrgDetails = async () => {
    orgSchema
      .validate(orgDetails, { abortEarly: false })
      .then(async () => {
        try {
          setIsLoading(true);
          const formD = new FormData();
          formD.append("company[name]", orgDetails.companyName);
          formD.append("company[address]", orgDetails.companyAddr);
          formD.append("company[business_phone]", orgDetails.companyPhone);
          formD.append("company[country]", orgDetails.countryName);
          formD.append("company[base_currency]", orgDetails.companyCurrency);
          formD.append(
            "company[standard_price]",
            orgDetails.companyRate.toString()
          );

          formD.append(
            "company[fiscal_year_end]",
            orgDetails.companyFiscalYear
          );
          formD.append("company[date_format]", orgDetails.companyDateFormat);
          formD.append("company[timezone]", orgDetails.companyTimezone);
          if (orgDetails.logo) {
            formD.append("company[logo]", orgDetails.logo);
          }
          await companiesApi.update(orgDetails.id, formD);
          setIsDetailUpdated(false);
          setIsLoading(false);
        } catch {
          setIsLoading(false);
          Toastr.error("Error in Updating Org. Details");
        }
      })
      .catch(err => {
        const errObj = {
          companyNameErr: "",
          companyPhoneErr: "",
          companyRateErr: "",
        };

        err.inner.map(item => {
          errObj[`${item.path}Err`] = item.message;
        });
        setErrDetails(errObj);
      });
  };

  const handleCancelAction = () => {
    getCountries();
    getCurrencies();
    getData();
    setIsDetailUpdated(false);
  };

  const handleDeleteLogo = async () => {
    const removeLogo = await companiesApi.removeLogo(orgDetails.id);
    if (removeLogo.status === 200) {
      setOrgDetails({ ...orgDetails, logoUrl: null, logo: null });
    }
  };

  return (
    <div className="flex w-4/5 flex-col">
      <Header
        showButtons
        cancelAction={handleCancelAction}
        isDisableUpdateBtn={isDetailUpdated}
        saveAction={updateOrgDetails}
        subTitle="View and manage org settings"
        title="Organization Settings"
      />
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-4 h-full bg-miru-gray-100 p-10">
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Basic Details</div>
            <div className="w-full p-2">
              Logo
              {orgDetails.logoUrl ? (
                <div className="mt-2 flex flex-row">
                  <div className="h-20 w-20">
                    <img
                      alt="org_logo"
                      className="h-full min-w-full rounded-full"
                      src={orgDetails.logoUrl}
                    />
                  </div>
                  <label htmlFor="file-input">
                    <img
                      alt="edit"
                      className="mt-5 cursor-pointer rounded-full"
                      src={editButton}
                      style={{ minWidth: "40px" }}
                    />
                  </label>
                  <input
                    className="hidden"
                    id="file-input"
                    name="myImage"
                    type="file"
                    onChange={onLogoChange}
                  />
                  <button onClick={handleDeleteLogo}>
                    <DeleteIcon
                      className="mt-5 ml-2 cursor-pointer rounded-full"
                      style={{ minWidth: "40px" }}
                    />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-2 h-20 w-20 rounded border border-miru-han-purple-1000">
                    <label
                      className="items-cente flex h-full w-full cursor-pointer justify-center"
                      htmlFor="file-input"
                    >
                      <img alt="file_input" className="object-none" src={img} />
                    </label>
                  </div>
                  <input
                    className="hidden"
                    id="file-input"
                    name="myImage"
                    type="file"
                    onChange={onLogoChange}
                  />
                </>
              )}
              <div className="mt-4 flex w-1/2 flex-col">
                <label className="mb-2">Company Name</label>
                <input
                  className="w-full border py-1 px-1"
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={orgDetails.companyName}
                  onChange={handleNameChange}
                />
                {errDetails.companyNameErr && (
                  <span className="text-sm text-red-600">
                    {errDetails.companyNameErr}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Contact Details</div>
            <div className="w-full p-2">
              <div className="flex flex-col ">
                <label className="mb-2">Address</label>
                <textarea
                  className="w-5/6 border py-1 px-1	"
                  id="company_addr"
                  name="company_addr"
                  value={orgDetails.companyAddr}
                  onChange={handleAddrChange}
                />
                <label className="mb-2 mt-4">Business Phone</label>
                <input
                  className="w-80 border py-1 px-1"
                  id="company_phone"
                  name="company_phone"
                  type="text"
                  value={orgDetails.companyPhone}
                  onChange={handlePhoneChange}
                />
                {errDetails.companyPhoneErr && (
                  <span className="text-sm text-red-600">
                    {errDetails.companyPhoneErr}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="mt-2 w-4/12 p-2 font-bold">
              Location and Currency
            </div>
            <div className=" w-full p-2">
              <div className="flex flex-row ">
                <div className="w-1/2 p-2">
                  <label className="mb-2">Country</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={countriesOption}
                    styles={customStyles}
                    value={
                      orgDetails.countryName
                        ? countriesOption.find(
                            o => o.value === orgDetails.countryName
                          )
                        : { label: "United States", value: "US" }
                    }
                    onChange={handleCountryChange}
                  />
                </div>
                <div className="w-1/2 p-2">
                  <label className="mb-2">Base Currency</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={currenciesOption}
                    styles={customStyles}
                    value={
                      orgDetails.companyCurrency
                        ? currenciesOption.find(
                            o => o.value === orgDetails.companyCurrency
                          )
                        : { label: "US Dollar ($)", value: "USD" }
                    }
                    onChange={handleCurrencyChange}
                  />
                </div>
              </div>
              <div className="flex w-1/2 flex-col p-2">
                <label className="mb-2">Standard Rate</label>
                <input
                  className="w-full border py-1 px-1"
                  id="company_rate"
                  min={0}
                  name="company_rate"
                  type="number"
                  value={orgDetails.companyRate}
                  onChange={handleRateChange}
                />
                {errDetails.companyRateErr && (
                  <span className="text-sm text-red-600">
                    {errDetails.companyRateErr}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="mt-2 w-4/12 p-2 font-bold">Date and Time</div>
            <div className="w-full p-2">
              <div className="flex flex-row ">
                <div className="w-1/2 p-2">
                  <label className="mb-2">Timezone</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={timezoneOption}
                    styles={customStyles}
                    value={
                      orgDetails.companyTimezone
                        ? timezoneOption.find(
                            o => o.value === orgDetails.companyTimezone
                          )
                        : timezoneOption[0]
                    }
                    onChange={handleTimezoneChange}
                  />
                </div>
                <div className="w-1/2 p-2">
                  <label className="mb-2">Date Format</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={dateFormatOptions}
                    styles={customStyles}
                    value={
                      orgDetails.companyDateFormat
                        ? dateFormatOptions.find(
                            o => o.value === orgDetails.companyDateFormat
                          )
                        : dateFormatOptions[1]
                    }
                    onChange={handleDateFormatChange}
                  />
                </div>
              </div>
              <div className="flex w-1/2 flex-col p-2">
                <label className="mb-2"> Fiscal Year End</label>
                <Select
                  className="mt-2"
                  classNamePrefix="react-select-filter"
                  options={fiscalYearOptions}
                  styles={customStyles}
                  value={
                    orgDetails.companyFiscalYear
                      ? fiscalYearOptions.find(
                          o => o.value === orgDetails.companyFiscalYear
                        )
                      : fiscalYearOptions[0]
                  }
                  onChange={handleFiscalYearChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgEdit;
