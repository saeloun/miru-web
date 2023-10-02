export interface Device {
  device_type: string;
  name: string;
  serial_number: string;
  specifications: {
    ram: string;
    graphics: string;
    processor: string;
  };
}
