interface ClientArray {
  clients: any;
}

export interface IChartBar extends ClientArray {
  handleSelectChange: any
  totalHours: number;
}

export interface IChartBarGraph {
  totalHours: number;
  index: number;
  client: any;
}
