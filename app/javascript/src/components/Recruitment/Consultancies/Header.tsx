import * as React from "react";

import { MagnifyingGlass, Plus } from "phosphor-react";

import consultancies from "apis/consultancies";

import AutoComplete from "./AutoComplete";

import { unmapConsultancyListForDropdown } from "../../../mapper/consultancy.mapper";

const Header = ({
  setnewConsultancy,
  isAdminUser
}) => {

  const searchCallBack = async (searchString, setDropdownItems) => {
    await consultancies.get(searchString)
      .then((res) => {
        const dropdownList = unmapConsultancyListForDropdown(res);
        setDropdownItems(dropdownList);
      });
  };

  return (
    <div
      className={
        isAdminUser
          ? "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
          : "sm:flex mt-6 mb-3 sm:items-center"
      }>
      <h2 className="header__title">Consultancies</h2>
      <div className="header__searchWrap">
        <div className="header__searchInnerWrapper">
          <AutoComplete searchCallBack={searchCallBack} />
          <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
            <MagnifyingGlass size={12} />
          </button>
        </div>
      </div>
      {isAdminUser && (
        <div className="flex">
          <button
            type="button"
            className="header__button"
            onClick={() => setnewConsultancy(true)}
          >
            <Plus weight="fill" size={16} />
            <span className="ml-2 inline-block">NEW CONSULTANCY</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
