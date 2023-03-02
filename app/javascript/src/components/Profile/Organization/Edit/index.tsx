/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";

import {
  CalendarIcon,
  InfoIcon,
  MapPinIcon,
  MoneyIcon,
  PhoneIcon,
} from "miruIcons";
import * as Yup from "yup";
import { Country, State, City } from "country-state-city";

import companiesApi from "apis/companies";
import companyProfileApi from "apis/companyProfile";
import Loader from "common/Loader/index";
import Toastr from "common/Toastr";
import { CountryList } from "constants/countryList";
import { currencyList } from "constants/currencyList";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../../Header";
import { CustomInputText } from "common/CustomInputText";
const inputClass =
  "form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000";
const labelClass =
  "absolute top-0.5 left-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300";
import PhoneInput from "react-phone-number-input";
import { ErrorSpan } from "common/ErrorSpan";
import { CustomReactSelect } from "common/CustomReactSelect";
import { Uploader } from "./Uploader";
import FileAcceptanceText from "./FileAcceptanceText";
import { useDropzone } from "react-dropzone";
import { ProfileImage } from "./ProfileImage";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [orgDetails, setOrgDetails] = useState(initialState);

  const [errDetails, setErrDetails] = useState({
    companyNameErr: "",
    companyPhoneErr: "",
    companyRateErr: "",
  });

  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      accept: {
        "image/png": [".png", ".jpg", ".svg"],
      },
      maxSize: 1048576,
      multiple: false,
    });

  const files = acceptedFiles.map((file: any) => (
    <li key={file.path}>
      {file.path} - {Math.round(file.size / 1000)} kB
    </li>
  ));

  const file = acceptedFiles[0];

  useEffect(() => {
    if (file) {
      setOrgDetails({
        ...orgDetails,
        logoUrl: URL.createObjectURL(file),
        logo: file,
      });
      setIsDetailUpdated(true);
    }
  }, [file]);

  const [currenciesOption, setCurrenciesOption] = useState([]);
  const [countriesOption, setCountriesOption] = useState([]);
  const [timezoneOption, setTimezoneOption] = useState([]);
  const [timezones, setTimezones] = useState({});
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [stateDetails, setStateDetails] = useState({ label: "", value: "" });
  const [cityList, setCityList] = useState([]);
  const [addrType, setAddrType] = useState({ label: "", value: "" });
  const [countries, setCountries] = useState([]);

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
    console.log("organisation details", companyDetails);
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

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.name,
      label: country.name,
      code: country.isoCode,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    sendGAPageView();
    getCountries();
    getCurrencies();
    getData();
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
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

  const handleOnChangeCountry = selectCountry => {
    // setCountryDetails(selectCountry);
    // updateDetails("personal", {
    //   ...personalDetails,
    //   ...{ country: selectCountry.value },
    // });
  };

  const handleOnChangeState = selectState => {
    // setStateDetails(selectState);
    // updateDetails("personal", {
    //   ...personalDetails,
    //   ...{ state: selectState.value },
    // });
  };

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

  const handleUpdateOrgDetails = async () => {
    try {
      await orgSchema.validate(orgDetails, { abortEarly: false });
      await updateOrgDetails();
      navigate(`/profile/edit/organization-details`, { replace: true });
    } catch (err) {
      const errObj = {
        companyNameErr: "",
        companyPhoneErr: "",
        companyRateErr: "",
      };

      err.inner.map(item => {
        errObj[`${item.path}Err`] = item.message;
      });
      setErrDetails(errObj);
    }
  };

  const updateOrgDetails = async () => {
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

      formD.append("company[fiscal_year_end]", orgDetails.companyFiscalYear);
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
  };

  const handleCancelAction = () => {
    getCountries();
    getCurrencies();
    getData();
    setIsDetailUpdated(false);
    navigate(`/profile/edit/organization-details`, { replace: true });
  };

  const handleDeleteLogo = async () => {
    const removeLogo = await companiesApi.removeLogo(orgDetails.id);
    if (removeLogo.status === 200) {
      setOrgDetails({ ...orgDetails, logoUrl: null, logo: null });
    }
  };

  return (
    <div className="flex w-full flex-col">
      <Header
        showButtons
        cancelAction={handleCancelAction}
        isDisableUpdateBtn={isDetailUpdated}
        saveAction={handleUpdateOrgDetails}
        subTitle=""
        title="Organization Settings"
      />
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-4 h-full bg-miru-gray-100 px-10">
          <div className="flex border-b border-b-miru-gray-400 py-8">
            <div className="w-18">
              <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
                <InfoIcon
                  className="mr-2"
                  weight="bold"
                  color="#1D1A31"
                  size={13.5}
                />
                Basic Details
              </span>
            </div>
            <div className="flex w-72 flex-col">
              <div className="flex flex-row items-center px-2 pb-4 text-center">
                {!orgDetails.logoUrl ? (
                  <Uploader
                    isDragActive={isDragActive}
                    getInputProps={getInputProps}
                    getRootProps={getRootProps}
                  />
                ) : (
                  <ProfileImage
                    src={orgDetails.logoUrl}
                    handleDeleteLogo={handleDeleteLogo}
                    onLogoChange={onLogoChange}
                  />
                )}
                <div className="ml-5 w-36 whitespace-pre-wrap text-left text-xs	 text-miru-dark-purple-400 ">
                  <FileAcceptanceText />
                </div>
              </div>
              <div className="flex w-1/2 flex-col px-2 pt-1">
                <CustomInputText
                  dataCy="company-name"
                  id="company_name"
                  label="Company Name"
                  name="company_name"
                  type="text"
                  inputBoxClassName={`${inputClass} ${
                    errDetails.companyNameErr
                      ? "border-red-600"
                      : "border-miru-gray-1000"
                  }`}
                  labelClassName={`${labelClass} ${
                    errDetails.companyNameErr
                      ? "text-red-600"
                      : "text-miru-dark-purple-200"
                  }`}
                  value={orgDetails.companyName}
                  onChange={handleNameChange}
                />
                {errDetails.companyNameErr && (
                  <ErrorSpan
                    className="text-xs text-red-600"
                    message={errDetails.companyNameErr}
                  />
                )}
              </div>
              <div className="w-72">
                <div className="flex flex-col">
                  {/* {orgDetails.logoUrl ? (
                  <div className="mt-2 flex flex-row">
                    <div className="h-120 w-30">
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
                        src={EditImageButtonSVG}
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
                    <button data-cy="delete-logo" onClick={handleDeleteLogo}>
                      <DeleteIcon
                        className="mt-5 ml-2 cursor-pointer rounded-full"
                        style={{ minWidth: "40px" }}
                      />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-2 h-120 w-30 rounded border border-miru-han-purple-1000">
                      <label
                        className="items-cente flex h-full w-full cursor-pointer justify-center"
                        htmlFor="file-input"
                      >
                        <img
                          alt="file_input"
                          className="object-none"
                          src={PlusIconSVG}
                        />
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
                )} */}
                  {/* <div className="mt-4 flex w-1/2 flex-col">
                    <CustomInputText
                      dataCy="company-name"
                      id="company_name"
                      label="Company Name"
                      name="company_name"
                      type="text"
                      inputBoxClassName={`${inputClass} ${errDetails.companyNameErr
                        ? "border-red-600"
                        : "border-miru-gray-1000"
                        }`}
                      labelClassName={`${labelClass} ${errDetails.companyNameErr
                        ? "text-red-600"
                        : "text-miru-dark-purple-200"
                        }`}
                      value={orgDetails.companyName}
                      onChange={handleNameChange}
                    />
                    {errDetails.companyNameErr && (
                      <ErrorSpan
                        className="text-xs text-red-600"
                        message={errDetails.companyNameErr}
                      />
                    )}
                  </div> */}
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-b border-b-miru-gray-400 py-8">
            <div className="w-18 ">
              <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
                <PhoneIcon
                  className="mr-2"
                  weight="bold"
                  color="#1D1A31"
                  size={13.5}
                />
                Contact Details
              </span>
            </div>
            <div className="w-72">
              <div className="flex flex-row">
                <div className="flex w-1/2 flex-col px-2">
                  <div className="outline relative flex h-12 flex-row rounded border border-miru-gray-1000 bg-white p-4">
                    <PhoneInput
                      className="input-phone-number w-full border-transparent focus:border-transparent focus:ring-0"
                      defaultCountry="US"
                      initialValueFormat="national"
                      inputClassName="form__input block w-full appearance-none bg-white border-0 focus:border-0 p-4 text-base h-12 border-transparent focus:border-transparent focus:ring-0 border-miru-gray-1000 w-full"
                      value={
                        orgDetails.companyPhone ? orgDetails.companyPhone : ""
                      }
                      onChange={handlePhoneChange}
                    />
                    <label
                      className="absolute -top-1 left-0 z-1 ml-3 origin-0 bg-white px-1 text-xsm font-medium text-miru-dark-purple-200 duration-300"
                      htmlFor="phone_number"
                    >
                      Phone number
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-b border-b-miru-gray-400 py-8">
            <div className="w-18">
              <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
                <MapPinIcon
                  className="mr-2"
                  weight="bold"
                  color="#1D1A31"
                  size={13.5}
                />
                Address
              </span>
            </div>
            <div className="w-72">
              {/* <div className="flex flex-row">
                <div className="flex w-1/2 flex-col px-2 pb-3">
                   <CustomReactSelect
                    handleOnChange={handleOnChangeAddrType}
                    label="Address type"
                    name="address_select"
                    options={addressOptions}
                    value={addrType.value ? addrType : addressOptions[0]}
                  />
                </div>
              </div>*/}
              <div className="flex w-full flex-col px-2 pb-3">
                <CustomInputText
                  dataCy="address-line-1"
                  id="address_line_1"
                  label="Address line 1"
                  name="address_line_1"
                  type="text"
                  value={orgDetails.companyAddr}
                  onChange={handleAddrChange}
                />
              </div>
              {/* <div className="flex w-full flex-col px-2 py-3">
                 <CustomInputText
            dataCy="address-line-2"
            id="address_line_2"
            label="Address line 2 (optional)"
            name="address_line_2"
            type="text"
            value={personalDetails.address_line_2}
            onChange={e => {
              updateBasicDetails(e.target.value, "address_line_2");
            }}
          />
              </div>*/}
              <div className="flex flex-row pt-2 pb-1">
                <div className="flex w-1/2 flex-col px-2 pb-3">
                  <CustomReactSelect
                    handleOnChange={value => handleOnChangeCountry(value)}
                    // isErr={!!errDetails.country_err}
                    label="Country"
                    name="current_country_select"
                    options={countries}
                    value={null}
                    // value={{
                    //   label: personalDetails.addresses.country,
                    //   value: personalDetails.addresses.country,
                    // }}
                  />
                  {/* {errDetails.country_err && (
                    <ErrorSpan
                      className="text-xs text-red-600"
                      message={errDetails.country_err}
                    />
                  )} */}
                </div>
                <div className="flex w-1/2 flex-col px-2 pb-3">
                  <CustomReactSelect
                    handleOnChange={handleOnChangeState}
                    label="State"
                    name="state_select"
                    value={null}
                    options={[]}
                  />
                </div>
              </div>
              <div className="flex flex-row py-1">
                <div className="flex w-1/2 flex-col px-2 pb-3">
                  {/* <CustomAsyncSelect
                    label="City"
                    loadOptions={[]}
                    name="country_select"
                  /> */}
                </div>
                <div className="flex w-1/2 flex-col px-2 pb-3">
                  <CustomInputText
                    dataCy="zipcode"
                    id="zipcode"
                    label="Zipcode"
                    name="zipcode"
                    type="text"
                    value={"55011"}
                    onChange={e => {
                      // updateBasicDetails(e.target.value, "zipcode");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-row  border-b border-b-miru-gray-400 py-8">
            <div className="w-18">
              <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
                <span className="mr-2 w-13">
                  <MoneyIcon color="#1D1A31" size={13.5} weight="bold" />
                </span>
                Currency and Standard Rate
              </span>
            </div>
            <div className="w-72">
              <div className="flex flex-row">
                {/* <div className="w-1/2 p-2" data-cy="country">
                  <label className="mb-2">Country</label>
                  <CustomReactSelect
                    // className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={countriesOption}
                    label={"Country"}
                    value={
                      orgDetails.countryName
                        ? countriesOption.find(
                          o => o.value === orgDetails.countryName
                        )
                        : { label: "United States", value: "US" }
                    }
                    handleOnChange={handleCountryChange}

                  />
                </div>  */}
                <div className="w-1/2 p-2" data-cy="base-currency">
                  <CustomReactSelect
                    // className="mt-2"
                    classNamePrefix="react-select-filter"
                    options={currenciesOption}
                    // styles={customStyles}
                    label={"Base Currency"}
                    name="base_currency"
                    value={
                      orgDetails.companyCurrency
                        ? currenciesOption.find(
                            o => o.value === orgDetails.companyCurrency
                          )
                        : { label: "US Dollar ($)", value: "USD" }
                    }
                    handleOnChange={handleCurrencyChange}
                  />
                </div>
                <div className="w-1/2 p-2">
                  <CustomInputText
                    dataCy="standard-rate"
                    id="company_rate"
                    label="Standard Rate"
                    name="company_rate"
                    type="text"
                    inputBoxClassName={`${inputClass} ${
                      errDetails.companyNameErr
                        ? "border-red-600"
                        : "border-miru-gray-1000"
                    }`}
                    labelClassName={`${labelClass} ${
                      errDetails.companyNameErr
                        ? "text-red-600"
                        : "text-miru-dark-purple-200"
                    }`}
                    value={orgDetails.companyRate}
                    onChange={handleRateChange}
                  />
                  {/* <input
                  className="w-full border py-1 px-1"
                  data-cy="standard-rate"
                  id="company_rate"
                  min={0}
                  name="company_rate"
                  type="number"
                  value={orgDetails.companyRate}
                  onChange={handleRateChange}
                /> */}
                  {errDetails.companyRateErr && (
                    <span className="text-sm text-red-600">
                      {errDetails.companyRateErr}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row  border-b border-b-miru-gray-400 py-8">
            <div className="w-18">
              <span className="flex flex-row items-center text-sm font-medium text-miru-dark-purple-1000">
                <CalendarIcon
                  className="mr-2"
                  weight="bold"
                  color="#1D1A31"
                  size={13.5}
                />
                Date & Time
              </span>
            </div>
            <div className="w-72">
              <div className="flex flex-row ">
                <div className="w-1/2 p-2" data-cy="timezone">
                  <CustomReactSelect
                    classNamePrefix="react-select-filter"
                    label={"Timezone"}
                    name={"timezone"}
                    options={timezoneOption}
                    value={
                      orgDetails.companyTimezone
                        ? timezoneOption.find(
                            o => o.value === orgDetails.companyTimezone
                          )
                        : timezoneOption[0]
                    }
                    handleOnChange={handleTimezoneChange}
                  />
                </div>
                <div className="w-1/2 p-2" data-cy="date-format">
                  <CustomReactSelect
                    classNamePrefix="react-select-filter"
                    options={dateFormatOptions}
                    label={"Date Format"}
                    name={"date_format"}
                    value={
                      orgDetails.companyDateFormat
                        ? dateFormatOptions.find(
                            o => o.value === orgDetails.companyDateFormat
                          )
                        : dateFormatOptions[1]
                    }
                    handleOnChange={handleDateFormatChange}
                  />
                </div>
              </div>

              <div
                className="flex w-1/2 flex-col px-2 pt-3"
                data-cy="fiscal-year"
              >
                <CustomReactSelect
                  classNamePrefix="react-select-filter"
                  options={fiscalYearOptions}
                  label={"Fiscal Year End"}
                  name={"fiscal_year_end"}
                  value={
                    orgDetails.companyFiscalYear
                      ? fiscalYearOptions.find(
                          o => o.value === orgDetails.companyFiscalYear
                        )
                      : fiscalYearOptions[0]
                  }
                  handleOnChange={handleFiscalYearChange}
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
