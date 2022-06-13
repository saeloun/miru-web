import React from "react";

const AddressDetails = ({
  fields,
  handleAddressDetails,
  handleBankDetails,
  recipientDetails
}) => {
  const legalType = fields.filter(field => field["group"][0]["key"] == "legalType")[0];
  const countries = fields.filter(field => field["group"][0]["key"] == "address.country")[0];
  const postCode = fields.filter(field => field["group"][0]["key"] == "address.postCode")[0];

  return (
    <div className="w-full">
      <div className="inline-flex w-full">
        <div className="w-2/4 mr-1">
          <label>Reference Type</label>
          <div className="my-2">
            <select
              className="p-1 bg-gray-100 rounded-sm w-full"
              name="legalType"
              defaultValue={recipientDetails["details"]["legalType"]}
              onChange={ ({ target: { name, value } }) => handleBankDetails(name, value, {}) }
            >
              <option value={null}>Select reference type</option>
              {
                legalType["group"][0]["valuesAllowed"].map(value => (
                  <option value={value.key} key={value.key}>{value.name}</option>
                ))
              }
            </select>
          </div>
        </div>
        <div className="w-2/4 ml-1">
          <label>Country</label>
          <div className="my-2">
            <select
              name="country"
              className="p-1 bg-gray-100 rounded-sm w-full"
              defaultValue={recipientDetails["details"]["address"]["country"]}
              onChange={ ( { target: { name, value } }) => handleAddressDetails(name, value, {})}
            >
              <option value={null}>Select Country</option>
              {
                countries["group"][0]["valuesAllowed"].map(value => (
                  <option value={value.key} key={value.key}>{value.name}</option>
                ))
              }
            </select>
          </div>
        </div>
      </div>
      <div className="inline-flex w-full">
        <div className="w-2/4 mr-1">
          <label>City</label>
          <div className="my-2">
            <input
              className="bg-gray-100 rounded-sm p-1 w-full"
              placeholder="City"
              name="city"
              defaultValue={recipientDetails["details"]["address"]["city"]}
              onBlur={({ target: { name, value } }) => handleAddressDetails(name, value, { validationRegexp: "^.{1,255}$" })}
            />
          </div>
        </div>
        <div className="w-2/4 ml-1">
          <label>Post Code</label>
          <div className="my-2">
            <input
              className="bg-gray-100 rounded-sm p-1 w-full"
              placeholder="Post Code"
              name="postCode"
              defaultValue={recipientDetails["details"]["address"]["postCode"]}
              data-regexp={postCode["group"][0]["validationRegexp"]}
              onBlur={({ target: { name, value, dataset: { regexp } } }) => handleAddressDetails(name, value, { validationRegexp: regexp })}
            />
          </div>
        </div>
      </div>
      <div>
        <label>Address</label>
        <div className="my-2">
          <input
            type="text"
            className="bg-gray-100 rounded-sm p-1 w-full h-12"
            placeholder="Address"
            name="firstLine"
            defaultValue={ recipientDetails["details"]["address"]["firstLine"] }
            onBlur={ ( { target: { name, value } }) => handleAddressDetails(name, value, { validationRegexp: "^.{1,255}$" }) }
          />
        </div>
      </div>
    </div>
  );
};

export default AddressDetails;
