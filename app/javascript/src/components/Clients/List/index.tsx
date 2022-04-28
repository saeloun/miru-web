import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import clients from "apis/clients";

import AmountBoxContainer from "common/AmountBox";
import ChartBar from "common/ChartBar";
import Table from "common/Table";

import Header from "./Header";
import { unmapClientList } from "../../../mapper/client.mapper";
import DeleteClient from "../Modals/DeleteClient";
import EditClient from "../Modals/EditClient";
import NewClient from "../Modals/NewClient";

const getTableData = (clients) => {
  if (clients) {
    return clients.map((client) => {
      const hours = client.minutes/60;
      return {
        col1: <div className="text-base text-miru-dark-purple-1000">{client.name}</div>,
        col2: <div className="text-base text-miru-dark-purple-1000 text-right">{client.email}</div>,
        col3: <div className="text-base text-miru-dark-purple-1000 text-right">{hours}</div>,
        rowId: client.id
      };
    });
  }
  return [{}];
};

const Clients = ({ isAdminUser }) => {
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [newClient, setnewClient] = useState<boolean>(false);
  const [clientToEdit, setedit] = useState({});
  const [clientToDelete, setDelete] = useState({});
  const [clientData, setClientData] = useState<any>();
  const [totalMinutes, setTotalMinutes] = useState(null);
  const navigate = useNavigate();

  const handleEditClick = (id) => {
    setShowEditDialog(true);
    const editSelection = clientData.find(client => client.id === id);
    setedit(editSelection);
  };

  const handleDeleteClick = (id) => {
    setShowDeleteDialog(true);
    const editSelection = clientData.find(client => client.id === id);
    setDelete(editSelection);
  };

  const handleSelectChange = (event) => {
    clients.get(`?time_frame=${event.target.value}`)
      .then((res) => {
        const sanitized = unmapClientList(res);
        setClientData(sanitized.clientList);
        setTotalMinutes(sanitized.totalMinutes);
      });
  };

  const handleRowClick = (id) => {
    navigate(`${id}`);
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    clients.get("?time_frame=week")
      .then((res) => {
        const sanitized = unmapClientList(res);
        setClientData(sanitized.clientList);
        setTotalMinutes(sanitized.totalMinutes);
      });
  }, []);

  const tableHeader = [
    {
      Header: "CLIENT",
      accessor: "col1", // accessor is the "key" in the data
      cssClass: ""
    },
    {
      Header: "EMAIL ID",
      accessor: "col2",
      cssClass: "text-right"
    },
    {
      Header: "HOURS LOGGED",
      accessor: "col3",
      cssClass: "text-right" // accessor is the "key" in the data
    }
  ];

  const amountBox = [{
    title: "OVERDUE",
    amount: "$35.5k"
  },
  {
    title: "OUTSTANDING",
    amount: "$24.3k"
  }];

  const tableData = getTableData(clientData);

  return (
    <>
      <ToastContainer />
      <Header setnewClient={setnewClient} />
      <div>
        { isAdminUser && <div className="bg-miru-gray-100 py-10 px-10">
          <div className="flex justify-end">
            <select onChange={handleSelectChange} className="px-3
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
              <option className="text-miru-dark-purple-600" value="week">
                    THIS WEEK
              </option>
              <option className="text-miru-dark-purple-600" value="month">
                    This MONTH
              </option>
              <option className="text-miru-dark-purple-600" value="year">
                    THIS YEAR
              </option>
            </select>
          </div>
          {clientData && <ChartBar data={clientData} totalMinutes={totalMinutes} />}
          <AmountBoxContainer amountBox = {amountBox} />
        </div>
        }
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                { clientData && <Table
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  hasRowIcons={true}
                  tableHeader={tableHeader}
                  tableRowArray={tableData}
                  rowOnClick={isAdminUser && handleRowClick}
                /> }
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditDialog &&
        <EditClient
          setShowEditDialog={setShowEditDialog}
          client={clientToEdit}
        />
      }
      {showDeleteDialog && (
        <DeleteClient
          setShowDeleteDialog={setShowDeleteDialog}
          client={clientToDelete}
        />
      )}
      {newClient && (
        <NewClient
          setnewClient={setnewClient}
          setClientData = {setClientData}
          clientData = {clientData}
        />
      )}
    </>
  );
};

export default Clients;
