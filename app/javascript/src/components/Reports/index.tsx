import React, { useState, useEffect } from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import { TimeEntry, ITimeEntry } from "./TimeEntry";

const Reports = () => {
  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);

  const fetchTimeEntries = async () => {
    const res = await reports.get();
    if (res.status == 200) {
      setTimeEntries(res.data.entries);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchTimeEntries();
  }, []);

  return (
    <>
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-miru-gray-200">
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead>
                  <tr className="flex flex-row items-center">
                    <th
                      scope="col"
                      className="w-full px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
                    >
                      PROJECT/
                      <br />
                      CLIENT
                    </th>
                    <th
                      scope="col"
                      className="w-full px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
                    >
                      NOTE
                    </th>
                    <th
                      scope="col"
                      className="w-full px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
                    >
                      TEAM MEMBER/
                      <br />
                      DATE
                    </th>
                    <th
                      scope="col"
                      className="w-full px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest"
                    >
                      HOURS
                      <br />
                      LOGGED
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((timeEntry, index) => (
                    <TimeEntry key={index} {...timeEntry} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
