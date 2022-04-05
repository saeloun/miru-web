interface ClientArray {
  clients: any;
}

export interface IChartBar extends ClientArray {
  handleSelectChange: any
  totalMinutes: number;
}

export interface ISingleClient {
  totalMinutes: number;
  index: number;
  element: any;
}

export interface IChartBarGraph {
  data: any;
  totalMinutes: number;
}
