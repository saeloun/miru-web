import React from "react";

import EmptyStates from "common/EmptyStates";
import { PlusIcon } from "miruIcons";
import { i18n } from "../../i18n";

import { PaymentsEmptyStateProps } from "./interfaces";

export const PaymentsEmptyState = ({
  setShowManualEntryModal,
}: PaymentsEmptyStateProps) => (
  <EmptyStates
    Message={i18n.t("payments.noPaymentsRecorded")}
    messageClassName="w-full lg:text-xl"
    showNoSearchResultState={false}
  >
    <div className="flex flex-row">
      <button
        className="flex h-14 w-336 flex-row items-center justify-center rounded bg-primary font-bold	text-white"
        type="button"
        onClick={() => setShowManualEntryModal(true)}
      >
        <PlusIcon size={20} weight="bold" />
        <span className="ml-2 inline-block text-xl uppercase">
          {i18n.t("payments.addManualEntry")}
        </span>
      </button>
    </div>
  </EmptyStates>
);
