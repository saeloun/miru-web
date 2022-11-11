import React from "react";

import leads from "apis/leads";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  lead: any;
  setShowDeleteDialog: any;
}

const DeleteLead = ({ lead, setShowDeleteDialog }: IProps) => {

  const deleteLead = async lead => {
    await leads.destroy(lead.id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <ConfirmDialog
      title='Delete Lead'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteLead(lead) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete lead{" "}
      <b className="font-bold">{lead.name}</b>? This action cannot
      be reversed.
    </ConfirmDialog>
  );
};

export default DeleteLead;
