import React from "react";

const BillingDetailInput = ({ field, handleBankDetails, recipientDetails }) => {
  const group = field["group"][0];

  if (group.type == "text") {
    return (
      <div>
        <label>{field.name}</label>
        <div className="my-2">
          <input
            className="w-full rounded-sm bg-gray-100 p-1"
            defaultValue={recipientDetails["details"][group.key]}
            name={group.key}
            placeholder={group.name}
            type={group.type}
            onBlur={({ target: { name, value } }) =>
              handleBankDetails(name, value, group)
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label>{field.name}</label>
      <div className="my-2">
        <select
          className="w-2/4 rounded-sm bg-gray-100 p-1"
          defaultValue={recipientDetails["details"][group.key]}
          name={group.key}
          onChange={({ target: { name, value } }) =>
            handleBankDetails(name, value, group)
          }
        >
          <option value={null}>{`Select ${group.name}`}</option>
          {group.valuesAllowed.map(value => (
            <option key={value.key} value={value.key}>
              {value.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BillingDetailInput;
