import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";

import { PaymentsEmptyStateProps } from "./interfaces";

export const PaymentsEmptyState = ({
  setShowManualEntryModal,
}: PaymentsEmptyStateProps) => (
  <EmptyStates
    Message="No payments have been recorded yet"
    messageClassName="w-full lg:text-xl"
    showNoSearchResultState={false}
  >
    <div className="flex flex-row">
      <button
        className="flex h-14 w-336 flex-row items-center justify-center rounded bg-miru-han-purple-1000 font-bold	text-white"
        type="button"
        onClick={() => setShowManualEntryModal(true)}
      >
        <PlusIcon size={20} weight="bold" />
        <span className="ml-2 inline-block text-xl uppercase">
          ADD MANUAL ENTRY
        </span>
      </button>
    </div>
  </EmptyStates>
);
