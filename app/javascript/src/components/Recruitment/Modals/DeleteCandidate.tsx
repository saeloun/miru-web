import React from "react";

import { useNavigate } from "react-router-dom";

import candidates from "apis/candidates";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  candidate: any;
  setShowDeleteDialog: any;
}

const DeleteCandidate = ({ candidate, setShowDeleteDialog }: IProps) => {

  const navigate = useNavigate();

  const deleteCandidate = async (candidate: any) => {
    await candidates.destroy(candidate.id);
    setTimeout(() => {
      navigate('recruitment/candidates')
    }, 500);
  };
  return (
    <ConfirmDialog
      title='Delete Candidate'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteCandidate(candidate) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete candidate <b className="font-bold">{candidate.name}</b>? This action cannot be reversed.
    </ConfirmDialog>
  );
};

export default DeleteCandidate;
