import React from "react";

import { projectApi } from "apis/api";
import { Modal, Button } from "StyledComponents";

interface IProps {
  project: any;
  setShowDeleteDialog: any;
  showDeleteDialog: boolean;
  fetchProjectList: any;
}

const DeleteProject = ({
  project,
  setShowDeleteDialog,
  showDeleteDialog,
  fetchProjectList,
}: IProps) => {
  const deleteProject = async project => {
    const res = await projectApi.destroy(project.id);
    if (res.status === 200) {
      setShowDeleteDialog(false);
    }
    fetchProjectList();
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
    >
      <div className="my-8 flex-col">
        <h6 className="mb-2 text-2xl font-bold">Delete Project</h6>
        <p className="mt-2 font-normal">
          Are you sure you want to delete project{" "}
          <b className="font-bold">{project.name}</b>? This action cannot be
          reversed.
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          onClick={() => {
            setShowDeleteDialog(false);
          }}
        >
          CANCEL
        </Button>
        <Button
          className="ml-2 w-1/2"
          size="medium"
          style="primary"
          onClick={() => {
            deleteProject(project);
          }}
        >
          DELETE
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteProject;
