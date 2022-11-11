import React from "react";

import leadQuotes from "apis/lead-quotes";
import ConfirmDialog from "common/Modal/ConfirmDialog";

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
    <ConfirmDialog
      title='Delete Quote'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteLead }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete lead <b className="font-bold">{item.name}</b>? This action cannot
      be reversed.
    </ConfirmDialog>
  );
};

export default DeleteQuote;
