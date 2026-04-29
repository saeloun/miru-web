import React from "react";

import { MinusIcon, PlusIcon } from "miruIcons";

import ClickableCheckboxText from "common/ClickableCheckboxText";
import { i18n } from "../../../i18n";

const StatusFilter = ({
  isStatusOpen,
  filters,
  statusOptions,
  handleSelectStatus,
  handleStatusFilterToggle,
}) => (
  <div className="cursor-pointer border-b border-border pb-5 pt-6 text-foreground">
    <div
      className="flex items-center justify-between px-5 hover:text-primary"
      onClick={handleStatusFilterToggle}
    >
      <h5 className="text-xs font-bold leading-4 tracking-wider">
        {i18n.t("status").toUpperCase()}
      </h5>
      <div className="flex items-center">
        {filters.status.length > 0 && (
          <span className="mr-7 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {filters.status.length}
          </span>
        )}
        {isStatusOpen ? <MinusIcon size={16} /> : <PlusIcon size={16} />}
      </div>
    </div>
    {isStatusOpen && (
      <div className="mt-4  pt-0.5 lg:mt-7 lg:pt-0">
        {statusOptions.length &&
          statusOptions.map(status => (
            <ClickableCheckboxText
              checkboxValue={status.value}
              handleCheck={() => handleSelectStatus(status)}
              id={status.value}
              isChecked={filters.status.some(e => e.value === status.value)}
              key={status.value}
              labelClassName="ml-4"
              name="status"
              text={status.label.toLowerCase()}
              textWrapperClassName="capitalize"
              wrapperClassName="py-3 px-5 flex items-center lg:hover:bg-muted"
            />
          ))}
      </div>
    )}
  </div>
);

export default StatusFilter;
