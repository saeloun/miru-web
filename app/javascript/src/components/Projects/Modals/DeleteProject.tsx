import React from "react";

import projectApi from "apis/projects";
import ConfirmDialog from "common/Modal/ConfirmDialog";

interface IProps {
  project: any;
  setShowDeleteDialog: any;
  fetchProjectList: any;
}

const DeleteProject = ({ project, setShowDeleteDialog, fetchProjectList }: IProps) => {
  const deleteProject = async project => {
    const res = await projectApi.destroy(project.id);
    if (res.status === 200) {
      setShowDeleteDialog(false);
    }
    fetchProjectList();
  };
  return (
    <ConfirmDialog
      title='Delete Project'
      open={true}
      onClose={() => setShowDeleteDialog(false) }
      onConfirm={ () => deleteProject(project) }
      yesButtonText="DELETE"
      noButtonText="CANCEL"
    >
      Are you sure you want to delete project <b className="font-bold">{project.name}</b>? This action cannot be reversed.
    </ConfirmDialog>
  );
};

export default DeleteProject;
