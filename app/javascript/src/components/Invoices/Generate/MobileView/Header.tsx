import React from "react";

import { ArrowLeftIcon, SettingIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const Header = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-12 items-center justify-between bg-miru-han-purple-1000 px-3 text-white">
      <Button style="ternary" onClick={() => navigate(-1)}>
        <ArrowLeftIcon className="text-white" size={16} weight="bold" />
      </Button>
      <span className="w-full text-center text-base font-medium leading-5">
        Generate Invoice
      </span>
      <Button style="ternary">
        <SettingIcon className="text-white" size={16} weight="bold" />
      </Button>
    </div>
  );
};

export default Header;
