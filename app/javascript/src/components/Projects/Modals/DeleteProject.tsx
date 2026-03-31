import React from "react";

import { projectApi } from "apis/api";
import { i18n } from "../../../i18n";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

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
    <Dialog
      open={showDeleteDialog}
      onOpenChange={open => !open && setShowDeleteDialog(false)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{i18n.t("projects.deleteProject")}</DialogTitle>
          <DialogDescription>
            {i18n.t("projects.deleteProjectConfirm", { name: project.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowDeleteDialog(false);
            }}
          >
            {i18n.t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              deleteProject(project);
            }}
          >
            {i18n.t("projects.deleteProject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProject;
