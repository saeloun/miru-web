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
      className="mt-4 flex h-12 w-full flex-row items-center justify-center rounded-xl bg-primary font-black text-primary-foreground tracking-wider transition-all duration-200 hover:bg-primary/90 hover:shadow-lg"
      type="button"
      onClick={() => {
        setNewEntryView(true);
        setEditEntryId(0);
      }}
    >
      <PlusIcon size={18} weight="bold" />
      <span className="ml-3 inline-block text-lg">New Time Entry</span>
    </button>
  </EmptyStates>
);
