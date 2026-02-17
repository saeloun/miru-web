import React, { Fragment, useEffect, useRef, useState } from "react";

import { profileApi, teamsApi } from "apis/api";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { teamsMapper } from "mapper/teams.mapper";
import { useNavigate } from "react-router-dom";
import worldCountries from "world-countries";
import * as Yup from "yup";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import MobileEditPage from "./MobileEditPage";
import EditProfilePage from "./StaticPage";
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
  const { user, isDesktop } = useUserContext();
  const { currentUser } = useCurrentUser();
  const { personalDetails, isCalledFromSettings, updateDetails } =
    useProfileContext();

  // Get current user ID from _me endpoint when in settings, or use personalDetails.id for team view
  const [currentUserId, setCurrentUserId] = useState(null);

  const wrapperRef = useRef(null);

  const [addrType, setAddrType] = useState({ label: "", value: "" });
  const [showDatePicker, setShowDatePicker] = useState({ visibility: false });
  const [countries, setCountries] = useState([]);
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setIsLoading] = useState(false);
  const [addrId, setAddrId] = useState();
  const [userId, setUserId] = useState();
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigateToPath = isCalledFromSettings
    ? "/settings"
    : `/team/${currentUserId || personalDetails?.id}`;

  useOutsideClick(wrapperRef, () => setShowDatePicker({ visibility: false }));
  const assignCountries = async allCountries => {
    const countryData = await allCountries.map(country => ({
      value: country.cca2,
      label: country.name.common,
      code: country.cca2,
    }));
    setCountries(countryData);
  };

  const getDetails = async () => {
    if (!currentUserId) return;

    try {
      let userData;

      if (isCalledFromSettings) {
        // Use fresh user data from _me endpoint for settings
        userData = currentUser;
        if (userData) {
          setUserId(userData.id);
        }
      } else {
        // Use teams API for team member view
        const data = await teamsApi.get(currentUserId);
        userData = data.data;
        setUserId(userData.id);
      }

      if (userData) {
        const addressData = await teamsApi.getAddress(userData.id);
        const userObj = teamsMapper(userData, addressData.data.addresses[0]);

        updateDetails("personalDetails", userObj);

        if (userObj.addresses?.address_type?.length > 0) {
          setAddrType(
            addressOptions.find(
              item => item.value === userObj.addresses.address_type
            )
          );
        }
        setAddrId(addressData.data.addresses[0]?.id);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }

    setIsLoading(false);
  };

  // Effect to determine current user ID
  useEffect(() => {
    if (isCalledFromSettings) {
      // Use fresh user data from _me endpoint for settings
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }
    } else {
      // Use personalDetails.id for team view
      setCurrentUserId(personalDetails?.id);
    }
  }, [isCalledFromSettings, currentUser, personalDetails?.id]);

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      assignCountries(worldCountries);
      getDetails();
    }
  }, [currentUserId]);

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

      if (isCalledFromSettings) {
        await profileApi.update({
          user: userSchema,
        });
      } else {
        await teamsApi.updateUser(currentUserId, {
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
            <EditProfilePage
              _confirmPassword={confirmPassword}
              _currentPassword={currentPassword}
              _getErr={getErr}
              _handleConfirmPasswordChange={handleConfirmPasswordChange}
              _handleCurrentPasswordChange={handleCurrentPasswordChange}
              _handlePasswordChange={handlePasswordChange}
              _password={password}
              addrType={addrType}
              addressOptions={addressOptions}
              cancelPasswordChange={cancelPasswordChange}
              changePassword={changePassword}
              countries={countries}
              dateFormat={personalDetails.date_format}
              errDetails={errDetails}
              handleDatePicker={handleDatePicker}
              handleOnChangeAddrType={handleOnChangeAddrType}
              handleOnChangeCountry={handleOnChangeCountry}
              handlePhoneNumberChange={handlePhoneNumberChange}
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
