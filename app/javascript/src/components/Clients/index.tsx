import * as React from "react";
import { ToastContainer } from "react-toastify";

import { setAuthHeaders, registerIntercepts } from "apis/axios";

import DeleteClient from "components/Clients/DeleteClient";
import { Client } from "./Client";
import EditClient from "./EditClient";

const Clients = ({ clients, editIcon, deleteIcon, isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = React.useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] =
    React.useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = React.useState({});
  const [clientToDelete, setClientToDelete] = React.useState({});

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
