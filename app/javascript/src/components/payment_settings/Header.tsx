import * as React from "react";

import { FloppyDisk, X } from "phosphor-react";

const Header = () => (
  <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
    <h2 className="header__title">Settings</h2>

    <div className="flex">
      <button className="header__button">
        <X size={12} />
        <span className="ml-2 inline-block">CANCEL</span>
      </button>
      <button className="header__button bg-miru-han-purple-1000 text-white hover:text-white">
        <FloppyDisk size={18} color="white" />
        <span className="ml-2 inline-block">SAVE</span>
      </button>
    </div>
  </div>
);

export default Header;
