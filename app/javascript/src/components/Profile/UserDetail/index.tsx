/* eslint-disable @typescript-eslint/no-var-requires */

import React, { useEffect, useState } from "react";

import * as Yup from "yup";

import profileApi from "apis/profile";
import { Divider } from "common/Divider";
import Loader from "common/Loader/index";
// import { sendGAPageView } from "utils/googleAnalytics";

import Header from "../Header";

const deleteIcon = require("../../../../../assets/images/delete.svg");
const editButton = require("../../../../../assets/images/edit_image_button.svg");
const password_icon = require("../../../../../assets/images/password_icon.svg");
const password_icon_text = require("../../../../../assets/images/password_icon_text.svg");
const img = require("../../../../../assets/images/plus_icon.svg");

const userProfileSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  changePassword: Yup.boolean(),
  password: Yup
    .string()
    .when("changePassword", {
      is: true,
      then: Yup.string().required("Please enter password")
    }),
  currentPassword: Yup
    .string()
    .when("changePassword", {
      is: true,
      then: Yup.string().required("Please enter current password")
    }),

  confirmPassword: Yup
    .string()
    .when("changePassword", {
      is: true,
      then: Yup.string().oneOf([Yup.ref("password"), null], "Passwords don't match")
    })
});

const UserDetails = () => {
  const initialErrState = {
    firstNameErr: "",
    lastNameErr: "",
    passwordErr: "",
    currentPasswordErr: "",
    confirmPasswordErr: ""
  };

  const [profileImage, setProfileImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [showPasword, setShowPassword] = useState<boolean>(false);
  const [showCurrentPasword, setShowCurrentPassword] = useState<boolean>(false);
  const [showConfirmPasword, setShowConfirmPassword] = useState<boolean>(false);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [errDetails, setErrDetails] = useState(initialErrState);
  const [isLoading, setisLoading] = useState(false);

  const handleProfileImageChange = (e) => {
    const imageFile = e.target.files[0];
    setProfileImage(URL.createObjectURL(imageFile));
    setImageFile(imageFile);
    setIsDetailUpdated(true);
  };
  const handleUpdateProfile = async () => {
    userProfileSchema.validate({ firstName, lastName, changePassword, password, confirmPassword, currentPassword }, { abortEarly: false }).then(async () => {
      setisLoading(true);
      const formD = new FormData();
      formD.append(
        "user[first_name]", firstName
      );
      formD.append(
        "user[last_name]", lastName
      );
      formD.append(
        "user[color]", color
      );
      if (changePassword) {
        formD.append(
          "user[current_password]", currentPassword
        );
        formD.append(
          "user[password]", password
        );
        formD.append(
          "user[password_confirmation]", confirmPassword
        );
      }
      if (imageFile) {
        formD.append(
          "user[avatar]", imageFile
        );
      }
      await profileApi.update(formD);
      setIsDetailUpdated(false);
      setErrDetails(initialErrState);
      setisLoading(false);
    }).catch(function (err) {
      const errObj = initialErrState;
      err.inner.map((item) => {
        errObj[item.path + "Err"] = item.message;
      });
      setErrDetails(errObj);
    });
  };

  const handleFirstNameChange = (event) => {
    setFirstName(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, firstNameErr: "" });
  };

  const handleLastNameChange = (event) => {
    setLastName(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, lastNameErr: "" });
  };

  const handleColorChange = (event) => {
    setColor(event.target.value);
    setIsDetailUpdated(true);
  };

  const handleCurrentPasswordChange = (event) => {
    setCurrentPassword(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, currentPasswordErr: "" });
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setIsDetailUpdated(true);
    setErrDetails({ ...errDetails, passwordErr: "" });
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
    setIsDetailUpdated(true);
  };

  const getData = async () => {
    setisLoading(true);
    const data = await profileApi.index();
    setFirstName(data.data.user.first_name);
    setLastName(data.data.user.last_name);
    setProfileImage(data.data.user.avatar_url);
    setEmail(data.data.user.email);
    setColor(data.data.user.color);
    setisLoading(false);
  };

  useEffect(() => {
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
    const removeProfile = await profileApi.removeAvatar();
    if (removeProfile.status === 200) {
      setImageFile(null);
      setProfileImage("");
    }
  };

  const getErr = (errMsg) => <p className="text-sm text-red-600">{errMsg}</p>;

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={"Profile Settings"}
        subTitle={"View and manage profile settings"}
        showButtons={true}
        cancelAction={handleCancelAction}
        saveAction={handleUpdateProfile}
        isDisableUpdateBtn={isDetailUpdated}
      />
      {isLoading ? <Loader /> : (
        <div className="pt-10 pb-10 pl-10 pr-10 mt-4 bg-miru-gray-100 min-h-80v">
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Basic Details</div>
            <div className="w-full p-2">
              Profile Picture
              {profileImage ? (
                <div className="flex flex-row mt-2">
                  <div className="w-20 h-20">
                    <img src={profileImage} alt={"profile_pic"} className={"rounded-full min-w-full h-full"} />
                  </div>
                  <label htmlFor="file-input" className="">
                    <img src={editButton} alt={"edit_pencil"} className={"rounded-full mt-5 cursor-pointer"} style={{ "minWidth": "40px" }}></img>
                  </label>
                  <input id="file-input" type="file" name="myImage" className='hidden' onChange={handleProfileImageChange}>
                  </input>
                  <button className="" onClick={handleDeleteLogo}>
                    <img
                      src={deleteIcon}
                      alt="delete"
                      style={{ "minWidth": "20px" }}
                    />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 mt-2 border rounded border-miru-han-purple-1000 ">
                    <label htmlFor="file-input" className="flex justify-center w-full h-full cursor-pointer items-cente">
                      <img alt="profile_box" src={img} className="object-none" />
                    </label>
                  </div>
                  <input id="file-input" type="file" name="myImage" className='hidden' onChange={handleProfileImageChange} />
                </>
              )}
              <div className="flex flex-col mt-2">
                <label className="mt-2">Name</label>
                <div className="flex flex-row mt-2">
                  <div className="flex flex-col w-1/2">
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={firstName}
                      className="w-full px-1 py-1 mr-2 border"
                      onChange={handleFirstNameChange}
                    />
                    {errDetails.firstNameErr && getErr(errDetails.firstNameErr)}
                  </div>
                  <div className="flex flex-col w-1/2">
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={lastName}
                      className="w-full px-1 py-1 ml-2 border"
                      onChange={handleLastNameChange}
                    />
                    {errDetails.lastNameErr && getErr(errDetails.lastNameErr)}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <label>
                  Color
                </label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={color}
                  className="block w-40 h-10 p-0 my-2"
                  onChange={handleColorChange}
                />
              </div>
              <div className="mt-2">
                <label>Email</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={email}
                  className="w-full px-1 py-1 mt-2 border"
                  onChange={event => setEmail(event.target.value)}
                  disabled
                />
              </div>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-6">
            <div className="w-4/12 p-2 font-bold">Password</div>
            <div className="w-full p-2">
              <div>
                {
                  !changePassword && (
                    <div>
                      <p className="cursor-pointer text-miru-han-purple-1000" onClick={() => setChangePassword(true)}>CHANGE PASSWORD</p>
                    </div>
                  )
                }
                {
                  changePassword && (
                    <div>
                      <div className="flex flex-col">
                        <div className="flex flex-col w-1/2 pr-2">
                          <label>Current Password</label>
                          <div className="relative flex items-center">
                            <input
                              type={showCurrentPasword ? "text" : "password"}
                              id="current_password"
                              name="current_password"
                              value={currentPassword}
                              className="w-full px-1 py-1 mt-2 border"
                              onChange={handleCurrentPasswordChange}
                            />
                            <button className="absolute right-0 mt-2 mr-3 btn btn-outline-primary" onClick={() => setShowCurrentPassword(!showCurrentPasword)} >
                              {!showCurrentPasword ? <img src={password_icon} alt="pass_icon" /> : <img src={password_icon_text} alt="pass_icon_text" />}
                            </button>
                          </div>
                          {errDetails.currentPasswordErr && getErr(errDetails.currentPasswordErr)}
                        </div>
                        <div className="flex flex-row mt-2">
                          <div className="flex flex-col w-1/2 pr-2 mt-2">
                            <label className="mb-2">Password</label>
                            <div className="relative flex items-center">
                              <input
                                type={showPasword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={password}
                                className="w-full px-1 py-1 mt-2 border "
                                onChange={handlePasswordChange}
                              />
                              <button className="absolute right-0 mt-2 mr-3 btn btn-outline-primary" onClick={() => setShowPassword(!showPasword)}>
                                {!showPasword ? <img src={password_icon} alt="pass_icon" /> : <img src={password_icon_text} alt="pass_icon_text" />}
                              </button>
                            </div>
                            {errDetails.passwordErr && getErr(errDetails.passwordErr)}

                          </div>
                          <div className="flex flex-col w-1/2 pl-2 mt-2">
                            <label className="mb-2">Confirm Password</label>
                            <div className="relative flex items-center">
                              <input
                                type={showConfirmPasword ? "text" : "password"}
                                id="confirm_password"
                                name="confirm_password"
                                value={confirmPassword}
                                className="w-full px-1 py-1 mt-2 border"
                                onChange={handleConfirmPasswordChange}
                              />
                              <button className="absolute right-0 mt-2 mr-3 btn btn-outline-primary" onClick={() => setShowConfirmPassword(!showConfirmPasword)}>
                                {!showConfirmPasword ? <img src={password_icon} alt="pass_icon" /> : <img src={password_icon_text} alt="pass_icon_text" />}
                              </button>
                            </div>
                            {errDetails.confirmPasswordErr && getErr(errDetails.confirmPasswordErr)}
                          </div>
                        </div>
                        <p className="mt-5 cursor-pointer text-miru-han-purple-1000" onClick={() => setChangePassword(false)}>CANCEL</p>
                      </div>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
