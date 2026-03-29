export interface Device {
  id?: number;
  device_type: "laptop" | "mobile" | "";
  name: string;
  serial_number: string;
  specifications: {
    ram: string;
    graphics: string;
    processor: string;
    storage?: string;
  };
}
