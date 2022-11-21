import * as React from "react";

import Logger from "js-logger";
import { SearchIcon, PlusIcon } from "miruIcons";

import projectApi from "apis/projects";
import AutoComplete from "common/AutoComplete";

const Header = ({ setShowProjectModal, isAdminUser }) => {
  const searchCallBack = async (searchString, setDropdownItems) => {
    try {
      if (!searchString) return;
      const res = await projectApi.search(searchString);
      const dropdownList = res.data.projects.map((project) => ({
        label: `${project.name} • ${project.client_name}`,
        value: project.id,
      }));
      const searchList = dropdownList.filter((item) =>
        item.label.toLowerCase().includes(searchString.toLowerCase())
      );
      setDropdownItems(searchList);
    } catch (err) {
      Logger.error(err);
    }
  };

  return (
    <div
      className={`sm:flex mt-6 mb-3 sm:items-center ${
        isAdminUser ? "sm:justify-between" : ""
      }`}
    >
      <h2 className="header__title">Projects</h2>
      <React.Fragment>
        <div className="header__searchWrap">
          <div className="header__searchInnerWrapper">
            <AutoComplete searchCallBack={searchCallBack} />
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
              <SearchIcon size={12} />
            </button>
          </div>
          {/* {isAdminUser && (
            <button className="ml-7">
              <FilterIcon size={16} />
            </button>
          )} */}
        </div>
        {isAdminUser && (
          <button
            className="flex header__button"
            onClick={() => setShowProjectModal(true)}
          >
            <PlusIcon weight="fill" size={16} />
            <span className="ml-2 inline-block">NEW PROJECT</span>
          </button>
        )}
      </React.Fragment>

      {/* {
          isInvoiceSelected && <div className="flex justify-center items-center">
            <span>{selectedInvoiceCount} invoices selected</span>
            <button className="ml-2" onClick={handleCloseButton}>
              <XIcon size={16} color="#5b34ea" weight="bold" />
            </button>
            <div className="flex">
              <button
                type="button"
                className="header__button border-miru-red-400 text-miru-red-400"
              >
                <DeleteIcon weight="fill" size={16} />
                <span className="ml-2 inline-block">DELETE</span>
              </button>
              <button
                type="button"
                className="header__button"
              >
                <PaperPlaneTiltIcon weight="fill" size={16} />
                <span className="ml-2 inline-block">SEND TO</span>
              </button>
            </div>
          </div>
        } */}
    </div>
  );
};

export default Header;
