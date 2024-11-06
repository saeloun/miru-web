import React from "react";

import DetailsHeader from "components/Profile/Common/DetailsHeader";

import CustomTableHeader from "./CustomTableHeader";
import CustomTableRow from "./CustomTableRow";
import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const Details = ({
  leavesList,
  customLeavesList,
  showYearPicker,
  editAction,
  currentYear,
  setCurrentYear,
}) => (
  <>
    <DetailsHeader
      showButtons
      currentYear={currentYear}
      editAction={editAction}
      isDisableUpdateBtn={false}
      setCurrentYear={setCurrentYear}
      showYearPicker={showYearPicker}
      subTitle=""
      title="Leaves"
    />
    <div className="mt-4 min-h-80v bg-miru-gray-100 p-4 lg:p-10">
      <div className="flex w-full flex-col">
        <div className="w-full pb-6 text-left text-xl font-semibold">
          Leaves
        </div>
        <table className="flex w-full flex-col">
          <TableHeader />
          <tbody>
            {leavesList.length > 0 ? (
              leavesList.map((leave, index) => (
                <TableRow key={index} leave={leave} />
              ))
            ) : (
              <div>No data found</div>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-20 flex w-full flex-col">
        <div className="w-full pb-6 text-left text-xl font-semibold">
          Customised Leaves
        </div>
        <table className="flex w-full flex-col">
          <CustomTableHeader />
          <tbody>
            {customLeavesList.length > 0 ? (
              customLeavesList.map((leave, index) => (
                <CustomTableRow key={index} leave={leave} />
              ))
            ) : (
              <div>No data found</div>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export default Details;
