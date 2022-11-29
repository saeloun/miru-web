import React from "react";

const AddressDetails = ({
  fields,
  handleAddressDetails,
  handleBankDetails,
  recipientDetails,
}) => {
  const legalType = fields.filter(
    field => field["group"][0]["key"] == "legalType"
  )[0];

  const countries = fields.filter(
    field => field["group"][0]["key"] == "address.country"
  )[0];

  const postCode = fields.filter(
    field => field["group"][0]["key"] == "address.postCode"
  )[0];

  return (
    <div className="w-full">
      <div className="inline-flex w-full">
        <div className="mr-1 w-2/4">
          <label>Reference Type</label>
          <div className="my-2">
            <select
              className="w-full rounded-sm bg-gray-100 p-1"
              defaultValue={recipientDetails["details"]["legalType"]}
              name="legalType"
              onChange={({ target: { name, value } }) =>
                handleBankDetails(name, value, {})
              }
            >
              <option value={null}>Select reference type</option>
              {legalType["group"][0]["valuesAllowed"].map(value => (
                <option key={value.key} value={value.key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="ml-1 w-2/4">
          <label>Country</label>
          <div className="my-2">
            <select
              className="w-full rounded-sm bg-gray-100 p-1"
              defaultValue={recipientDetails["details"]["address"]["country"]}
              name="country"
              onChange={({ target: { name, value } }) =>
                handleAddressDetails(name, value, {})
              }
            >
              <option value={null}>Select Country</option>
              {countries["group"][0]["valuesAllowed"].map(value => (
                <option key={value.key} value={value.key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="inline-flex w-full">
        <div className="mr-1 w-2/4">
          <label>City</label>
          <div className="my-2">
            <input
              className="w-full rounded-sm bg-gray-100 p-1"
              defaultValue={recipientDetails["details"]["address"]["city"]}
              name="city"
              placeholder="City"
              onBlur={({ target: { name, value } }) =>
                handleAddressDetails(name, value, {
                  validationRegexp: "^.{1,255}$",
                })
              }
            />
          </div>
        </div>
        <div className="ml-1 w-2/4">
          <label>Post Code</label>
          <div className="my-2">
            <input
              className="w-full rounded-sm bg-gray-100 p-1"
              data-regexp={postCode["group"][0]["validationRegexp"]}
              defaultValue={recipientDetails["details"]["address"]["postCode"]}
              name="postCode"
              placeholder="Post Code"
              onBlur={({
                target: {
                  name,
                  value,
                  dataset: { regexp },
                },
              }) =>
                handleAddressDetails(name, value, { validationRegexp: regexp })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label>Address</label>
        <div className="my-2">
          <input
            className="h-12 w-full rounded-sm bg-gray-100 p-1"
            defaultValue={recipientDetails["details"]["address"]["firstLine"]}
            name="firstLine"
            placeholder="Address"
            type="text"
            onBlur={({ target: { name, value } }) =>
              handleAddressDetails(name, value, {
                validationRegexp: "^.{1,255}$",
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AddressDetails;
