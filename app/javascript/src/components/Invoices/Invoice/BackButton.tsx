import React from "react";

import { ArrowLeftIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";

import { LocalStorageKeys } from "constants/index";

const BackButton = ({ href = "" }) => {
  const navigate = useNavigate();
  const query = window.localStorage.getItem(
    LocalStorageKeys.INVOICE_SEARCH_PARAM
  );

  const naviagteToPath = () => {
    if (href == "/invoices") {
      return navigate({
        pathname: href,
        search: `?invoices_per_page=20&page=1&query=${query}`,
      });
    }

    return navigate(href);
  };

  return (
    <div
      className="mr-1 flex h-14 w-14 flex-row items-center justify-center"
      onClick={naviagteToPath}
    >
      <ArrowLeftIcon size={20} />
    </div>
  );
};

export default BackButton;
