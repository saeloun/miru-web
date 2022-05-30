import React, { useState } from "react";
import { Wallet, DownloadSimple, Printer, CaretDown } from "phosphor-react";
import PayOnlineMenu from "./PayOnlineMenu";

const Header = ({ invoice, stripeUrl }) => {
  const [showPayMenu, setShowPayMenu] = useState<boolean>(false);

  return (
    <>
      <div className="mt-6 mb-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex self-center mr-2">
          <p className="text-4xl font-bold">
            Invoice #{invoice.invoice_number}
          </p>
        </div>
        <div className="flex flex-row justify-items-right">
          <div className="flex flex-col justify-items-center send-button-container ml-1">
            <button
              className="flex flex-row justify-center items-center bg-miru-han-purple-1000 rounded h-10 w-44"
              onClick={() => setShowPayMenu(!showPayMenu)}
            >
              <div className="flex flex-row justify-between items-center">
                <div className="mr-1">
                  <Wallet size={16} color="white" weight="bold" />
                </div>
                <p className="font-bold tracking-widest text-base text-miru-white-1000 ml-1">
                  PAY ONLINE
                </p>
                <div className="mr-1">
                  <CaretDown size={16} color="white" weight="bold" />
                </div>
              </div>
            </button>
            {showPayMenu && <PayOnlineMenu stripeUrl={stripeUrl} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
