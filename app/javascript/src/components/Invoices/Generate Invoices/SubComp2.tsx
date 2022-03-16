import * as React from "react";

const SubComp2 = () => {
  return (
    <div className="flex justify-between border-b-2 border-miru-gray-400 px-10 py-5 h-36">
      <div className="">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Billed to
        </p>
        <p className="font-bold text-base text-miru-dark-purple-1000">
          Microsoft
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-400 w-52">
          One Microsoft Way <br />
          Redmond,Washington <br />
          98052-6399
        </p>
      </div>

      <div className="">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Date of Issue
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          23.12.2021
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-2">
          Due Date
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          23.1.2022
        </p>
      </div>

      <div className="">
        <p className="font-normal text-xs text-miru-dark-purple-1000">
          Invoice Number
        </p>
        <p className="font-normal text-base text-miru-dark-purple-1000">
          6335 7871
        </p>
        <p className="font-normal text-xs text-miru-dark-purple-1000 mt-3">
          Reference
        </p>
      </div>

      <div className="">
        <p className="font-normal text-xs text-miru-dark-purple-1000 text-right">
          Amount
        </p>
        <p className="font-normal text-4xl text-miru-dark-purple-1000 mt-6">
          $90.00
        </p>
      </div>
    </div>
  );
};

export default SubComp2;
