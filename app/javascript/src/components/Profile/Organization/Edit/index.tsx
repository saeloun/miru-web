/* eslint-disable */
import React, { useCallback, useEffect, useState } from "react";

import * as Yup from "yup";
import { Country, State, City } from "country-state-city";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";

import { Toastr } from "StyledComponents";
import companiesApi from "apis/companies";
import companyProfileApi from "apis/companyProfile";
import Loader from "common/Loader/index";
import { currencyList } from "constants/currencyList";
import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../../Header";
import { StaticPage } from "./StaticPage";

const orgSchema = Yup.object().shape({
  companyName: Yup.string().required("Name cannot be blank"),
  companyPhone: Yup.string().required("Phone number cannot be blank"),
  companyAddr: Yup.object().shape({
    addressLine1: Yup.string().required("Address Line 1 cannot be blank"),
    country: Yup.string().required("Country cannot be blank"),
    state: Yup.string().required("State cannot be blank"),
    city: Yup.string().required("City cannot be blank"),
    zipcode: Yup.string().required("Zipcode cannot be blank"),
  }),
  companyRate: Yup.number()
    .typeError("Amount must be a number")
    .min(0, "please enter larger amount")
    .required("Rate cannot be blank"),
});

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

const dateFormatOptions = [
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
  { value: "MM-DD-YYYY", label: "MM-DD-YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const initialState = {
  id: null,
  logoUrl: "",
  companyName: "",
  companyAddr: {
    id: null,
    addressLine1: "",
    addressLine2: "",
    city: {
      label: "",
      value: "",
    },
    country: {
      label: "",
      value: "",
      code: "",
    },
    state: {
      label: "",
      value: "",
    },
    zipcode: "",
  },
  companyPhone: "",
  countryName: "",
  companyCurrency: "",
  companyRate: "0.00",
  companyFiscalYear: "",
  companyDateFormat: "",
  companyTimezone: "",
  logo: null,
};

const errorState = {
  companyNameErr: "",
  companyPhoneErr: "",
  companyRateErr: "",
  addressLine1Err: "",
  stateErr: "",
  countryErr: "",
  cityErr: "",
  zipcodeErr: "",
};

const OrgEdit = () => {
  const navigate = useNavigate();
  const [orgDetails, setOrgDetails] = useState(initialState);

  const [errDetails, setErrDetails] = useState(errorState);

  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      accept: {
        "image/png": [".png", ".jpg", ".svg"],
      },
      maxSize: 1048576,
      multiple: false,
    });

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
  const [timezoneOption, setTimezoneOption] = useState([]);
  const [timezones, setTimezones] = useState({});
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [stateList, setStateList] = useState([]);
  const [currentCityList, setCurrentCityList] = useState([]);
  const initialSelectValue = {
    label: "",
    value: "",
    code: "",
  };
  const [countries, setCountries] = useState([]);
  const [currentCountryDetails, setCurrentCountryDetails] =
    useState(initialSelectValue);

  const getCurrencies = async () => {
    const currencies = currencyList.map(item => ({
      value: item.code,
      label: `${item.name} (${item.symbol})`,
    }));
    setCurrenciesOption(currencies);
  };

  const getData = async () => {
    setIsLoading(true);
    const res = await companiesApi.index();
    const companyDetails = { ...res.data.company_details };
    const { isoCode, name } = Country.getCountryByCode(
      companyDetails.address.country
    );

    const orgAddr = {
      id: companyDetails.address.id,
      addressLine1: companyDetails.address.address_line_1,
      addressLine2: companyDetails.address.address_line_2,
      city: {
        value: companyDetails.address.city,
        label: companyDetails.address.city,
      },
      country: {
        label: name,
        value: isoCode,
        code: isoCode,
      },
      state: {
        value: companyDetails.address.state,
        label: companyDetails.address.state,
      },
      zipcode: companyDetails.address.pin,
    };

    const organizationSchema = {
      logoUrl: companyDetails.logo,
      companyName: companyDetails.name,
      companyAddr: orgAddr,
      companyPhone: companyDetails.business_phone,
      countryName: companyDetails.country,
      companyCurrency: companyDetails.currency,
      companyRate: parseFloat(companyDetails.standard_price.toString()).toFixed(
        2
      ),
      companyFiscalYear: companyDetails.fiscal_year_end,
      companyDateFormat: companyDetails.date_format,
      companyTimezone: companyDetails.timezone,
      id: companyDetails.id,
      logo: null,
    };

    setOrgDetails(organizationSchema);

    const timezonesEntry = await companyProfileApi.get();
    setTimezones(timezonesEntry.data.timezones);

    const timeZonesForCountry = timezonesEntry.data.timezones[isoCode];
    const timezoneOptionList = timeZonesForCountry.map(item => ({
      value: item,
      label: item,
    }));
    setTimezoneOption(timezoneOptionList);
    addCity(isoCode, companyDetails.address.state);
    setIsLoading(false);
  };

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.isoCode,
      label: country.name,
      code: country.isoCode,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    sendGAPageView();
    getCurrencies();
    getData();
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
  }, []);

  const handleAddrChange = useCallback(
    (e, type) => {
      const { companyAddr } = orgDetails;
      if (type === "addressLine1") {
        const changedAddr = { ...companyAddr, addressLine1: e.target.value };
        setOrgDetails({ ...orgDetails, companyAddr: changedAddr });
      } else {
        const changedAddr = { ...companyAddr, addressLine2: e.target.value };
        setOrgDetails({ ...orgDetails, companyAddr: changedAddr });
      }
      setIsDetailUpdated(true);
    },
    [orgDetails]
  );

  const setupTimezone = (orgDetails, countryCode) => {
    const timeZonesForCountry = timezones[countryCode];
    const timezoneOptionList = timeZonesForCountry.map(item => ({
      value: item,
      label: item,
    }));
    setTimezoneOption(timezoneOptionList);
    setOrgDetails({
      ...orgDetails,
      countryName: countryCode,
      companyTimezone:
        countryCode === "US"
          ? "(GMT-05:00) Eastern Time (US & Canada)"
          : timezoneOptionList[0].value,
    });
  };

  const handleChangeCompanyDetails = useCallback(
    (e, type) => {
      setOrgDetails({ ...orgDetails, [type]: e });
      setIsDetailUpdated(true);
      setErrDetails({ ...errDetails, [type + "Err"]: "" });
    },
    [orgDetails, errDetails]
  );

  const handleOnChangeCountry = selectCountry => {
    const { companyAddr } = orgDetails;
    const changedCountry = { ...companyAddr, country: selectCountry };
    setCurrentCountryDetails(selectCountry);

    setupTimezone(
      { ...orgDetails, companyAddr: changedCountry },
      selectCountry.code
    );
    setIsDetailUpdated(true);
  };

  const addCity = (country, state) => {
    const cities = City.getCitiesOfState(country, state).map(city => ({
      label: city.name,
      value: city.name,
      ...city,
    }));
    setCurrentCityList(cities);
  };

  const handleOnChangeState = selectState => {
    const { companyAddr } = orgDetails;
    const changedState = {
      ...companyAddr,
      state: { value: selectState.name, label: selectState.name },
    };
    setOrgDetails({ ...orgDetails, companyAddr: changedState });
    addCity(currentCountryDetails.code, selectState.code);
  };

  const updatedStates = countryCode =>
    State.getStatesOfCountry(countryCode).map(state => ({
      label: state.name,
      value: state.name,
      code: state.isoCode,
      ...state,
    }));

  useEffect(() => {
    const stateList = updatedStates(orgDetails.companyAddr.country.value);
    setStateList(stateList);
  }, [orgDetails.companyAddr.country]);

  const filterCities = (inputValue: string) => {
    const city = currentCityList.filter(i =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    return city.length ? city : [{ label: inputValue, value: inputValue }];
  };

  const promiseOptions = (inputValue: string) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(filterCities(inputValue));
      }, 1000);
    });
  };

  const handleCurrencyChange = useCallback(
    option => {
      setOrgDetails({ ...orgDetails, companyCurrency: option.value });
      setIsDetailUpdated(true);
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

  const handleZipcodeChange = (e, type) => {
    const { companyAddr } = orgDetails;
    const changedZipCode = { ...companyAddr, zipcode: e.target.value };
    setOrgDetails({ ...orgDetails, companyAddr: changedZipCode });
    setIsDetailUpdated(true);
  };

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
      await orgSchema.validate(
        {
          companyName: orgDetails.companyName,
          companyPhone: orgDetails.companyPhone,
          companyAddr: {
            addressLine1: orgDetails.companyAddr.addressLine1,
            country: orgDetails.companyAddr.country.value,
            state: orgDetails.companyAddr.state.value,
            city: orgDetails.companyAddr.city.value,
            zipcode: orgDetails.companyAddr.zipcode,
          },
          companyRate: orgDetails.companyRate,
        },
        { abortEarly: false }
      );
      await updateOrgDetails();
      navigate(`/profile/edit/organization-details`, { replace: true });
    } catch (err) {
      const errObj = {
        companyNameErr: "",
        companyPhoneErr: "",
        addressLine1Err: "",
        stateErr: "",
        countryErr: "",
        cityErr: "",
        zipcodeErr: "",
        companyRateErr: "",
      };

      err.inner.map(item => {
        errObj[`${item.path.split(".").pop()}Err`] = item.message;
      });
      setErrDetails(errObj);
    }
  };

  const updateOrgDetails = async () => {
    try {
      setIsLoading(true);
      const formD = new FormData();
      formD.append("company[name]", orgDetails.companyName);
      formD.append("company[business_phone]", orgDetails.companyPhone);
      formD.append("company[country]", orgDetails.companyAddr.country.value);
      formD.append("company[base_currency]", orgDetails.companyCurrency);
      formD.append(
        "company[standard_price]",
        orgDetails.companyRate.toString()
      );

      formD.append("company[fiscal_year_end]", orgDetails.companyFiscalYear);
      formD.append("company[date_format]", orgDetails.companyDateFormat);
      formD.append("company[timezone]", orgDetails.companyTimezone);
      formD.append(
        "company[addresses_attributes[0][id]]",
        orgDetails.companyAddr.id
      );

      formD.append(
        "company[addresses_attributes[0][address_line_1]]",
        orgDetails.companyAddr.addressLine1
      );

      formD.append(
        "company[addresses_attributes[0][address_line_2]]",
        orgDetails.companyAddr.addressLine2
      );

      formD.append(
        "company[addresses_attributes[0][state]]",
        orgDetails.companyAddr.state?.value
      );

      formD.append(
        "company[addresses_attributes[0][city]]",
        orgDetails.companyAddr.city?.value
      );

      formD.append(
        "company[addresses_attributes[0][country]]",
        orgDetails.companyAddr.country?.value
      );

      formD.append(
        "company[addresses_attributes[0][pin]]",
        orgDetails.companyAddr.zipcode
      );

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

  const handleOnChangeCity = selectCity => {
    const { companyAddr } = orgDetails;
    const changedCountry = { ...companyAddr, city: selectCity };
    setOrgDetails({ ...orgDetails, companyAddr: changedCountry });
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
        <div className="flex h-80v w-full flex-col justify-center">
          <Loader />
        </div>
      ) : (
        <StaticPage
          cancelAction={handleCancelAction}
          saveAction={handleUpdateOrgDetails}
          orgDetails={orgDetails}
          isDragActive={isDragActive}
          getInputProps={getInputProps}
          getRootProps={getRootProps}
          handleDeleteLogo={handleDeleteLogo}
          onLogoChange={onLogoChange}
          errDetails={errDetails}
          handleChangeCompanyDetails={handleChangeCompanyDetails}
          handleAddrChange={handleAddrChange}
          handleOnChangeCountry={handleOnChangeCountry}
          countries={countries}
          handleOnChangeState={handleOnChangeState}
          stateList={stateList}
          handleOnChangeCity={handleOnChangeCity}
          promiseOptions={promiseOptions}
          handleZipcodeChange={handleZipcodeChange}
          handleCurrencyChange={handleCurrencyChange}
          currenciesOption={currenciesOption}
          handleTimezoneChange={handleTimezoneChange}
          timezoneOption={timezoneOption}
          handleDateFormatChange={handleDateFormatChange}
          dateFormatOptions={dateFormatOptions}
          handleFiscalYearChange={handleFiscalYearChange}
          fiscalYearOptions={fiscalYearOptions}
        />
      )}
    </div>
  );
};

export default OrgEdit;
