export interface IProject {
  id: number;
  name: string;
  client: string;
  isBillable: boolean;
  minutesSpent: number;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setProjectToEdit: any;
  setProjectToDelete: any;
  setShowDeleteDialog: any;
  projectClickHandler: any;
  setShowProjectModal:any;
  setEditProjectData:any
}

export interface IMember {
  id: number;
  name: string;
  hourly_rate: number;
  minutes_logged: number;
  editIcon: string;
  deleteIcon: string;
  isAdminUser: boolean;
  setShowEditDialog: any;
  setMemberToEdit: any;
  setMemberToDelete: any;
  setShowDeleteDialog: any;
}
