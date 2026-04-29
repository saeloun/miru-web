import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";
import { i18n } from "../../i18n";

export const EmptyStatesMobileView = ({ setNewEntryView, setEditEntryId }) => (
  <EmptyStates
    Message={i18n.t("timeTracking.noEntriesForDay")}
    messageClassName="w-full"
    showNoSearchResultState={false}
    wrapperClassName="pt-8 mt-4"
  >
    <button
      className="mt-4 flex h-12 w-full flex-row items-center justify-center rounded-xl bg-primary font-black text-primary-foreground tracking-wider transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
      type="button"
      onClick={() => {
        setNewEntryView(true);
        setEditEntryId(0);
      }}
    >
      <PlusIcon size={18} weight="bold" />
      <span className="ml-3 inline-block text-lg">
        {i18n.t("timeTracking.newTimeEntry")}
      </span>
    </button>
  </EmptyStates>
);
