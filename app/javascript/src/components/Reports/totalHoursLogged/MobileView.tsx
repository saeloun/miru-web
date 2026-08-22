import React from "react";

import EmptyStates from "common/EmptyStates";
import { i18n } from "../../../i18n";

const MobileView = () => (
  <div className="w-full px-4 sm:hidden">
    <EmptyStates
      Message={i18n.t("reports.noTimeEntriesYet")}
      showNoSearchResultState={false}
    />
  </div>
);

export default MobileView;
