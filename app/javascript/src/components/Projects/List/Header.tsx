import React from "react";

import Logger from "js-logger";
import { PlusIcon } from "miruIcons";

import projectApi from "apis/projects";
import AutoSearch from "common/AutoSearch";

import SearchDataRow from "./SearchDataRow";

const Header = ({ setShowProjectModal, isAdminUser }) => {
  const fetchProjects = async searchString => {
    try {
      const res = await projectApi.search(searchString);

      return res?.data?.projects;
    } catch (error) {
      Logger.error(error);
    }
  };

  return (
    <div
      className={`mt-6 mb-3 sm:flex sm:items-center ${
        isAdminUser ? "sm:justify-between" : ""
      }`}
    >
      <h2 className="header__title">Projects</h2>
      <AutoSearch searchAction={fetchProjects} searchDataRow={SearchDataRow} />
      {isAdminUser && (
        <button
          className="header__button flex"
          onClick={() => setShowProjectModal(true)}
        >
          <PlusIcon size={16} weight="fill" />
          <span className="ml-2 inline-block">NEW PROJECT</span>
        </button>
      )}
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
