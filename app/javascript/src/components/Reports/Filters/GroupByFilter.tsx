import React from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import CustomRadioButton from "common/CustomRadio";
import { i18n } from "../../../i18n";

import { groupBy } from "./filterOptions";

const GroupByFilter = ({
  isGroupByOpen,
  filters,
  handleSelectFilter,
  handleGroupByFilterToggle,
}) => (
  <div className="cursor-pointer border-b border-border pb-5 pt-6 text-foreground">
    <div
      className="flex items-center justify-between px-5 hover:text-primary"
      onClick={handleGroupByFilterToggle}
    >
      <h5 className="text-xs font-bold leading-4 tracking-wider">{i18n.t("reports.groupBy").toUpperCase()}</h5>
      <div className="flex items-center">
        {filters.groupBy.value && (
          <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {1}
          </span>
        )}
        {isGroupByOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
      </div>
    </div>
    {isGroupByOpen && (
      <div className="mt-4 lg:mt-7">
        {groupBy.length &&
          groupBy.map(status => (
            <CustomRadioButton
              classNameWrapper="px-5 py-3"
              defaultCheck={status.value == filters.groupBy.value}
              groupName="groupBy"
              id={status.label}
              key={status.value}
              label={status.label}
              value={status.value}
              handleOnChange={() => {
                handleSelectFilter(status);
              }}
            />
          ))}
      </div>
    )}
  </div>
);

export default GroupByFilter;
