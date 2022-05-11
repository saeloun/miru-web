
interface GenerateInvoiceClientList {
  address: string;
  id: number;
  name: string;
  phone_number: number;
  email: string
}

interface CompanyDetails {
  address: string;
  country: string;
  id: number;
  logo: string;
  name: string;
  phone_number: string;
}

const getClientList = (clientList: Array<GenerateInvoiceClientList>) => clientList.map(client => ({
  address: client.address,
  value: client.id,
  label: client.name,
  phone: client.phone_number,
  email: client.email
}));

const getCompanyDetails = (input: CompanyDetails) => input;

const unmapGenerateInvoice = (input) => {
  const companyDetails = getCompanyDetails(input.company_details);
  const clientList = getClientList(input.company_client_list);
  return {
    companyDetails,
    clientList
  };
};

export {
  unmapGenerateInvoice
};
