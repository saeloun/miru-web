/* eslint-disable @typescript-eslint/no-var-requires */

import React, { useEffect, useState } from "react";

import {
  DeleteIconSVG,
  EditImageButtonSVG,
  PasswordIconSVG,
  PasswordIconTextSVG,
  PlusIconSVG,
} from "miruIcons";
import { Toastr } from "StyledComponents";
import * as Yup from "yup";

import profileApi from "apis/profile";
import teamApi from "apis/team";
import teamsApi from "apis/teams";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
import { sendGAPageView } from "utils/googleAnalytics";

import { useUserContext } from "../../../context/UserContext";
import { useProfile } from "../context/EntryContext";
import Header from "../Header";

const userProfileSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  changePassword: Yup.boolean(),
  password: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string().required("Please enter password"),
  }),
  currentPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string().required("Please enter current password"),
  }),

  confirmPassword: Yup.string().when("changePassword", {
    is: true,
    then: Yup.string().oneOf(
      [Yup.ref("password"), null],
      "Passwords don't match"
    ),
  }),
});

const UserDetails = () => {
  const initialErrState = {
    firstNameErr: "",
    lastNameErr: "",
    passwordErr: "",
    currentPasswordErr: "",
    confirmPasswordErr: "",
  };

  const { setUserState } = useProfile();
  const { user } = useUserContext();
  const [profileImage, setProfileImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileImageChange = e => {
    const imageFile = e.target.files[0];
    setProfileImage(URL.createObjectURL(imageFile));
    setImageFile(imageFile);
    setIsDetailUpdated(true);
  };

  const handleUpdateProfile = async () => {
    try {
      await userProfileSchema.validate(
        {
          firstName,
          lastName,
          changePassword,
          password,
          confirmPassword,
          currentPassword,
        },
        { abortEarly: false }
      );
      await updateProfile();
    } catch (err) {
      setIsLoading(false);
      const errObj = initialErrState;
      err.inner.map(item => {
        errObj[`${item.path}Err`] = item.message;
      });
      setErrDetails(errObj);
    }
  };

  const updateProfile = async () => {
    try {
      setIsLoading(true);
      const formD = new FormData();
      formD.append("user[first_name]", firstName);
      formD.append("user[last_name]", lastName);
      if (changePassword) {
        formD.append("user[current_password]", currentPassword);
        formD.append("user[password]", password);
        formD.append("user[password_confirmation]", confirmPassword);
      }

      if (imageFile) {
        formD.append("user[avatar]", imageFile);
      }
      await profileApi.update(formD);
      setIsDetailUpdated(false);
      setErrDetails(initialErrState);
      setUserState("profileSettings", {
        firstName,
        lastName,
      });
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      Toastr.error("Error in Updating user Details");
    }
  };

  const handleFirstNameChange = event => {
    setFirstName(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, firstNameErr: "" });
  };

  const handleLastNameChange = event => {
    setLastName(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, lastNameErr: "" });
  };

  const handleCurrentPasswordChange = event => {
    setCurrentPassword(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, currentPasswordErr: "" });
  };

  const handlePasswordChange = event => {
    setPassword(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, passwordErr: "" });
  };

  const handleConfirmPasswordChange = event => {
    setConfirmPassword(event.target.value);
    setIsDetailUpdated(true);
  };

  const getData = async () => {
    setIsLoading(true);
    const data = await teamsApi.get(user.id);
    if (data.status && data.status == 200) {
      setFirstName(data.data.first_name);
      setLastName(data.data.last_name);
      setProfileImage(data.data.avatar_url);
      setEmail(data.data.email);
      setUserState("profileSettings", {
        firstName: data.data.first_name,
        lastName: data.data.last_name,
        email: data.data.email,
      });
      setIsLoading(false);
    } else {
      setFirstName("");
      setLastName("");
      setProfileImage("");
      setEmail("");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    sendGAPageView();
    getData();
  }, []);

  const handleCancelAction = () => {
    getData();
    setIsDetailUpdated(false);
    setErrDetails(initialErrState);
    setChangePassword(false);
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleDeleteLogo = async () => {
    const removeProfile = await teamApi.destroyTeamMemberAvatar(user.id);
    if (removeProfile.status === 200) {
      setImageFile(null);
      setProfileImage("");
    }
  };

  const getErr = errMsg => <p className="text-sm text-red-600">{errMsg}</p>;

  return (
    <div className="flex w-full flex-col">
      <Header
        showButtons
        cancelAction={handleCancelAction}
        isDisableUpdateBtn={isDetailUpdated}
        saveAction={handleUpdateProfile}
        subTitle="View and manage profile settings"
        title="Profile Settings"
      />
      {isLoading ? (
        <div className="flex h-80v w-full items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mt-4 min-h-80v bg-miru-gray-100 pb-10 pt-10 pl-10 pr-10">
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Basic Details</div>
            <div className="w-full p-2">
              Profile Picture
              {profileImage ? (
                <div className="mt-2 flex flex-row">
                  <div className="h-20 w-20">
                    <img
                      alt="profile_pic"
                      className="h-full min-w-full rounded-full"
                      src={profileImage}
                    />
                  </div>
                  <label className="" htmlFor="file-input">
                    <img
                      alt="edit_pencil"
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
                    onChange={handleProfileImageChange}
                  />
                  <button className="" onClick={handleDeleteLogo}>
                    <img
                      alt="delete"
                      src={DeleteIconSVG}
                      style={{ minWidth: "20px" }}
                    />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-2 h-20 w-20 rounded border border-miru-han-purple-1000 ">
                    <label
                      className="items-cente flex h-full w-full cursor-pointer justify-center"
                      htmlFor="file-input"
                    >
                      <img
                        alt="profile_box"
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
                    onChange={handleProfileImageChange}
                  />
                </>
              )}
              <div className="mt-2 flex flex-col">
                <label className="mt-2">Name</label>
                <div className="mt-2 flex flex-row">
                  <div className="flex w-1/2 flex-col">
                    <input
                      className="mr-2 w-full border py-1 px-1"
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={firstName}
                      onChange={handleFirstNameChange}
                    />
                    {errDetails.firstNameErr && getErr(errDetails.firstNameErr)}
                  </div>
                  <div className="flex w-1/2 flex-col">
                    <input
                      className="ml-2 w-full border py-1 px-1"
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={lastName}
                      onChange={handleLastNameChange}
                    />
                    {errDetails.lastNameErr && getErr(errDetails.lastNameErr)}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <label>Email</label>
                <input
                  disabled
                  className="mt-2 w-full border py-1 px-1"
                  id="email"
                  name="email"
                  type="text"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Password</div>
            <div className="w-full p-2">
              <div>
                {!changePassword && (
                  <div>
                    <p
                      className=" cursor-pointer text-miru-han-purple-1000"
                      onClick={() => setChangePassword(true)}
                    >
                      CHANGE PASSWORD
                    </p>
                  </div>
                )}
                {changePassword && (
                  <div>
                    <div className="flex flex-col">
                      <div className="flex w-1/2 flex-col pr-2">
                        <label>Current Password</label>
                        <div className="relative flex items-center">
                          <input
                            className="mt-2 w-full border py-1 px-1"
                            id="current_password"
                            name="current_password"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={handleCurrentPasswordChange}
                          />
                          <button
                            className="btn btn-outline-primary absolute right-0 mt-2 mr-3"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                          >
                            {!showCurrentPassword ? (
                              <img alt="pass_icon" src={PasswordIconSVG} />
                            ) : (
                              <img
                                alt="pass_icon_text"
                                src={PasswordIconTextSVG}
                              />
                            )}
                          </button>
                        </div>
                        {errDetails.currentPasswordErr &&
                          getErr(errDetails.currentPasswordErr)}
                      </div>
                      <div className="mt-2 flex flex-row">
                        <div className="mt-2 flex w-1/2 flex-col pr-2">
                          <label className="mb-2">Password</label>
                          <div className="relative flex items-center">
                            <input
                              className=" mt-2 w-full border py-1 px-1"
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={handlePasswordChange}
                            />
                            <button
                              className="btn btn-outline-primary absolute right-0 mt-2 mr-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {!showPassword ? (
                                <img alt="pass_icon" src={PasswordIconSVG} />
                              ) : (
                                <img
                                  alt="pass_icon_text"
                                  src={PasswordIconTextSVG}
                                />
                              )}
                            </button>
                          </div>
                          {errDetails.passwordErr &&
                            getErr(errDetails.passwordErr)}
                        </div>
                        <div className="mt-2 flex w-1/2 flex-col pl-2">
                          <label className="mb-2">Confirm Password</label>
                          <div className="relative flex items-center">
                            <input
                              className="mt-2 w-full border py-1 px-1"
                              id="confirm_password"
                              name="confirm_password"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={handleConfirmPasswordChange}
                            />
                            <button
                              className="btn btn-outline-primary absolute right-0 mt-2 mr-3"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {!showConfirmPassword ? (
                                <img alt="pass_icon" src={PasswordIconSVG} />
                              ) : (
                                <img
                                  alt="pass_icon_text"
                                  src={PasswordIconTextSVG}
                                />
                              )}
                            </button>
                          </div>
                          {errDetails.confirmPasswordErr &&
                            getErr(errDetails.confirmPasswordErr)}
                        </div>
                      </div>
                      <p
                        className="mt-5 cursor-pointer text-miru-han-purple-1000"
                        onClick={() => {
                          setChangePassword(false);
                          setErrDetails(initialErrState);
                        }}
                      >
                        CANCEL
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
