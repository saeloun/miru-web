import React from "react";

const Footer = ({ selectedRowCount, handleSubmitModal, handleSelectAll }) => (
  <div
    style={{ boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.1)" }}
    className="flex justify-between items-center rounded-lg px-6 py-4"
  >
    <div className="flex items-center pt-3">
      <span className="font-medium text-sm text-miru-dark-purple-1000">
        {selectedRowCount} entries selected
      </span>
      {selectedRowCount > 0 && (
        <button
          onClick={handleSelectAll}
          className="ml-4 text-miru-han-purple-1000 tracking-wide text-base font-medium"
        >
          Reset Selected Entries
        </button>
      )}
    </div>
    <button
      onClick={handleSubmitModal}
      className={`py-2 px-7 rounded tracking-widest text-base text-white font-bold
          ${
            selectedRowCount
              ? "cursor-pointer bg-miru-han-purple-1000"
              : "cursor-not-allowed border-transparent bg-indigo-100 hover:border-transparent"
          }`}
    >
      ADD ENTRIES
    </button>
  </div>
);

export default Footer;
