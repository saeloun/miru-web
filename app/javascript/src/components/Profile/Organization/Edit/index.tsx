import React, { useCallback, useEffect, useState } from "react";

import { Country } from "country-state-city";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";
import * as Yup from "yup";

import companiesApi from "apis/companies";
import companyProfileApi from "apis/companyProfile";
import Loader from "common/Loader/index";
import { currencyList } from "constants/currencyList";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import { StaticPage } from "./StaticPage";

import EditHeader from "../../Common/EditHeader";

const phoneRegExp =
  /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/;

const orgSchema = Yup.object().shape({
  companyName: Yup.string()
    .required("Name cannot be blank")
    .max(30, "Maximum 30 characters are allowed"),
  companyPhone: Yup.string().matches(
    phoneRegExp,
    "Please enter a valid business phone number"
  ),
  companyAddr: Yup.object().shape({
    addressLine1: Yup.string()
      .required("Address Line 1 cannot be blank")
      .max(50, "Maximum 50 characters are allowed"),
    addressLine2: Yup.string().max(50, "Maximum 50 characters are allowed"),
    country: Yup.string().required("Country cannot be blank"),
    state: Yup.string().required("State cannot be blank"),
    city: Yup.string().required("City cannot be blank"),
    zipcode: Yup.string()
      .required("Zipcode cannot be blank")
      .max(10, "Maximum 10 characters are allowed"),
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
    city: "",
    country: {
      label: "",
      value: "",
      code: "",
    },
    state: "",
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
  addressLine2Err: "",
  stateErr: "",
  countryErr: "",
  cityErr: "",
  zipcodeErr: "",
};

const OrgEdit = () => {
  const navigate = useNavigate();
  const { setCompany } = useUserContext();
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
  }, [file, orgDetails]);

  const [currenciesOption, setCurrenciesOption] = useState([]);
  const [timezoneOption, setTimezoneOption] = useState([]);
  const [timezones, setTimezones] = useState({});
  /* eslint-disable-next-line */
  const [_isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState([]);

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

    const {
      id,
      address_line_1: addressLine1,
      address_line_2: addressLine2,
      city,
      state,
      pin,
      country,
    } = companyDetails.address;

    let isoCode = "";
    let name = "";
    if (country && country !== "") {
      const countryData = Country.getCountryByCode(country);
      isoCode = countryData ? countryData.isoCode : "";
      name = countryData ? countryData.name : "";
    }

    const orgAddr = {
      id,
      addressLine1,
      addressLine2,
      city,
      country: {
        label: name,
        value: isoCode,
        code: isoCode,
      },
      state,
      zipcode: pin,
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

    let timezoneOptionList = [];
    if (timeZonesForCountry) {
      timezoneOptionList = timeZonesForCountry.map(item => ({
        value: item,
        label: item,
      }));
    }

    setTimezoneOption(timezoneOptionList);
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
      setErrDetails({ ...errDetails, [`${type}Err`]: "" });
    },
    [orgDetails, errDetails]
  );

  const handleOnChangeCountry = selectCountry => {
    const { companyAddr } = orgDetails;
    const changedCountry = {
      ...companyAddr,
      country: selectCountry,
      state: "",
      city: "",
    };

    setupTimezone(
      { ...orgDetails, companyAddr: changedCountry },
      selectCountry.code
    );
    setIsDetailUpdated(true);
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

  const handleZipcodeChange = e => {
    const { companyAddr } = orgDetails;
    const changedZipCode = { ...companyAddr, zipcode: e.target.value };
    setOrgDetails({ ...orgDetails, companyAddr: changedZipCode });
    setIsDetailUpdated(true);
  };

  const handleStateChange = e => {
    const { companyAddr } = orgDetails;
    const changedState = { ...companyAddr, state: e.target.value };
    setOrgDetails({ ...orgDetails, companyAddr: changedState });
    setIsDetailUpdated(true);
  };

  const handleCityChange = e => {
    const { companyAddr } = orgDetails;
    const changedCity = { ...companyAddr, city: e.target.value };
    setOrgDetails({ ...orgDetails, companyAddr: changedCity });
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
            addressLine2: orgDetails.companyAddr.addressLine2,
            country: orgDetails.companyAddr.country.value,
            state: orgDetails.companyAddr.state,
            city: orgDetails.companyAddr.city,
            zipcode: orgDetails.companyAddr.zipcode,
          },
          companyRate: orgDetails.companyRate,
        },
        { abortEarly: false }
      );
      await updateOrgDetails();
      navigate(`/settings/organization`, { replace: true });
    } catch (err) {
      const errObj = {
        companyNameErr: "",
        companyPhoneErr: "",
        addressLine1Err: "",
        addressLine2Err: "",
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
      formD.append("company[business_phone]", orgDetails.companyPhone || "");
      formD.append("company[country]", orgDetails.companyAddr.country.value);
      formD.append("company[base_currency]", orgDetails.companyCurrency);
      formD.append(
        "company[standard_price]",
        orgDetails.companyRate.toString()
      );

      formD.append("company[fiscal_year_end]", orgDetails.companyFiscalYear);
      formD.append("company[date_format]", orgDetails.companyDateFormat);
      formD.append("company[timezone]", orgDetails.companyTimezone);
      if (orgDetails.companyAddr.id) {
        formD.append(
          "company[addresses_attributes][0][id]",
          orgDetails.companyAddr.id
        );
      }

      formD.append(
        "company[addresses_attributes][0][address_line_1]",
        orgDetails.companyAddr.addressLine1
      );

      formD.append(
        "company[addresses_attributes][0][address_line_2]",
        orgDetails.companyAddr.addressLine2
      );

      formD.append(
        "company[addresses_attributes][0][state]",
        orgDetails.companyAddr.state
      );

      formD.append(
        "company[addresses_attributes][0][city]",
        orgDetails.companyAddr.city
      );

      formD.append(
        "company[addresses_attributes][0][country]",
        orgDetails.companyAddr.country?.value
      );

      formD.append(
        "company[addresses_attributes][0][pin]",
        orgDetails.companyAddr.zipcode
      );

      if (orgDetails.logo) {
        formD.append("company[logo]", orgDetails.logo);
      }
      const res = await companiesApi.update(orgDetails.id, formD);
      setCompany(res.data.company);
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
    navigate(`/settings/organization`, { replace: true });
  };

  const handleDeleteLogo = async () => {
    const removeLogo = await companiesApi.removeLogo(orgDetails.id);
    if (removeLogo.status === 200) {
      setOrgDetails({ ...orgDetails, logoUrl: null, logo: null });
    }
  };

  return (
    <div className="flex w-full flex-col">
      <EditHeader
        showButtons
        cancelAction={handleCancelAction}
        isDisableUpdateBtn={false}
        saveAction={handleUpdateOrgDetails}
        subTitle=""
        title="Organization Settings"
      />
      {isLoading ? (
        <Loader className="min-h-70v" />
      ) : (
        <StaticPage
          cancelAction={handleCancelAction}
          countries={countries}
          currenciesOption={currenciesOption}
          dateFormatOptions={dateFormatOptions}
          errDetails={errDetails}
          fiscalYearOptions={fiscalYearOptions}
          getInputProps={getInputProps}
          getRootProps={getRootProps}
          handleAddrChange={handleAddrChange}
          handleChangeCompanyDetails={handleChangeCompanyDetails}
          handleCityChange={handleCityChange}
          handleCurrencyChange={handleCurrencyChange}
          handleDateFormatChange={handleDateFormatChange}
          handleDeleteLogo={handleDeleteLogo}
          handleFiscalYearChange={handleFiscalYearChange}
          handleOnChangeCountry={handleOnChangeCountry}
          handleStateChange={handleStateChange}
          handleTimezoneChange={handleTimezoneChange}
          handleZipcodeChange={handleZipcodeChange}
          isDragActive={isDragActive}
          orgDetails={orgDetails}
          saveAction={handleUpdateOrgDetails}
          timezoneOption={timezoneOption}
          onLogoChange={onLogoChange}
        />
      )}
    </div>
  );
};

export default OrgEdit;
