import * as React from "react";
const closeButton = require("../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires
const plusIcon = require("../../../../assets/images/plus_icon.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

interface IFilter {
  close: any;
}

const Filters = ({ close }: IFilter) => {
  return (
    <div className="flex flex-col absolute inset-y-0 -right-0 w-96 bg-white border-0.5 shadow-2xl">
      <div className="flex flex-row justify-between pt-4 px-4 pb-5">
        <h6 className="font-extrabold text-base text-miru-dark-purple-1000">
          Filters
        </h6>
        <button type="button">
          <img src={closeButton} onClick={close} />
        </button>
      </div>

      <form>
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            DATE RANGE
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            CLIENTS
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            TEAM MEMBERS
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            STATUSES
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            CURRENCY
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
        <div className="flex flex-row justify-between py-5 px-4">
          <div className="font-medium text-xs text-miru-dark-purple-1000 tracking-widest">
            GROUP BY
          </div>
          <button className="w-3" type="button">
            <img src={plusIcon} />
          </button>
        </div>
        <hr className="w-full border-0.5" />
      </form>
    </div>
  );
};

export default Filters;
