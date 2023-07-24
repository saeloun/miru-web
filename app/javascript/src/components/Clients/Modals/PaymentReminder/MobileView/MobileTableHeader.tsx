import React from "react";

import CustomCheckbox from "common/CustomCheckbox";

const MobileTableHeader = ({ handleCheck, isChecked }) => (
  <thead>
    <tr>
      <th className="w-1/6 py-5" scope="col">
        <CustomCheckbox
          isUpdatedDesign
          checkboxValue={1}
          handleCheck={handleCheck}
          id={1}
          isChecked={isChecked}
          text=""
          wrapperClassName="h-8 m-auto rounded-3xl"
        />
      </th>
      <th
        className="w-1/5 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000"
        scope="col"
      >
        INVOICE NUMBER
      </th>
      <th
        className="w-1/5 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000"
        scope="col"
      >
        ISSUE DATE/ DUE DATE
      </th>
      <th
        className="w-1/5 py-5 text-left text-xs font-medium tracking-widest text-miru-black-1000"
        scope="col"
      >
        STATUS/ AMOUNT
      </th>
    </tr>
  </thead>
);

export default MobileTableHeader;
