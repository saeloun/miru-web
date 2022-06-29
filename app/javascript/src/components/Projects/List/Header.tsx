import * as React from "react";
import projectApi from "apis/projects";
import AutoComplete from "common/AutoComplete";
import Logger from "js-logger";
import { Funnel, MagnifyingGlass, Plus } from "phosphor-react";

const Header = ({ setShowProjectModal, isAdminUser }) => {

  const searchCallBack = async (searchString, setDropdownItems) => {
    try {
      const res = await projectApi.get();
      const dropdownList = res.data.projects.map((project) => ({
        label: project.name,
        value: project.id
      }));
      const searchList = dropdownList.filter(item => item.label.toLowerCase().includes(searchString.toLowerCase()));
      setDropdownItems(searchList);
    } catch (err) {
      Logger.error(err);
    }
  };

  return (
    <div
      className={
        isAdminUser
          ? "sm:flex mt-6 mb-3 sm:items-center sm:justify-between"
          : "sm:flex mt-6 mb-3 sm:items-center"
      }
    >
      <h2 className="header__title">Projects</h2>
      <React.Fragment>
        <div className="header__searchWrap">
          <div className="header__searchInnerWrapper">
            <AutoComplete searchCallBack={searchCallBack} />
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
              <MagnifyingGlass size={12} />
            </button>
          </div>
          {isAdminUser && (
            <button className="ml-7">
              <Funnel size={16} />
            </button>
          )}
        </div>
        {isAdminUser && (
          <button
            className="flex header__button"
            onClick={() => setShowProjectModal(true)}
          >
            <Plus weight="fill" size={16} />
            <span className="ml-2 inline-block">NEW PROJECT</span>
          </button>
        )}
      </React.Fragment>

      {/* {
          isInvoiceSelected && <div className="flex justify-center items-center">
            <span>{selectedInvoiceCount} invoices selected</span>
            <button className="ml-2" onClick={handleCloseButton}>
              <X size={16} color="#5b34ea" weight="bold" />
            </button>
            <div className="flex">
              <button
                type="button"
                className="header__button border-miru-red-400 text-miru-red-400"
              >
                <Trash weight="fill" size={16} />
                <span className="ml-2 inline-block">DELETE</span>
              </button>
              <button
                type="button"
                className="header__button"
              >
                <PaperPlaneTilt weight="fill" size={16} />
                <span className="ml-2 inline-block">SEND TO</span>
              </button>
            </div>
          </div>
        } */}
    </div>
  );
};

export default Header;
