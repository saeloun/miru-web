interface ClientArray {
  clients: [{
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    hoursLogged: string;
    editIcon: string;
    deleteIcon: string;
    isAdminUser: boolean;
    setShowEditDialog: any;
    setClientToEdit: any;
    setClientToDelete: any;
    setShowDeleteDialog: any;
  }];
}

export interface IChartBar extends ClientArray {
  totalHours: number;
}

export interface IChartBarGraph {
  totalHours: number;
  index: number;
  client: any;
}