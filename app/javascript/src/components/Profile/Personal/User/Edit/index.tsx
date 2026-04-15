import React, { Fragment, useEffect, useRef, useState } from "react";

import { passkeysApi, profileApi, teamsApi, totpApi } from "apis/api";
import Loader from "common/Loader/index";
import { MobileDetailsHeader } from "common/Mobile/MobileDetailsHeader";
import EditHeader from "components/Profile/Common/EditHeader";
import { useProfileContext } from "context/Profile/ProfileContext";
import { useUserContext } from "context/UserContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useOutsideClick } from "helpers";
import { i18n } from "../../../../../i18n";
import { teamsMapper } from "mapper/teams.mapper";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { beginPasskeyRegistration } from "utils/passkeys";
import worldCountries from "world-countries";
import * as Yup from "yup";
import { useCurrentUser } from "~/hooks/useCurrentUser";

import MobileProfileEditor from "./MobileProfileEditor";
import ProfileEditor from "./ProfileEditor";
import ProfileImageCard from "./ProfileImageCard";
import { userSchema } from "./validationSchema";

dayjs.extend(utc);

const addressOptions = [
  { label: i18n.t("profile.current"), value: "current" },
  { label: i18n.t("profile.permanent"), value: "permanent" },
];

const schema = Yup.object().shape(userSchema);

const UserDetailsEdit = () => {
  const initialErrState = {
    first_name_err: "",
    last_name_err: "",
    date_of_birth_err: "",
    phone_number_err: "",
    address_line_1_err: "",
    country_err: "",
    state_err: "",
    city_err: "",
    email_id_err: "",
    pin_err: "",
  };

  const navigate = useNavigate();
  const { memberId } = useParams();
  const { avatarUrl, user, isDesktop, setCurrentAvatarUrl } = useUserContext();
  const { currentUser, refetch: refetchCurrentUser } = useCurrentUser();
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
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyRequiredForLogin, setPasskeyRequiredForLogin] = useState(false);
  const [passkeysBusy, setPasskeysBusy] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpBusy, setTotpBusy] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpProvisioningUri, setTotpProvisioningUri] = useState("");
  const [totpVerificationCode, setTotpVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState(0);

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
      const data = await teamsApi.get(currentUserId);
      const userData = data.data;
      setUserId(userData.id);

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
      console.error(i18n.t("profile.editProfile"), error);
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
      setCurrentUserId(memberId);
    }
  }, [isCalledFromSettings, currentUser, memberId]);

  useEffect(() => {
    if (currentUserId) {
      setIsLoading(true);
      assignCountries(worldCountries);
      getDetails();
    }
  }, [currentUserId]);

  const syncPasskeys = data => {
    setPasskeys(data.passkeys || []);
    setPasskeyRequiredForLogin(!!data.passkey_required_for_login);
  };

  const loadPasskeys = async () => {
    if (!isCalledFromSettings) return;

    const response = await passkeysApi.index();
    syncPasskeys(response.data);
  };

  const syncTotp = data => {
    setTotpEnabled(!!data.enabled);
    setRecoveryCodesCount(data.recovery_codes_count || 0);
    setTotpSecret(data.secret || "");
    setTotpProvisioningUri(data.provisioning_uri || "");
    setRecoveryCodes(data.recovery_codes || []);
  };

  const loadTotp = async () => {
    if (!isCalledFromSettings) return;

    const response = await totpApi.show();
    syncTotp(response.data);
  };

  useEffect(() => {
    if (isCalledFromSettings && currentUserId) {
      loadPasskeys();
      loadTotp();
    }
  }, [isCalledFromSettings, currentUserId]);

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
        locale: personalDetails.locale,
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
        const profileResponse = await profileApi.update({
          user: userSchema,
        });

        const updatedPasswordChangedAt =
          profileResponse?.data?.user?.password_changed_at;
        const updatedAvatarUrl = profileResponse?.data?.user?.avatar_url;

        if (updatedPasswordChangedAt) {
          updateDetails("personalDetails", {
            ...personalDetails,
            password_changed_at: updatedPasswordChangedAt,
          });
        }

        if (updatedAvatarUrl) {
          setCurrentAvatarUrl(updatedAvatarUrl);
        }

        await refetchCurrentUser();
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
      } else if (Array.isArray(err?.response?.data?.errors)) {
        err.response.data.errors.forEach(message => {
          if (message.includes("Date of birth")) {
            errObj.date_of_birth_err = message;
          } else if (message.includes("Phone")) {
            errObj.phone_number_err = message;
          }
        });

        if (errObj.date_of_birth_err || errObj.phone_number_err) {
          setErrDetails(errObj);
        } else {
          toast.error(err.response.data.errors[0]);
        }
      }
    }
  };

  const handlePhoneNumberChange = phoneNumber => {
    const digits = (phoneNumber || "").replace(/\D/g, "");
    const normalizedPhoneNumber =
      digits.length > 15 ? `+${digits.slice(0, 15)}` : phoneNumber;

    updateBasicDetails(normalizedPhoneNumber, "phone_number", false);
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

  const handleAvatarChange = async avatarUrl => {
    setCurrentAvatarUrl(avatarUrl);
    await refetchCurrentUser();
  };

  const handleRegisterPasskey = async () => {
    try {
      setPasskeysBusy(true);
      const optionsResponse = await passkeysApi.registrationOptions();
      const credential = await beginPasskeyRegistration(
        optionsResponse.data.public_key
      );

      const response = await passkeysApi.create({
        challenge_token: optionsResponse.data.challenge_token,
        credential,
      });

      syncPasskeys(response.data);
      toast.success(i18n.t("passkeys.addedSuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error.message ||
          i18n.t("passkeys.addFailed")
      );
    } finally {
      setPasskeysBusy(false);
    }
  };

  const handleRemovePasskey = async id => {
    try {
      setPasskeysBusy(true);
      const response = await passkeysApi.destroy(id);
      syncPasskeys(response.data);
      toast.success(i18n.t("passkeys.removedSuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error || i18n.t("passkeys.removeFailed")
      );
    } finally {
      setPasskeysBusy(false);
    }
  };

  const handleTogglePasskeyRequirement = async required => {
    try {
      setPasskeysBusy(true);
      const response = await passkeysApi.updateRequirement({ required });
      syncPasskeys(response.data);
      toast.success(
        required
          ? i18n.t("passkeys.requirementEnabled")
          : i18n.t("passkeys.requirementDisabled")
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          i18n.t("passkeys.updateRequirementFailed")
      );
    } finally {
      setPasskeysBusy(false);
    }
  };

  const handleSetupTotp = async () => {
    try {
      setTotpBusy(true);
      const response = await totpApi.setup();
      syncTotp(response.data);
      setTotpVerificationCode("");
      toast.success(i18n.t("twoFactor.setupReadySuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error || i18n.t("twoFactor.setupFailed")
      );
    } finally {
      setTotpBusy(false);
    }
  };

  const handleConfirmTotp = async () => {
    try {
      setTotpBusy(true);
      const response = await totpApi.confirm({ code: totpVerificationCode });
      syncTotp(response.data);
      setTotpVerificationCode("");
      toast.success(i18n.t("twoFactor.enabledSuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error || i18n.t("twoFactor.enableFailed")
      );
    } finally {
      setTotpBusy(false);
    }
  };

  const handleDisableTotp = async () => {
    try {
      setTotpBusy(true);
      const response = await totpApi.destroy();
      syncTotp(response.data);
      setTotpVerificationCode("");
      toast.success(i18n.t("twoFactor.disabledSuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error || i18n.t("twoFactor.disableFailed")
      );
    } finally {
      setTotpBusy(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    try {
      setTotpBusy(true);
      const response = await totpApi.regenerateRecoveryCodes();
      syncTotp(response.data);
      toast.success(i18n.t("twoFactor.regeneratedSuccess"));
    } catch (error) {
      toast.error(
        error?.response?.data?.error || i18n.t("twoFactor.regenerateFailed")
      );
    } finally {
      setTotpBusy(false);
    }
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
            title={i18n.t("profile.personalDetails")}
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <ProfileEditor
              avatarSection={
                isCalledFromSettings && currentUserId ? (
                  <ProfileImageCard
                    displayName={
                      `${personalDetails.first_name || ""} ${
                        personalDetails.last_name || ""
                      }`.trim() || i18n.t("profile.userFallback")
                    }
                    imageUrl={avatarUrl || currentUser?.avatar_url}
                    onAvatarChange={handleAvatarChange}
                    userId={currentUserId}
                  />
                ) : null
              }
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
              canManagePasskeys={isCalledFromSettings}
              onRegisterPasskey={handleRegisterPasskey}
              onRemovePasskey={handleRemovePasskey}
              onTogglePasskeyRequirement={handleTogglePasskeyRequirement}
              passkeyRequiredForLogin={passkeyRequiredForLogin}
              passkeys={passkeys}
              passkeysBusy={passkeysBusy}
              onConfirmTotp={handleConfirmTotp}
              onDisableTotp={handleDisableTotp}
              onGenerateRecoveryCodes={handleRegenerateRecoveryCodes}
              onSetupTotp={handleSetupTotp}
              recoveryCodes={recoveryCodes}
              recoveryCodesCount={recoveryCodesCount}
              setTotpVerificationCode={setTotpVerificationCode}
              totpBusy={totpBusy}
              totpEnabled={totpEnabled}
              totpProvisioningUri={totpProvisioningUri}
              totpSecret={totpSecret}
              totpVerificationCode={totpVerificationCode}
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
            title={i18n.t("profile.personalDetails")}
          />
          {isLoading ? (
            <Loader className="min-h-70v" />
          ) : (
            <MobileProfileEditor
              avatarSection={
                isCalledFromSettings && currentUserId ? (
                  <ProfileImageCard
                    displayName={
                      `${personalDetails.first_name || ""} ${
                        personalDetails.last_name || ""
                      }`.trim() || i18n.t("profile.userFallback")
                    }
                    imageUrl={avatarUrl || currentUser?.avatar_url}
                    onAvatarChange={handleAvatarChange}
                    userId={currentUserId}
                  />
                ) : null
              }
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
              canManagePasskeys={isCalledFromSettings}
              onRegisterPasskey={handleRegisterPasskey}
              onRemovePasskey={handleRemovePasskey}
              onTogglePasskeyRequirement={handleTogglePasskeyRequirement}
              passkeyRequiredForLogin={passkeyRequiredForLogin}
              passkeys={passkeys}
              passkeysBusy={passkeysBusy}
              onConfirmTotp={handleConfirmTotp}
              onDisableTotp={handleDisableTotp}
              onGenerateRecoveryCodes={handleRegenerateRecoveryCodes}
              onSetupTotp={handleSetupTotp}
              recoveryCodes={recoveryCodes}
              recoveryCodesCount={recoveryCodesCount}
              setTotpVerificationCode={setTotpVerificationCode}
              totpBusy={totpBusy}
              totpEnabled={totpEnabled}
              totpProvisioningUri={totpProvisioningUri}
              totpSecret={totpSecret}
              totpVerificationCode={totpVerificationCode}
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
