import React from "react";
import clients from "apis/clients";

interface IProps {
  client: any;
  setShowDeleteDialog: any;
}

const DeleteClient = ({ client, setShowDeleteDialog }: IProps) => {
  const deleteClient = async client => {
    await clients.destroy(client.id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <div className="px-4 min-h-screen flex items-center justify-center">
      <div
        className="overflow-auto absolute inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 min-h-screen md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex-col my-8">
              <h6 className="text-2xl font-bold mb-2">Delete Client</h6>
              <p className="font-normal mt-2">
                Are you sure you want to delete client{" "}
                <b className="font-bold">{client.name}</b>? This action cannot
                be reversed.
              </p>
            </div>
            <div className="flex justify-between">
              <button
                className="button__bg_transparent"
                onClick={() => {
                  setShowDeleteDialog(false);
                }}
              >
                CANCEL
              </button>
              <button
                className="button__bg_purple"
                onClick={() => {
                  deleteClient(client);
                }}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteClient;
