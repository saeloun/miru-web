/* eslint-disable no-unused-vars */
import React, { Fragment, useEffect, useRef, useState } from "react";

import { Country } from "country-state-city";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

import profileApi from "apis/profile";
import teamsApi from "apis/teams";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
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

const UserDetailsEdit = () => {
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

  const navigate = useNavigate();
  const { isDesktop, user } = useUserContext();
  const {
    personalDetails: { id },
  } = useProfileContext();

  const wrapperRef = useRef(null);

  const [addrType, setAddrType] = useState({ label: "", value: "" });
  const [showDatePicker, setShowDatePicker] = useState({ visibility: false });
  const [countries, setCountries] = useState([]);
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setIsLoading] = useState(false);
  const [addrId, setAddrId] = useState();
  const [userId, setUserId] = useState();
  const { updateDetails, personalDetails } = useProfileContext();
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigateToPath = user.id == id ? "/settings" : `/team/${id}`;

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
    const data = await teamsApi.get(id);
    const addressData = await teamsApi.getAddress(id);
    setUserId(data.data.id);

    const userObj = teamsMapper(data.data, addressData.data.addresses[0]);
    updateDetails("personalDetails", userObj);
    if (userObj.addresses?.address_type?.length > 0) {
      setAddrType(
        addressOptions.find(
          item => item.value === userObj.addresses.address_type
        )
      );
    }
    setAddrId(addressData.data.addresses[0]?.id);
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    const allCountries = Country.getAllCountries();
    assignCountries(allCountries);
    getDetails();
  }, [id]);

  const cancelPasswordChange = () => {
    setChangePassword(false);
    updateDetails("personalDetails", {
      ...personalDetails,
      ...{ confirmPassword: "", password: "", currentPassword: "" },
    });
  };

  const handleOnChangeCountry = selectCountry => {
    updateDetails("personalDetails", {
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
    updateDetails("personalDetails", {
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
      updateDetails("personalDetails", {
        ...personalDetails,
        ...{
          addresses: { ...personalDetails.addresses, ...{ [type]: value } },
        },
      });
    } else {
      updateDetails("personalDetails", {
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

    updateDetails("personalDetails", {
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
            changePassword,
          },
        },
        { abortEarly: false }
      );

      const userSchema = {
        first_name: personalDetails.first_name,
        last_name: personalDetails.last_name,
        date_of_birth: personalDetails.date_of_birth
          ? dayjs
              .utc(personalDetails.date_of_birth, personalDetails.date_format)
              .toISOString()
          : null,
        phone: personalDetails.phone_number
          ? personalDetails.phone_number
          : null,
        personal_email_id: personalDetails.email_id,
        social_accounts: {
          linkedin_url: personalDetails.linkedin,
          github_url: personalDetails.github,
        },
      };
      if (changePassword) {
        userSchema["current_password"] = personalDetails.currentPassword;
        userSchema["password"] = personalDetails.password;
        userSchema["password_confirmation"] = personalDetails.confirmPassword;
      }

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

      if (user.id == id) {
        await profileApi.update({
          user: userSchema,
        });
      } else {
        await teamsApi.updateUser(id, {
          user: userSchema,
        });
      }

      if (addrId) {
        await teamsApi.updateAddress(userId, addrId, {
          address: { ...personalDetails.addresses },
        });
      } else {
        await teamsApi.createAddress(userId, payload);
      }

      setErrDetails(initialErrState);
      navigate(`${navigateToPath}/profile`, { replace: true });
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
    navigate(`${navigateToPath}/profile`, { replace: true });
  };

  const handleCurrentPasswordChange = event => {
    setCurrentPassword(event.target.value);
  };

  const getErr = errMsg => <p className="text-sm text-red-600">{errMsg}</p>;

  const handlePasswordChange = event => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = event => {
    setConfirmPassword(event.target.value);
  };

  return (
    <Fragment>
      {isDesktop && (
        <Fragment>
          <EditHeader
            showButtons
            cancelAction={handleCancelDetails}
            isDisableUpdateBtn={false}
            saveAction={handleUpdateDetails}
            subTitle=""
            title="Personal Details"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <StaticPage
              addrType={addrType}
              addressOptions={addressOptions}
              cancelPasswordChange={cancelPasswordChange}
              changePassword={changePassword}
              confirmPassword={confirmPassword}
              countries={countries}
              currentPassword={currentPassword}
              dateFormat={personalDetails.date_format}
              errDetails={errDetails}
              getErr={getErr}
              handleConfirmPasswordChange={handleConfirmPasswordChange}
              handleCurrentPasswordChange={handleCurrentPasswordChange}
              handleDatePicker={handleDatePicker}
              handleOnChangeAddrType={handleOnChangeAddrType}
              handleOnChangeCountry={handleOnChangeCountry}
              handlePasswordChange={handlePasswordChange}
              handlePhoneNumberChange={handlePhoneNumberChange}
              password={password}
              personalDetails={personalDetails}
              setChangePassword={setChangePassword}
              setErrDetails={setErrDetails}
              setShowConfirmPassword={setShowConfirmPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              setShowDatePicker={setShowDatePicker}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              showCurrentPassword={showCurrentPassword}
              showDatePicker={showDatePicker}
              showPassword={showPassword}
              updateBasicDetails={updateBasicDetails}
              wrapperRef={wrapperRef}
            />
          )}
        </Fragment>
      )}
      {!isDesktop && (
        <Fragment>
          <MobileDetailsHeader
            href={`${navigateToPath}/profile`}
            title="Personal Details"
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobileEditPage
              addrType={addrType}
              addressOptions={addressOptions}
              cancelPasswordChange={cancelPasswordChange}
              changePassword={changePassword}
              countries={countries}
              currentPassword={currentPassword}
              dateFormat={personalDetails.date_format}
              errDetails={errDetails}
              handleCancelDetails={handleCancelDetails}
              handleCurrentPasswordChange={handleCurrentPasswordChange}
              handleDatePicker={handleDatePicker}
              handleOnChangeAddrType={handleOnChangeAddrType}
              handleOnChangeCountry={handleOnChangeCountry}
              handlePhoneNumberChange={handlePhoneNumberChange}
              handleUpdateDetails={handleUpdateDetails}
              personalDetails={personalDetails}
              setChangePassword={setChangePassword}
              setErrDetails={setErrDetails}
              setShowConfirmPassword={setShowConfirmPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              setShowDatePicker={setShowDatePicker}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              showCurrentPassword={showCurrentPassword}
              showDatePicker={showDatePicker}
              showPassword={showPassword}
              updateBasicDetails={updateBasicDetails}
              wrapperRef={wrapperRef}
            />
          )}
        </Fragment>
      )}
    </Fragment>
  );
};

export default UserDetailsEdit;
