import React, { useEffect } from "react";

import { Divider } from "common/Divider";
import { sendGAPageView } from "utils/googleAnalytics";

import Table from "./Table";

import EditHeader from "../../Common/EditHeader";

const Billing = () => {
  useEffect(() => sendGAPageView(), []);

  return (
    <div className="flex w-4/5 flex-col">
      <EditHeader
        showButtons={false}
        subTitle="View upcoming bill amount, due date and past bills"
        title="Billing"
      />
      <div className="max-h-70v overflow-scroll">
        <div className="mt-4 max-h-40v bg-miru-gray-100 pb-5 pt-5 pl-5 pr-5">
          <div className="flex flex-row justify-between py-2">
            <div className="p-2 font-semibold">Next Billing Date</div>
            <div className="p-2 font-bold">-</div>
          </div>
          <Divider />
          <div className="flex flex-row items-end justify-between py-2">
            <div className="p-2">
              <p className="text-xs	font-normal	text-miru-dark-purple-1000">
                Add-Ons
              </p>
              <p className="font-semibold">1 team member</p>
              <p className="text-xs	font-normal text-miru-dark-purple-400">
                -$ per user per month
              </p>
            </div>
            <div className="p-2 text-right">
              <p className="mt-2 text-base font-bold">-$/mo</p>
              <p className="text-xs	font-normal text-miru-dark-purple-400">
                charged every month{" "}
              </p>
            </div>
          </div>
          <Divider />
          <div className="flex flex-row items-start justify-between py-2">
            <div className="p-2 text-2xl font-bold"> Total </div>
            <div className="p-2 text-right">
              <p className="mt-2 font-bold">-$</p>
              <p className="text-xs	font-normal	text-miru-dark-purple-400">
                plus taxes{" "}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 min-h-40v bg-miru-gray-100 pb-5 pt-5 pl-5 pr-5">
          <p className="p-2	text-xl font-semibold">Billing History</p>
          <Table />
        </div>
      </div>
    </div>
  );
};

export default Billing;
