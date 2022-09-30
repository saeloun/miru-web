import React from "react";

import { Divider } from "common/Divider";

import Table from "./Table";

import Header from "../../Header";

const Billing = () => (
  <>
    <div className="flex flex-col w-4/5">
      <Header
        title={"Billing"}
        subTitle={"View upcoming bill amount, due date and past bills"}
        showButtons={false}
      />
      <div className="max-h-70v overflow-scroll">
        <div className="pb-5 pt-5 pl-5 pr-5 mt-4 bg-miru-gray-100 max-h-40v">
          <div className="flex flex-row py-2 justify-between">
            <div className="font-semibold p-2">Next Billing Date</div>
            <div className="font-bold p-2">
              -
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-2 justify-between items-end">
            <div className="p-2">
              <p className="font-normal	text-xs	text-miru-dark-purple-1000">Add-Ons</p>
              <p className="font-semibold">1 team member</p>
              <p className="font-normal	text-xs text-miru-dark-purple-400">-$ per user per month</p>
            </div>
            <div className="p-2 text-right">
              <p className="font-bold mt-2 text-base">-$/mo</p>
              <p className="font-normal	text-xs text-miru-dark-purple-400">charged every month </p>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row py-2 justify-between items-start">
            <div className="p-2 font-bold text-2xl"> Total </div>
            <div className="p-2 text-right">
              <p className="font-bold mt-2">-$</p>
              <p className="font-normal	text-xs	text-miru-dark-purple-400">plus taxes </p>
            </div>
          </div>
        </div>
        <div className="pb-5 pt-5 pl-5 pr-5 mt-4 bg-miru-gray-100 min-h-40v">
          <p className='font-semibold	p-2 text-xl'>Billing History</p>
          <Table />
        </div>
      </div>
    </div>
  </>
);

export default Billing;
