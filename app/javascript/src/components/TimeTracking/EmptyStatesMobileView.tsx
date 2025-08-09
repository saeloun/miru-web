import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";

export const EmptyStatesMobileView = ({ setNewEntryView, setEditEntryId }) => (
  <EmptyStates
    Message="No time entries for this day yet."
    messageClassName="w-full"
    showNoSearchResultState={false}
    wrapperClassName="pt-8 mt-4"
  >
    <button
      className="mt-4 flex h-10 w-full flex-row items-center justify-center rounded bg-miru-han-purple-1000 font-bold text-white"
      type="button"
      onClick={() => {
        setNewEntryView(true);
        setEditEntryId(0);
      }}
    >
      <PlusIcon size={16} weight="bold" />
      <span className="ml-2 inline-block text-base">New Time Entry</span>
    </button>
  </EmptyStates>
);
