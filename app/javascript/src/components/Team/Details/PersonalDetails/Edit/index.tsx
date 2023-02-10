import React, { Fragment, useEffect, useState } from "react";

import { Country, State, City } from "country-state-city";

import { useTeamDetails } from "context/TeamDetailsContext";

import StaticPage from "./StaticPage";

const addressOptions = [
  { label: "Permanent", value: "permanent" },
  { label: "Temperory", value: "temperory" },
];

const EmploymentDetails = () => {
  const {
    updateDetails,
    details: { personalDetails },
  } = useTeamDetails();

  const [countryDetails, setCountryDetails] = useState({
    label: "",
    value: "",
  });
  const [stateDetails, setStateDetails] = useState({ label: "", value: "" });
  const [cityList, setCityList] = useState([]);
  const [addrType, setAddrType] = useState({ label: "", value: "" });
  const [showDatePicker, setShowDatePicker] = useState({ visibility: false });
  const [countries, setCountries] = useState([]);

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountries(countryData);
  };

  useEffect(() => {
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
  }, []);

  const handleOnChangeCountry = selectCountry => {
    setCountryDetails(selectCountry);
    updateDetails("personal", {
      ...personalDetails,
      ...{ country: selectCountry.value },
    });
  };

  const updatedStates = countryCode =>
    State.getStatesOfCountry(countryCode).map(state => ({
      label: state.name,
      value: state.isoCode,
      ...state,
    }));

  const handleOnChangeAddrType = addreType => {
    setAddrType(addreType);
    updateDetails("personal", {
      ...personalDetails,
      ...{ address_type: addreType.value },
    });
  };

  const handleOnChangeState = selectState => {
    setStateDetails(selectState);
    updateDetails("personal", {
      ...personalDetails,
      ...{ state: selectState.value },
    });

    const cities = City.getCitiesOfState(
      countryDetails.value,
      selectState.value
    ).map(city => ({ label: city.name, value: city.name, ...city }));
    setCityList(cities);
  };

  const filterCities = (inputValue: string) => {
    const city = cityList.filter(i =>
      i.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    return city.length ? city : [{ label: inputValue, value: inputValue }];
  };

  const promiseOptions = (inputValue: string) =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve(filterCities(inputValue));
      }, 1000);
    });

  const updateBasicDetails = (value, type) => {
    updateDetails("personal", {
      ...personalDetails,
      ...{ [type]: value },
    });
  };

  const handleDatePicker = date => {
    setShowDatePicker({ visibility: !showDatePicker.visibility });
    updateDetails("personal", {
      ...personalDetails,
      ...{ dob: date },
    });
  };

  return (
    <Fragment>
      <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
        <h1 className="text-2xl font-bold text-white">Personal Details</h1>
        <div>
          <button
            className="mx-1 cursor-auto rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white	"
            data-cy="update-profile"
            onClick={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
          >
            Cancel
          </button>
          <button
            className="mx-1 cursor-auto rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000"
            data-cy="update-profile"
            onClick={() => {}} // eslint-disable-line  @typescript-eslint/no-empty-function
          >
            Update
          </button>
        </div>
      </div>
      <StaticPage
        addrType={addrType}
        addressOptions={addressOptions}
        countries={countries}
        handleDatePicker={handleDatePicker}
        handleOnChangeAddrType={handleOnChangeAddrType}
        handleOnChangeCountry={handleOnChangeCountry}
        handleOnChangeState={handleOnChangeState}
        personalDetails={personalDetails}
        promiseOptions={promiseOptions}
        selectedCountry={countryDetails}
        selectedState={stateDetails}
        setShowDatePicker={setShowDatePicker}
        showDatePicker={showDatePicker}
        updateBasicDetails={updateBasicDetails}
        updatedStates={updatedStates}
      />
    </Fragment>
  );
};
export default EmploymentDetails;
