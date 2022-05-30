/* eslint-disable @typescript-eslint/no-var-requires */

import React, { useState } from "react";

import { Divider } from "common/Divider";

import * as Yup from "yup";
import Header from "../Header";
const editButton = require("../../../../../assets/images/edit_image_button.svg");
const password_icon = require("../../../../../assets/images/password_icon.svg");
const password_icon_text = require("../../../../../assets/images/password_icon_text.svg");
const img = require("../../../../../assets/images/plus_icon.svg");

const userProfileSchema = Yup.object().shape({
  firstName: Yup.string().required("First Name cannot be blank"),
  lastName: Yup.string().required("Last Name cannot be blank"),
  password: Yup.string().required("Please enter password"),
  currentPassword: Yup.string().required("Please enter current password"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords don't match")
});

const UserDetails = () => {
  const [profileImage, setProfileImage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changePassword, setChangePassword] = useState<boolean>(false);
  const [showPasword, setShowPassword] = useState<boolean>(false);
  const [showCurrentPasword, setShowCurrentPassword] = useState<boolean>(false);
  const [showConfirmPasword, setShowConfirmPassword] = useState<boolean>(false);

  const [errDetails, setErrDetails] = useState({
    firstNameErr: "",
    lastNameErr: "",
    passwordErr: "",
    currentPasswordErr: "",
    confirmPasswordErr: ""
  });

  const handleProfileImageChange = (e) => {
    const imageFile = e.target.files[0];
    setProfileImage(URL.createObjectURL(imageFile));
  };

  const handleUpdateProfile = () => {
    userProfileSchema.validate({ firstName, lastName, password, confirmPassword, currentPassword }, { abortEarly: false }).then(() => {
      const errObj = {
        firstNameErr: "",
        lastNameErr: "",
        passwordErr: "",
        currentPasswordErr: "",
        confirmPasswordErr: ""
      };
      setErrDetails(errObj);
    }).catch(function (err) {
      const errObj = {
        firstNameErr: "",
        lastNameErr: "",
        passwordErr: "",
        currentPasswordErr: "",
        confirmPasswordErr: ""
      };
      err.inner.map((item) => {
        errObj[item.path + "Err"] = item.message;
      });
      setErrDetails(errObj);
    });
  };

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={"Profile Settings"}
        subTitle={"View and manage profile settings"}
        showButtons={true}
        // cancelAction={()=> {}}
        saveAction={handleUpdateProfile}
      />
      <div className="pb-10 pt-10 pl-10 pr-10 mt-4 bg-miru-gray-100 min-h-80v">
        <div className="flex flex-row py-6">
          <div className="w-4/12 font-bold p-2">Basic Details</div>
          <div className="w-full p-2">
            Profile Picture
            {profileImage ? (
              <div className="mt-2 flex flex-row">
                <div className="w-20 h-20">
                  <img src={profileImage} className={"rounded-full min-w-full h-full"}></img>
                </div>
                <label htmlFor="file-input" className="">
                  <img src={editButton} className={"rounded-full mt-5 cursor-pointer"} style={{ "minWidth": "40px" }}></img>
                </label>
                <input id="file-input" type="file" name="myImage" className='hidden' onChange={handleProfileImageChange}>
                </input>
                <button className="">
                  <img
                    src="/delete.svg"
                    alt="delete"
                    style={{ "minWidth": "20px" }}
                  />
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="file-input">
                  <div className="w-20 h-20 border rounded border-miru-han-purple-1000 flex justify-center items-center mt-2 cursor-pointer">
                    <img src={img}></img>
                  </div>
                </label>
                <input id="file-input" type="file" name="myImage" className='hidden' onChange={handleProfileImageChange} />
              </>
            )}
            <div className="mt-2 flex flex-col">
              <label className="mt-2">Name</label>
              <div className="flex flex-row mt-2">
                <div className="flex flex-col w-1/2">
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={firstName}
                    className="border py-1 px-1 w-full mr-2"
                    onChange={event => setFirstName(event.target.value)}
                  />
                  {errDetails.firstNameErr && (<p className="text-red-600 text-sm">{errDetails.firstNameErr}</p>)}
                </div>
                <div className="flex flex-col w-1/2">
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={lastName}
                    className="border py-1 px-1 w-full ml-2"
                    onChange={event => setLastName(event.target.value)}
                  />
                  {errDetails.lastNameErr && (<p className="text-red-600 text-sm ml-2">{errDetails.lastNameErr}</p>)}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <label>Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                className="border py-1 px-1 w-full mt-2"
                onChange={event => setEmail(event.target.value)}
                disabled
              />
            </div>
          </div>
        </div>
        <Divider />
        <div className="flex flex-row py-6">
          <div className="w-4/12 font-bold p-2">Password</div>
          <div className="w-full p-2">
            <div>
              {
                !changePassword && (
                  <div className="mt-2">
                    <label>Password</label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      disabled={!changePassword}
                      value={currentPassword}
                      className="border py-1 px-1 w-full mt-2"
                    />
                    <p className="mt-5 text-miru-han-purple-1000 cursor-pointer" onClick={() => setChangePassword(true)}>CHANGE PASSWORD</p>
                  </div>
                )
              }
              {
                changePassword && (
                  <div>
                    <div className="flex flex-col">
                      <div className="">
                        <label>Current Password</label>
                        <div className="flex relative items-center">
                          <input
                            type={showCurrentPasword ? "text" : "password"}
                            id="current_password"
                            name="current_password"
                            value={currentPassword}
                            className="border py-1 px-1 w-full mt-2"
                            onChange={event => setCurrentPassword(event.target.value)}
                          />
                          <button className="btn btn-outline-primary absolute mt-2 mr-3 right-0" onClick={() => setShowCurrentPassword(!showCurrentPasword)} >
                            {!showCurrentPasword ? <img src={password_icon} /> : <img src={password_icon_text} />}
                          </button>
                        </div>
                        {errDetails.currentPasswordErr && (<p className="text-red-600 text-sm ml-2">{errDetails.currentPasswordErr}</p>)}
                      </div>
                      <div className="flex flex-row mt-2">
                        <div className="flex flex-col w-1/2 pr-2 mt-2">
                          <label className="mb-2">Password</label>
                          <div className="flex relative items-center">
                            <input
                              type={showPasword ? "text" : "password"}
                              id="password"
                              name="password"
                              value={password}
                              className=" border py-1 px-1 w-full mt-2"
                              onChange={event => setPassword(event.target.value)}
                            />
                            <button className="btn btn-outline-primary absolute mt-2 mr-3 right-0" onClick={() => setShowPassword(!showPasword)}>
                              {!showPasword ? <img src={password_icon} /> : <img src={password_icon_text} />}
                            </button>
                          </div>
                          {errDetails.passwordErr && (<p className="text-red-600 text-sm ml-2">{errDetails.passwordErr}</p>)}

                        </div>
                        <div className="flex flex-col w-1/2 pl-2 mt-2">
                          <label className="mb-2">Confirm Password</label>
                          <div className="flex relative items-center">
                            <input
                              type={showConfirmPasword ? "text" : "password"}
                              id="confirm_password"
                              name="confirm_password"
                              value={confirmPassword}
                              className="border py-1 px-1 w-full mt-2"
                              onChange={event => setConfirmPassword(event.target.value)}
                            />
                            <button className="btn btn-outline-primary absolute mt-2 mr-3 right-0" onClick={() => setShowConfirmPassword(!showConfirmPasword)}>
                              {!showConfirmPasword ? <img src={password_icon} /> : <img src={password_icon_text} />}
                            </button>
                          </div>
                          {errDetails.confirmPasswordErr && (<p className="text-red-600 text-sm ml-2">{errDetails.confirmPasswordErr}</p>)}
                        </div>
                      </div>
                      <p className="mt-5 text-miru-han-purple-1000 cursor-pointer" onClick={() => setChangePassword(false)}>CANCEL</p>
                    </div>
                  </div>
                )
              }
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserDetails;
