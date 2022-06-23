import React from "react";

const BillingDetailInput = ({
  field,
  handleBankDetails,
  recipientDetails
}) => {
  const group = field["group"][0];

  if (group.type == "text") {
    return (
      <div>
        <label>{field.name}</label>
        <div className="my-2">
          <input
            className="bg-gray-100 p-1 rounded-sm w-full"
            name={group.key}
            type={group.type}
            defaultValue={recipientDetails["details"][group.key]}
            placeholder={group.name}
            onBlur={ ({ target: { name, value } }) => handleBankDetails(name, value, group) }
          />
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <label>{field.name}</label>
        <div className="my-2">
          <select
            className="p-1 rounded-sm bg-gray-100 w-2/4"
            name={group.key}
            defaultValue={recipientDetails["details"][group.key]}
            onChange={ ({ target: { name, value } }) => handleBankDetails(name, value, group) }
          >
            <option value={null}>{`Select ${group.name}`}</option>
            {
              group.valuesAllowed.map(value => (
                <option
                  value={value.key}
                  key={value.key}
                >
                  {value.name}
                </option>
              ))
            }
          </select>
        </div>
      </div>
    );
  }
};

export default BillingDetailInput;
