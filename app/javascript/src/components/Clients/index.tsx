import * as React from "react";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import ReactTooltip from 'react-tooltip';

import DeleteClient from "components/Clients/DeleteClient";
import { Client } from "./Client";
import EditClient from "./EditClient";

const getTotalHours = (clients) => {
  let hours:number = 0
  clients.forEach((item) => {
    hours = item.hoursLogged + hours;
  });
  return hours
}

const getRandomColor = (index) => {
  const chartColor = ['miru-chart-green', 'miru-chart-blue', 'miru-chart-pink', 'miru-chart-orange'];
  const chartColorIndex = index%4;
  return chartColor[chartColorIndex]
}

const GetClientBar = ({ client, totalHours, index }) => {
  const hourPercentage = (client.hoursLogged * 100)/totalHours;
  const divStyle = {
    width: `${hourPercentage}%`
  };
  const randomColor = getRandomColor(index);

  return (
    <div style={divStyle}>
      <ReactTooltip id={`registerTip-${index}`} effect="solid" backgroundColor="white" textColor="black" place="top">
        <p>{client.name}</p>
        <p className="text-center">{client.hoursLogged}</p>
      </ReactTooltip>
      <button data-tip data-for={`registerTip-${index}`} type="button" className={`bg-${randomColor}-600 w-full h-4 block border-b border-t hover:border-transparent`}></button>
    </div>
  )
}

const Clients = ({ clients, editIcon, deleteIcon, isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    React.useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = React.useState({});
  const [clientToDelete, setClientToDelete] = React.useState({});
  const totalhours:number = getTotalHours(clients);

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="bg-gray-200 py-10 px-10">
            <div className="flex justify-end">
              <select className="px-3
                py-1.5
                text-base
                font-normal
                bg-transparent bg-clip-padding bg-no-repeat
                border-none
                transition
                ease-in-out
                m-0
                focus:outline-none
                text-miru-han-purple-1000">
                <option className="text-miru-han-purple-1000" value="Jon Smith">
                  THIS WEEK
                </option>
              </select>
            </div>
              <p className="mb-3">
                TOTAL HOURS: <span>{totalhours}</span>
              </p>
              <div className="w-full bg-gray-200 flex h-1">
                  {clients.map((client, index) => {
                    return <GetClientBar 
                      client={client} 
                      key={index} 
                      index={index} 
                      totalHours={totalhours} 
                    />
                  })
                  }
              </div>
              <div className="flex border-b-2 border-miru-gray-1000 border-b-miru-gray-1000 pb-6 justify-between mt-3">
                <span>
                  0
                </span>
                <span>
                  {totalhours}
                </span>
              </div>
              <div className="flex pt-6">
                  <div className="flex-auto border-r-2 py-2 border-miru-gray-1000 border-r-miru-gray-1000">
                    <p>
                      OVERDUE
                    </p>
                    <h4 className="text-4xl mt-3">
                      $35.3K
                    </h4>
                  </div>
                  <div className="flex-auto py-2 pl-5">
                    <p>
                      OUTSTANDING
                    </p>
                    <h4 className="text-4xl mt-3">
                      $35.3K
                    </h4>  
                  </div>
              </div>
            </div>
            <div className="overflow-hidden border-b-2 border-miru-gray-200">
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      CLIENT
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-5 text-left text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      EMAIL ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-5 text-right text-sm font-semibold text-miru-dark-purple-600 tracking-wider"
                    >
                      HOURS LOGGED
                    </th>
                    <th scope="col" className="relative px-6 py-3"></th>
                    <th scope="col" className="relative px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client, index) => (
                    <Client
                      key={index}
                      {...client}
                      editIcon={editIcon}
                      deleteIcon={deleteIcon}
                      isAdminUser={isAdminUser}
                      setShowEditDialog={setShowEditDialog}
                      setClientToEdit={setClientToEdit}
                      setShowDeleteDialog={setShowDeleteDialog}
                      setClientToDelete={setClientToDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog ? (
        <EditClient
          setShowEditDialog={setShowEditDialog}
          client={clientToEdit}
        />
      ) : null}
      {showDeleteDialog && (
        <DeleteClient
          setShowDeleteDialog={setShowDeleteDialog}
          client={clientToDelete}
        />
      )}
    </>
  );
};

export default Clients;
