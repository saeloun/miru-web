import React from "react";

const Footer = ({ selectedRowCount, handleAddEntriesClick }) => (
  <div style={{ boxShadow: "0px 0px 40px 0px rgba(0,0,0,0.1)" }} className='flex justify-between rounded-lg px-6 py-4'>
    <span className='font-medium text-sm text-miru-dark-purple-1000 pt-3'>{selectedRowCount} entries selected</span>
    <button
      onClick ={handleAddEntriesClick}
      className='py-2 px-7 bg-miru-han-purple-1000 rounded tracking-widest text-base text-white font-bold'>ADD ENTRIES</button>
  </div>
);

export default Footer;
