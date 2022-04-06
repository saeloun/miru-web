
interface GenerateInvoiceClientList {
  address: string;
  id: number;
  name: string;
  phone_number: number;
}

const unmapClientListDropdown = (clientList:Array<GenerateInvoiceClientList>) => clientList.map(client => ({
  address: client.address,
  value: client.id,
  label: client.name,
  phone: client.phone_number
}));

export {
  unmapClientListDropdown
};
