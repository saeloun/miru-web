import * as React from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import axios from "axios";

import DeleteClient from "components/Clients/DeleteClient";
import { Client } from "./Client";
import ClientBarGraph from "./ClientBarGraph";
import EditClient from "./EditClient";

const Clients = ({ editIcon, deleteIcon, isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = React.useState({});
  const [clientToDelete, setClientToDelete] = React.useState({});
  const [clientData, setClientData] = React.useState([]);
  const [totalMinutes, setTotalMinutes] = React.useState(null);

  const handleSelectChange = (event) => {
    axios.get(`clients?time_frame=${event.target.value}`)
      .then((res) => {
        setClientData(res.data.client_details);
        setTotalMinutes(res.data.total_minutes);
      });
  };

  React.useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    axios.get("clients?time_frame=week")
      .then((res) => {
        setClientData(res.data.client_details);
        setTotalMinutes(res.data.total_minutes);
      });
  }, []);

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            { isAdminUser && <ClientBarGraph
              handleSelectChange={handleSelectChange}
              clients={clientData}
              totalMinutes={totalMinutes} />
            }
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="table__header"
                    >
                      CLIENT
                    </th>
                    <th
                      scope="col"
                      className="table__header"
                    >
                      EMAIL ID
                    </th>
                    <th
                      scope="col"
                      className="table__header text-right"
                    >
                      HOURS LOGGED
                    </th>
                    <th scope="col" className="table__header"></th>
                    <th scope="col" className="table__header"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientData.map((client, index) => (
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
