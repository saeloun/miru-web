export interface Device {
  id: "";
  device_type: "laptop" | "mobile" | "";
  name: string;
  serial_number: string;
  insurance_activation_date: string;
  insurance_expiry_date: string;
  is_insured: boolean;
  specifications: {
    ram: string;
    graphics: string;
    processor: string;
  };
}
