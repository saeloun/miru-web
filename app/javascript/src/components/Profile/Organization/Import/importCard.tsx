/* eslint-disable no-constant-condition */
import React from "react";

import ProgressBar from "common/ProgressBar";

const ImportCard = ({
  id,
  title,
  description,
  btnText,
  handleOnShowModalClick,
}) => (
  <div className="mt-6 flex h-36	 w-[648px] flex-row bg-miru-white-1000 p-4">
    <div className="flex w-3/12	items-center justify-center border-r-2 border-miru-gray-200	p-2	text-xl font-bold text-miru-han-purple-1000">
      {title}
    </div>
    <div className="flex w-5/12	 items-center	px-4 text-justify text-sm	font-normal	text-miru-dark-purple-1000">
      {true
        ? description
        : "Import in progress. This might take some time. We will send an email to you when it is completed."}
    </div>
    <div className="flex w-4/12	items-center justify-center p-2">
      {true ? (
        <button
          className="mx-1 rounded-md border bg-miru-han-purple-1000 px-5 py-2	font-manrope text-base font-bold tracking-widest text-white"
          onClick={e => handleOnShowModalClick(id)}
        >
          {btnText}
        </button>
      ) : (
        <div className="relative h-4 w-180 rounded-2xl bg-miru-gray-200">
          <ProgressBar width="37%" />
        </div>
      )}
    </div>
  </div>
);

export default ImportCard;
