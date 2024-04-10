/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useRef, useState } from "react";

import { Country } from "country-state-city";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";

import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import { useTeamDetails } from "context/TeamDetailsContext";
import { useUserContext } from "context/UserContext";
import { teamsMapper } from "mapper/teams.mapper";

import MobileEditPage from "./MobileEditPage";
import StaticPage from "./StaticPage";
import { userSchema } from "./validationSchema";

dayjs.extend(utc);

const addressOptions = [
  { label: "Current", value: "current" },
  { label: "Permanent", value: "permanent" },
];

const schema = Yup.object().shape(userSchema);

const EmploymentDetails = () => {
  const initialErrState = {
    first_name_err: "",
    last_name_err: "",
    address_line_1_err: "",
    country_err: "",
    state_err: "",
    city_err: "",
    email_id_err: "",
    pin_err: "",
  };

  const { memberId } = useParams();
  const {
    updateDetails,
    details: { personalDetails },
  } = useTeamDetails();
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();
  const wrapperRef = useRef(null);

  const [addrType, setAddrType] = useState({ label: "", value: "" });
  const [showDatePicker, setShowDatePicker] = useState({ visibility: false });
  const [countries, setCountries] = useState([]);
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setIsLoading] = useState(false);
  const [addrId, setAddrId] = useState();

  useOutsideClick(wrapperRef, () => setShowDatePicker({ visibility: false }));

  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.name,
      label: country.name,
      code: country.isoCode,
    }));
    setCountries(countryData);
  };

  const getDetails = async () => {
    const res: any = await teamsApi.get(memberId);
    const addRes = await teamsApi.getAddress(memberId);
    const teamsObj = teamsMapper(res.data, addRes.data.addresses[0]);
    updateDetails("personal", teamsObj);
    if (teamsObj.addresses?.address_type?.length > 0) {
      setAddrType(
        addressOptions.find(
          item => item.value === teamsObj.addresses.address_type
        )
      );
    }
    setAddrId(addRes.data.addresses[0]?.id);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
    getDetails();
  }, []);

  const handleOnChangeCountry = selectCountry => {
    updateDetails("personal", {
      ...personalDetails,
      ...{
        addresses: {
          ...personalDetails.addresses,
          ...{ country: selectCountry.value, state: "", city: "" },
        },
      },
    });
  };

  const handleOnChangeAddrType = addreType => {
    setAddrType(addreType);
    updateDetails("personal", {
      ...personalDetails,
      ...{
        addresses: {
          ...personalDetails.addresses,
          ...{ address_type: addreType.value },
        },
      },
    });
  };

  const updateBasicDetails = (value, type, isAddress = false) => {
    if (isAddress) {
      updateDetails("personal", {
        ...personalDetails,
        ...{
          addresses: { ...personalDetails.addresses, ...{ [type]: value } },
        },
      });
    } else {
      updateDetails("personal", {
        ...personalDetails,
        ...{ [type]: value },
      });
    }
  };

  const handleDatePicker = date => {
    setShowDatePicker({ visibility: !showDatePicker.visibility });
    const formattedDate = dayjs(date, personalDetails.date_format).format(
      personalDetails.date_format
    );

    updateDetails("personal", {
      ...personalDetails,
      ...{ date_of_birth: formattedDate },
    });
  };

  const handleUpdateDetails = async () => {
    try {
      await schema.validate(
        {
          ...personalDetails,
          ...{
            is_email: personalDetails.email_id
              ? personalDetails.email_id.length > 0
              : false,
          },
        },
        { abortEarly: false }
      );

      await teamsApi.updateUser(memberId, {
        user: {
          first_name: personalDetails.first_name,
          last_name: personalDetails.last_name,
          date_of_birth: personalDetails.date_of_birth
            ? dayjs
                .utc(personalDetails.date_of_birth, personalDetails.date_format)
                .toISOString()
            : null,
          phone: personalDetails.phone_number || "",
          personal_email_id: personalDetails.email_id,
          social_accounts: {
            linkedin_url: personalDetails.linkedin,
            github_url: personalDetails.github,
          },
        },
      });

      const payload = {
        address: {
          address_line_1: personalDetails.addresses.address_line_1,
          address_line_2: personalDetails.addresses.address_line_2,
          address_type: personalDetails.addresses.address_type,
          city: personalDetails.addresses.city,
          state: personalDetails.addresses.state,
          country: personalDetails.addresses.country,
          pin: personalDetails.addresses.pin,
        },
      };
      if (addrId) {
        await teamsApi.updateAddress(memberId, addrId, {
          address: { ...personalDetails.addresses },
        });
      } else {
        await teamsApi.createAddress(memberId, payload);
      }

      setErrDetails(initialErrState);
      navigate(`/team/${memberId}`, { replace: true });
    } catch (err) {
      setIsLoading(false);
      const errObj = initialErrState;
      if (err.inner) {
        err.inner.map(item => {
          if (item.path.includes("addresses")) {
            errObj[`${item.path.split(".").pop()}_err`] = item.message;
          } else {
            errObj[`${item.path}_err`] = item.message;
          }
        });
        setErrDetails(errObj);
      }
    }
  };

  const handlePhoneNumberChange = phoneNumber => {
    updateBasicDetails(phoneNumber, "phone_number", false);
  };

  const handleCancelDetails = () => {
    setIsLoading(true);
    navigate(`/team/${memberId}`, { replace: true });
  };

  return (
    <Fragment>
      {isDesktop && (
        <Fragment>
          <div className="flex items-center justify-between bg-miru-han-purple-1000 px-10 py-4">
            <h1 className="text-2xl font-bold text-white">Personal Details</h1>
            <div>
              <button
                className="mx-1 cursor-pointer rounded-md border border-white bg-miru-han-purple-1000 px-3 py-2 font-bold text-white	"
                onClick={handleCancelDetails} // eslint-disable-line  @typescript-eslint/no-empty-function
              >
                Cancel
              </button>
              <button
                className="mx-1 cursor-pointer rounded-md border bg-white px-3 py-2 font-bold text-miru-han-purple-1000"
                onClick={handleUpdateDetails}
              >
                Update
              </button>
            </div>
          </div>
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <StaticPage
              addrType={addrType}
              addressOptions={addressOptions}
              countries={countries}
              dateFormat={personalDetails.date_format}
              errDetails={errDetails}
              handleDatePicker={handleDatePicker}
              handleOnChangeAddrType={handleOnChangeAddrType}
              handleOnChangeCountry={handleOnChangeCountry}
              handlePhoneNumberChange={handlePhoneNumberChange}
              personalDetails={personalDetails}
              setShowDatePicker={setShowDatePicker}
              showDatePicker={showDatePicker}
              updateBasicDetails={updateBasicDetails}
              wrapperRef={wrapperRef}
            />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileDetailsHeader
            href={`/team/${memberId}/details`}
            title="Personal Details"
          />
          {isLoading ? (
            <div className="flex min-h-70v items-center justify-center">
              <Loader />
            </div>
          ) : (
            <MobileEditPage
              addrType={addrType}
              addressOptions={addressOptions}
              countries={countries}
              dateFormat={personalDetails.date_format}
              errDetails={errDetails}
              handleCancelDetails={handleCancelDetails}
              handleDatePicker={handleDatePicker}
              handleOnChangeAddrType={handleOnChangeAddrType}
              handleOnChangeCountry={handleOnChangeCountry}
              handlePhoneNumberChange={handlePhoneNumberChange}
              handleUpdateDetails={handleUpdateDetails}
              personalDetails={personalDetails}
              setShowDatePicker={setShowDatePicker}
              showDatePicker={showDatePicker}
              updateBasicDetails={updateBasicDetails}
              wrapperRef={wrapperRef}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default EmploymentDetails;
