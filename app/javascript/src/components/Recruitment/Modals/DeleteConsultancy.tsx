import React from "react";

import consultancies from "apis/consultancies";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  consultancy: any;
  setShowDeleteDialog: any;
}

const DeleteConsultancy = ({ consultancy, setShowDeleteDialog }: IProps) => {

  const deleteConsultancy = async consultancy => {
    await consultancies.destroy(consultancy.id);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  return (
    <ConfirmDialog
      title='Delete Consultancy'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteConsultancy(consultancy) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete consultancy <b className="font-bold">{consultancy.name}</b>? This action cannot be reversed.
    </ConfirmDialog>
  );
};

export default DeleteConsultancy;
