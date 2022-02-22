import * as React from "react";
import clients from "apis/clients";
const closeButton = require("../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

interface IProps {
  client: number;
  setShowDeleteDialog: any;
}

const DeleteClient = ({ client, setShowDeleteDialog }: IProps) => {
  const deleteClient = async id => {
    await clients.destroy(id);
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
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">Delete client?</h6>
              <button type="button">
                <img
                  src={closeButton}
                  onClick={() => {
                    setShowDeleteDialog(false);
                  }}
                />
              </button>
            </div>
            <div>
              <button
                className="actions mt-4 form__input_submit"
                onClick={() => {
                  deleteClient(client);
                }}
              >
                Yes
              </button>
              <button
                className="actions mt-4 form__input_submit"
                onClick={() => {
                  setShowDeleteDialog(false);
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteClient;
