import * as React from "react";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import Filters from "./Filters";
import { TimeEntry, ITimeEntry } from "./TimeEntry";

const filterIcon = require("../../../../assets/images/filter_icon.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

const Reports = () => {
  const [timeEntries, setTimeEntries] = React.useState<Array<ITimeEntry>>([]);
  const [isFiltersDialogVisible, setIsFiltersDialogVisible] =
    React.useState<boolean>(false);

  const fetchTimeEntries = async () => {
    const res = await reports.get();
    if (res.status == 200) {
      setTimeEntries(res.data.entries);
    }
  };

  const closeFiltersDialog = () => setIsFiltersDialogVisible(false);

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchTimeEntries();
  }, []);

  return (
    <>
      <div className="relative h-screen">
        <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
          <div className="px-5">
            <div>
              <div className="sm:flex sm:items-center sm:justify-between pt-6 pb-3">
                <div className="flex flex-row items-center">
                  <h2 className="text-3xl font-extrabold leading-7 text-gray-900 sm:text-4xl sm:truncate py-1 mr-2">
                    Time entry report
                  </h2>
                  <button
                    type="button"
                    className="flex flex-row justify-center items-center w-10 h-10 bg-miru-gray-1000 rounded-sm ml-2 bg-opacity-20"
                    onClick={() => setIsFiltersDialogVisible(true)}
                  >
                    <img src={filterIcon} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="overflow-hidden border-b-2 border-miru-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 mt-4">
                        <thead>
                          <tr className="flex flex-row items-center">
                            <th
                              scope="col"
                              className="w-full px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                            >
                              PROJECT/
                              <br />
                              CLIENT
                            </th>
                            <th
                              scope="col"
                              className="w-full px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                            >
                              NOTE
                            </th>
                            <th
                              scope="col"
                              className="w-full px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                            >
                              TEAM MEMBER/
                              <br />
                              DATE
                            </th>
                            <th
                              scope="col"
                              className="w-full px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
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
            </div>
          </div>
        </div>
        {isFiltersDialogVisible && <Filters close={closeFiltersDialog} />}
      </div>
    </>
  );
};

export default Reports;
