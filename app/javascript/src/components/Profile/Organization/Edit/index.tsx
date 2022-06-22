/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useCallback, useEffect, useState } from "react";
import Select from "react-select";

import companiesApi from "apis/companies";
import companyProfileApi from "apis/companyProfile";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
import Toastr from "common/Toastr";
import * as Yup from "yup";
import { CountryList } from "constants/countryList";
import { currencyList } from "constants/currencyList";

import Header from "../../Header";

const editButton = require("../../../../../../assets/images/edit_image_button.svg");
const img = require("../../../../../../assets/images/plus_icon.svg");

const orgSchema = Yup.object().shape({
  companyName: Yup.string().required("Name cannot be blank"),
  companyPhone: Yup.string().required("Phone number cannot be blank"),
  companyRate: Yup.number().typeError("Amount must be a number").min(0, "please enter larger amount").required("Rate cannot be blank")
});

const fiscalYearOptions = [
  { value: "jan-dec", label: "January-December" },
  { value: "apr-mar", label: "April-March" }
];

const dateFormatOptions = [
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }
];

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
    minHeight: 32,
    padding: "0"
  }),
  menu: (provided) => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px"
  })
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
  logo: null
};

const OrgEdit = () => {
  const [orgDetails, setOrgDetails] = useState(initialState);

  const [errDetails, setErrDetails] = useState({
    companyNameErr: "",
    companyPhoneErr: "",
    companyRateErr: ""
  });

  const [currenciesOption, setCurrenciesOption] = useState([]);
  const [countriesOption, setCountriessOption] = useState([]);
  const [timezoneOption, setTimezoneOption] = useState([]);
  const [timezones, setTimeZones] = useState({});
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setisLoading] = useState(false);

  const getCountries = async () => {
    const countries = CountryList.map((item) => ({
      value: item.code,
      label: item.name
    }));
    setCountriessOption(countries);
  };

  const getCurrencies = async () => {
    const currencies = currencyList.map((item) => ({
      value: item.code,
      label: `${item.name} (${item.symbol})`
    }));
    setCurrenciesOption(currencies);
  };

  const countryMapTimezone = (country) => {
    const timeZonesForCountry = timezones[country];
    const timezoneOptionList = timeZonesForCountry.map((item) => ({
      value: item,
      label: item
    }));
    setTimezoneOption(timezoneOptionList);
  };

  const getData = async () => {
    setisLoading(true);
    const resp = await companiesApi.index();
    setOrgDetails({
      logoUrl: resp.data.logo_url,
      companyName: resp.data.name,
      companyAddr: resp.data.address,
      companyPhone: resp.data.business_phone,
      countryName: resp.data.country,
      companyCurrency: resp.data.base_currency,
      companyRate: parseFloat(resp.data.standard_price),
      companyFiscalYear: resp.data.fiscal_year_end,
      companyDateFormat: resp.data.date_format,
      companyTimezone: resp.data.timezone,
      id: resp.data.id,
      logo: null
    });

    const timezonesEntry = await companyProfileApi.get();
    setTimeZones(timezonesEntry.data.timezones);

    const timeZonesForCountry = timezonesEntry.data.timezones[resp.data.country];
    const timezoneOptionList = timeZonesForCountry.map((item) => ({
      value: item,
      label: item
    }));
    setTimezoneOption(timezoneOptionList);
    setisLoading(false);
  };

  useEffect(() => {
    getCountries();
    getCurrencies();
    getData();
  }, []);

  const handleNameChange = useCallback((e) => {
    setOrgDetails({ ...orgDetails, companyName: e.target.value });
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, companyNameErr: "" });
  }, [orgDetails, errDetails]);

  const handleAddrChange = useCallback((e) => {
    setOrgDetails({ ...orgDetails, companyAddr: e.target.value });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const handlePhoneChange = useCallback((e) => {
    setOrgDetails({ ...orgDetails, companyPhone: e.target.value });
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, companyPhoneErr: "" });
  }, [orgDetails]);

  const handleCountryChange = useCallback((option) => {
    countryMapTimezone(option.value);
    const timeZonesForCountry = timezones[option.value];
    const timezoneOptionList = timeZonesForCountry.map((item) => ({
      value: item,
      label: item
    }));
    setTimezoneOption(timezoneOptionList);
    setOrgDetails({
      ...orgDetails,
      countryName: option.value,
      companyTimezone: option.value === "US" ? "(GMT-05:00) Eastern Time (US & Canada)" : timezoneOptionList[0].value
    });
    setIsDetailUpdated(true);
  }, [orgDetails, timezones]);

  const handleCurrencyChange = useCallback((option) => {
    setOrgDetails({ ...orgDetails, companyCurrency: option.value });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const handleRateChange = useCallback((e) => {
    setOrgDetails({ ...orgDetails, companyRate: e.target.value });
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, companyRateErr: "" });
  }, [orgDetails]);

  const handleFiscalYearChange = useCallback((option) => {
    setOrgDetails({ ...orgDetails, companyFiscalYear: option.value });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const handleDateFormatChange = useCallback((option) => {
    setOrgDetails({ ...orgDetails, companyDateFormat: option.value });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const handleTimezoneChange = useCallback((option) => {
    setOrgDetails({ ...orgDetails, companyTimezone: option.value });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const onLogoChange = useCallback((e) => {
    const file = e.target.files[0];
    setOrgDetails({ ...orgDetails, logoUrl: URL.createObjectURL(file), logo: file });
    setIsDetailUpdated(true);
  }, [orgDetails]);

  const updateOrgDetails = async () => {
    orgSchema.validate(orgDetails, { abortEarly: false }).then(async () => {
      try {
        setisLoading(true);
        const formD = new FormData();
        formD.append(
          "company[name]", orgDetails.companyName
        );
        formD.append(
          "company[address]", orgDetails.companyAddr
        );
        formD.append(
          "company[business_phone]", orgDetails.companyPhone
        );
        formD.append(
          "company[country]", orgDetails.countryName
        );
        formD.append(
          "company[base_currency]", orgDetails.companyCurrency
        );
        formD.append(
          "company[standard_price]", orgDetails.companyRate.toString()
        );
        formD.append(
          "company[fiscal_year_end]", orgDetails.companyFiscalYear
        );
        formD.append(
          "company[date_format]", orgDetails.companyDateFormat
        );
        formD.append(
          "company[timezone]", orgDetails.companyTimezone
        );
        if (orgDetails.logo) {
          formD.append(
            "company[logo]", orgDetails.logo
          );
        }
        await companiesApi.update(orgDetails.id, formD);
        setIsDetailUpdated(false);
        setisLoading(false);
      } catch (err) {
        setisLoading(false);
        Toastr.error("Error in Updating Org. Details");
      }
    }).catch(function (err) {
      const errObj = {
        companyNameErr: "",
        companyPhoneErr: "",
        companyRateErr: ""
      };
      err.inner.map((item) => {
        errObj[item.path + "Err"] = item.message;
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
    <div className="flex flex-col w-4/5">
      <Header
        title={"Organization Settings"}
        subTitle={"View and manage org settings"}
        showButtons={true}
        cancelAction={handleCancelAction}
        saveAction={updateOrgDetails}
        isDisableUpdateBtn={isDetailUpdated}
      />
      {isLoading ? <Loader /> : (
        <div className="p-10 mt-4 bg-miru-gray-100 h-full">
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2">Basic Details</div>
            <div className="w-full p-2">
              Logo
              {orgDetails.logoUrl ? (
                <div className="mt-2 flex flex-row">
                  <div className="w-20 h-20">
                    <img src={orgDetails.logoUrl} className={"rounded-full min-w-full h-full"} alt="org_logo" />
                  </div>
                  <label htmlFor="file-input">
                    <img src={editButton} className={"rounded-full mt-5 cursor-pointer"} style={{ "minWidth": "40px" }} alt="edit" />
                  </label>
                  <input id="file-input" type="file" name="myImage" className='hidden' onChange={onLogoChange}>
                  </input>
                  <button onClick={handleDeleteLogo}>
                    <img
                      src="/delete.svg"
                      alt="delete"
                      style={{ "minWidth": "20px" }}
                    />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 border rounded border-miru-han-purple-1000 mt-2">
                    <label htmlFor="file-input" className="flex justify-center items-cente w-full h-full cursor-pointer">
                      <img src={img} alt="file_input" className="object-none" />
                    </label>
                  </div>
                  <input id="file-input" type="file" name="myImage" className='hidden' onChange={onLogoChange} />
                </>
              )}
              <div className="flex flex-col mt-4 w-1/2">
                <label className="mb-2">Company Name</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={orgDetails.companyName}
                  className="border py-1 px-1 w-full"
                  onChange={handleNameChange}
                />
                {errDetails.companyNameErr && (<span className="text-red-600 text-sm">{errDetails.companyNameErr}</span>)}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2">Contact Details</div>
            <div className="p-2 w-full">
              <div className="flex flex-col ">
                <label className="mb-2">Address</label>
                <textarea
                  id="company_addr"
                  name="company_addr"
                  value={orgDetails.companyAddr}
                  className="border py-1 px-1 w-5/6	"
                  onChange={handleAddrChange}
                />
                <label className="mb-2 mt-4">Business Phone</label>
                <input
                  type="text"
                  id="company_phone"
                  name="company_phone"
                  value={orgDetails.companyPhone}
                  className="border py-1 px-1 w-80"
                  onChange={handlePhoneChange}
                />
                {errDetails.companyPhoneErr && (<span className="text-red-600 text-sm">{errDetails.companyPhoneErr}</span>)}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2 mt-2">Location and Currency</div>
            <div className=" p-2 w-full">
              <div className="flex flex-row ">
                <div className="w-1/2 p-2">
                  <label className="mb-2">Country</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    styles={customStyles}
                    options={countriesOption}
                    onChange={handleCountryChange}
                    value={orgDetails.countryName ? countriesOption.find(o => o.value === orgDetails.countryName) : { label: "United States", value: "US" }}
                  />
                </div>
                <div className="w-1/2 p-2">
                  <label className="mb-2">Base Currency</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    styles={customStyles}
                    options={currenciesOption}
                    onChange={handleCurrencyChange}
                    value={orgDetails.companyCurrency ? currenciesOption.find(o => o.value === orgDetails.companyCurrency) : { label: "US Dollar ($)", value: "USD" }}
                  />
                </div>
              </div>
              <div className="flex flex-col p-2 w-1/2">
                <label className="mb-2">Standard Rate</label>
                <input
                  type="number"
                  min={0}
                  id="company_rate"
                  name="company_rate"
                  value={orgDetails.companyRate}
                  className="border py-1 px-1 w-full"
                  onChange={handleRateChange}
                />
                {errDetails.companyRateErr && (<span className="text-red-600 text-sm">{errDetails.companyRateErr}</span>)}
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 font-bold p-2 mt-2">Date and Time</div>
            <div className="p-2 w-full">
              <div className="flex flex-row ">
                <div className="w-1/2 p-2">
                  <label className="mb-2">Timezone</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    styles={customStyles}
                    options={timezoneOption}
                    value={orgDetails.companyTimezone ? timezoneOption.find(o => o.value === orgDetails.companyTimezone) : timezoneOption[0]}
                    onChange={handleTimezoneChange}
                  />
                </div>
                <div className="w-1/2 p-2">
                  <label className="mb-2">Date Format</label>
                  <Select
                    className="mt-2"
                    classNamePrefix="react-select-filter"
                    styles={customStyles}
                    options={dateFormatOptions}
                    value={orgDetails.companyDateFormat ? dateFormatOptions.find(o => o.value === orgDetails.companyDateFormat) : dateFormatOptions[1]}
                    onChange={handleDateFormatChange}
                  />
                </div>
              </div>
              <div className="flex flex-col w-1/2 p-2">
                <label className="mb-2"> Fiscal Year End</label>
                <Select
                  className="mt-2"
                  classNamePrefix="react-select-filter"
                  styles={customStyles}
                  options={fiscalYearOptions}
                  onChange={handleFiscalYearChange}
                  value={orgDetails.companyFiscalYear ? fiscalYearOptions.find(o => o.value === orgDetails.companyFiscalYear) : fiscalYearOptions[0]}
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
