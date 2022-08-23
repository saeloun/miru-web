/* eslint-disable no-constant-condition */
import React from "react";

import ProgressBar from "common/ProgressBar";

const ImportCard = ({ id, title, description, btnText, handleOnShowModalClick }) => (
  <div className="bg-miru-white-1000 w-[648px] h-36	 mt-6 p-4 flex flex-row">
    <div className="p-2 w-3/12	flex items-center justify-center text-xl	font-bold	text-miru-han-purple-1000 border-r-2 border-miru-gray-200">
      {title}
    </div>
    <div className="px-4 text-justify	 w-5/12	flex items-center font-normal	text-sm	text-miru-dark-purple-1000">
      {true ? description : "Import in progress. This might take some time. We will send an email to you when it is completed."}
    </div>
    <div className="p-2 w-4/12	flex justify-center items-center">
      { true ? (<button
        className="border rounded-md px-5 py-2 font-manrope tracking-widest	mx-1 bg-miru-han-purple-1000 text-white text-base font-bold"
        onClick={e => handleOnShowModalClick(id)} //eslint-disable-line
      >
        {btnText}
      </button>) : (
        <div className="w-180 h-4 relative bg-miru-gray-200 rounded-2xl">
          <ProgressBar width="37%" />
        </div>
      )}
    </div>
  </div>
);

export default ImportCard;
