import React from "react";

import leadLineItems from "apis/lead-line-items";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  leadDetails: any;
  item: any;
  setShowDeleteDialog: any;
}

const DeleteLineItem = ({ leadDetails, item, setShowDeleteDialog }: IProps) => {
  const deleteLead = async () => {
    await leadLineItems.destroy(leadDetails.id, item.id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <ConfirmDialog
      title='Delete Line Item'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteLead }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete item{" "}
      <b className="font-bold">{item.name}</b>?
      This action cannot be reversed.
    </ConfirmDialog>
  );
};

export default DeleteLineItem;
