import React from "react";

import dayjs from "dayjs";
import { CalendarIcon } from "miruIcons";

import { CustomAsyncSelect } from "common/CustomAsyncSelect";
import CustomDatePicker from "common/CustomDatePicker";
import { CustomInputText } from "common/CustomInputText";
import { CustomReactSelect } from "common/CustomReactSelect";

const StaticPage = ({
  addressOptions,
  addrType,
  countries,
  handleOnChangeAddrType,
  handleOnChangeCountry,
  selectedCountry,
  selectedState,
  updatedStates,
  promiseOptions,
  handleOnChangeState,
  updateBasicDetails,
  personalDetails,
  showDatePicker,
  setShowDatePicker,
  handleDatePicker,
}) => (
  <div className="mt-4 h-full bg-miru-gray-100 px-10">
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Basic Details
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="first-name"
              id="first_name"
              label="First name"
              name="first_name"
              type="text"
              value={personalDetails.first_name}
              onChange={e => {
                updateBasicDetails(e.target.value, "first_name");
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="last-name"
              id="last_name"
              label="Last name"
              name="last_name"
              type="text"
              value={personalDetails.last_name}
              onChange={e => {
                updateBasicDetails(e.target.value, "last_name");
              }}
            />
          </div>
        </div>
        <div className="flex flex-col py-3">
          <div
            className="field relative flex w-1/2 flex-col px-2"
            onClick={() =>
              setShowDatePicker({ visibility: !showDatePicker.visibility })
            }
          >
            <CustomInputText
              disabled
              dataCy="dob"
              id="dob"
              label="Date of Birth"
              name="dob"
              type="text"
              value={
                personalDetails.dob &&
                dayjs(personalDetails.dob).format("DD.MM.YYYY")
              }
              onChange={e => {
                updateBasicDetails(e.target.value, "dob");
              }}
            />
            <CalendarIcon
              className="absolute top-0 bottom-0 right-1 mx-2 my-3 "
              color="#5B34EA"
              size={20}
            />
          </div>
          {showDatePicker.visibility && (
            <CustomDatePicker
              date={personalDetails.dob}
              handleChange={e => handleDatePicker(e, true)}
            />
          )}
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Contact Details
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="phone-number"
              id="phone_number"
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={personalDetails.phone_number}
              onChange={e => {
                updateBasicDetails(e.target.value, "phone_number");
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="email-id"
              id="email_id"
              label="Email ID"
              name="email_id"
              type="email"
              value={personalDetails.email_id}
              onChange={e => {
                updateBasicDetails(e.target.value, "email_id");
              }}
            />
          </div>
        </div>
      </div>
    </div>
    <div className="flex border-b border-b-miru-gray-400 py-10">
      <div className="w-2/12 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Address
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={handleOnChangeAddrType}
              label="Address type"
              name="address_select"
              options={addressOptions}
              value={addrType.value ? addrType : addressOptions[0]}
            />
          </div>
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomInputText
            dataCy="address-line-1"
            id="address_line_1"
            label="Address line 1"
            name="address_line_1"
            type="text"
            value={personalDetails.address_line_1}
            onChange={e => {
              updateBasicDetails(e.target.value, "address_line_1");
            }}
          />
        </div>
        <div className="flex w-full flex-col px-2 py-3">
          <CustomInputText
            dataCy="address-line-2"
            id="address_line_2"
            label="Address line 2 (optional)"
            name="address_line_2"
            type="text"
            value={personalDetails.address_line_2}
            onChange={e => {
              updateBasicDetails(e.target.value, "address_line_2");
            }}
          />
        </div>
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={handleOnChangeCountry}
              label="Country"
              name="country_select"
              options={countries}
              value={selectedCountry}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomReactSelect
              handleOnChange={handleOnChangeState}
              label="State"
              name="state_select"
              value={selectedState}
              options={updatedStates(
                selectedCountry.value ? selectedCountry.value : null
              )}
            />
          </div>
        </div>
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomAsyncSelect
              label="City"
              loadOptions={promiseOptions}
              name="country_select"
            />
          </div>
          <div className="flex w-1/2 flex-col px-2 pb-3">
            <CustomInputText
              dataCy="zipcode"
              id="zipcode"
              label="Zipcode"
              name="zipcode"
              type="text"
              value={personalDetails.zipcode}
              onChange={e => {
                updateBasicDetails(e.target.value, "zipcode");
              }}
            />
          </div>
        </div>
      </div>
    </div>
    <div className="flex py-10">
      <div className="w-2/12 pr-4">
        <span className="text-sm font-medium text-miru-dark-purple-1000">
          Social Profiles
        </span>
      </div>
      <div className="w-9/12">
        <div className="flex flex-row">
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="linked-in"
              id="linked_in"
              label="LinkedIn"
              name="linked_in"
              type="text"
              value={personalDetails.linkedin}
              onChange={e => {
                updateBasicDetails(e.target.value, "linkedin");
              }}
            />
          </div>
          <div className="flex w-1/2 flex-col px-2">
            <CustomInputText
              dataCy="github"
              id="github"
              label="github"
              name="github"
              type="text"
              value={personalDetails.github}
              onChange={e => {
                updateBasicDetails(e.target.value, "github");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default StaticPage;
