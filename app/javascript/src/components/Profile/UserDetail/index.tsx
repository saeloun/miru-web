import React, { useState } from "react";

import Header from "../Header";

const UserDetails = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="flex flex-col w-4/5">
      <Header
        title={'Profile Settings'}
        subTitle={'View and manage profile settings'}
        showButtons={true}
        cancelAction={() => {}}
        saveAction={() => {}}
      />
      <div className="py-10 pl-10 mt-4 bg-miru-gray-100 h-screen">
        <div>
          <div className="float-left w-35">
            Basic Details
          </div>
          <div className="pl-28">
            Profile Picture
            <div className="flex flex-col mb-2">
              <label className="mb-2">Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={firstName}
                className="border py-1 px-1 w-50"
                onChange={ event  => setFirstName(event.target.value) }
              />
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={lastName}
                className="border py-1 px-1 w-50"
                onChange={ event => setLastName(event.target.value) }
              />
            </div>
            <div className="flex flex-col mb-2">
              <label>Email</label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                className="border w-full"
                onChange={ event => setEmail(event.target.value) }
              />
            </div>
          </div>
        </div>
        <div className="float-left w-35">
          Password
        </div>
        {
          !showPassword && (
            <div className="flex flex-col mb-2">
              <label>Password</label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                disabled={!showPassword}
                value={currentPassword}
                className="border w-full"
              />
              <p onClick={ () => setShowPassword(true) }>Change Password</p>
            </div>
          )
        }
        {
          showPassword && (
            <div>
              <div className="pl-28">
                <div className="flex flex-col mb-2">
                  <label>Current Password</label>
                  <input
                    type="password"
                    id="current_password"
                    name="current_password"
                    value={"Sudeep"}
                    className="border w-full"
                    onChange={ event => setCurrentPassword(event.target.value) }
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="mb-2">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    className="border py-1 px-1 w-50"
                    onChange={ event  => setPassword(event.target.value) }
                  />
                  <label className="mb-2">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={confirmPassword}
                    className="border py-1 px-1 w-50"
                    onChange={ event => setConfirmPassword(event.target.value) }
                  />
                </div>
              </div>
              <p onClick={ () => setShowPassword(false) }>Cancel</p>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default UserDetails;
