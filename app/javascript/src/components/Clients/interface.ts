interface ClientArray {
  clients: any;
}

export interface IChartBar extends ClientArray {
  handleSelectChange: any
  totalMinutes: number;
}

export interface IChartBarGraph {
  totalMinutes: number;
  index: number;
  client: any;
}
