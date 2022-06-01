import React from "react";
import leadQuotes from "apis/lead-quotes";

interface IProps {
  leadDetails: any;
  item: any;
  setShowDeleteDialog: any;
}

const DeleteQuote = ({ leadDetails, item, setShowDeleteDialog }: IProps) => {
  const deleteLead = async () => {
    await leadQuotes.destroy(leadDetails.id, item.id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <div className="px-4 flex items-center justify-center">
      <div
        className="overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 h-full w-full md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex-col my-8">
              <h6 className="text-2xl font-bold mb-2">Delete Lead</h6>
              <p className="font-normal mt-2">
                Are you sure you want to delete item{" "}
                <b className="font-bold">{item.name}</b>?
                This action cannot be reversed.
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
                onClick={deleteLead}
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

export default DeleteQuote;
