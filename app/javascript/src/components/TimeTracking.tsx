import * as React from "react";

const TimeTracking: React.FC = () => (
  <>
    <div className="container mx-32">
      <nav className="flex justify-evenly max-w-sm">
        <button className="tracking-widest font-extrabold text-miru-han-purple-1000 underline underline-offset-1">
          DAY
        </button>
        <button className="tracking-widest font-medium text-miru-han-purple-600">
          WEEK
        </button>
        <button className="tracking-widest font-medium text-miru-han-purple-600">
          MONTH
        </button>
      </nav>
      <div className="bg-miru-han-purple-1000 p-4 w-full">
        <button className="text-white tracking-widest border-2 rounded-lg p-2">
          TODAY
        </button>
      </div>
      <div></div>
      <button className="w-full border-2 p-4 border-miru-han-purple-600 text-miru-han-purple-600 font-bold text-lg">
        + NEW ENTRY
      </button>
    </div>
  </>
);

export default TimeTracking;
