import * as React from "react";

const WeeklyEntryCard: React.FC<any> = () => (
  <div className="max-h-48 w-full mt-4 shadow-2xl rounded-lg">
    <div className="flex justify-between items-center p-6">
      <div className="flex">
        <p className="text-lg">Client</p>
        <p className="text-lg mx-2">•</p>
        <p className="text-lg">Project</p>
      </div>
      <div className="w-138">
        <input
          value={"08:00"}
          className="focus:outline-none focus:border-miru-han-purple-400 mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
        <input
          value={"08:00"}
          className="mr-4 bold text-xl content-center px-1 py-4 w-18 h-15 border-2 rounded bg-miru-gray-100"
        />
      </div>
      <div className="text-xl font-bold">40:00</div>
    </div>
    <div className="flex bg-miru-gray-100 w-2/3 mx-auto">
      <input type="text" className="p-2 bg-miru-gray-100" />
      <div>
        <button
          className={
            "mb-1 h-8 w-38 text-xs py-1 px-6 rounded border text-white font-bold tracking-widest " +
              // eslint-disable-next-line no-constant-condition
              ("note" && "client" && "project"
                ? "bg-miru-han-purple-1000 hover:border-transparent"
                : "bg-miru-gray-1000")
          }
        >
            SAVE
        </button>
        <button className="mt-1 h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent tracking-widest">
            CANCEL
        </button>
      </div>
    </div>
  </div>
);

export default WeeklyEntryCard;
