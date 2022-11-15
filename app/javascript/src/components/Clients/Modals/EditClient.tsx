import React, { useState } from "react";

import { X } from "phosphor-react";

import clientApi from "apis/clients";

import { ClientForm } from "./ClientForm";

export interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const [apiError, setApiError] = useState<string>("");
  const [clientLogoUrl, setClientLogoUrl] = useState(client.client_logo);
  const [clientLogo, setClientLogo] = useState("");

  const handleSubmit = async (values) => {
    const formData = new FormData();
    formData.append("client[name]", values.name);
    formData.append("client[email]", values.email);
    formData.append("client[phone]", values.phone);
    formData.append("client[address]", values.address);
    if (clientLogo) formData.append("client[client_logo]", clientLogo);

    await clientApi
      .update(client.id, formData)
      .then(() => {
        setShowEditDialog(false);
        document.location.reload();
      })
      .catch((e) => {
        setApiError(e.message);
      });
  };

  const handleDeleteLogo = (event) => {
    event.preventDefault();

    clientApi.removeLogo(client.id).then((res) => {
      if (res.status === 200) {
        setClientLogo("");
        setClientLogoUrl("");
      }
    });
  };

  return (
    <div className='px-4 flex items-center justify-center'>
      <div
        className='overflow-auto fixed top-0 left-0 right-0 bottom-0 inset-0 z-10 flex items-start justify-center'
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className='relative px-4 h-full w-full md:flex md:items-center md:justify-center'>
          <div className='rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width'>
            <div className='flex justify-between items-center mt-6'>
              <h6 className='text-base font-extrabold'>Edit Client</h6>
              <button
                type='button'
                onClick={() => {
                  setShowEditDialog(false);
                }}
              >
                <X size={16} color='#CDD6DF' weight='bold' />
              </button>
            </div>
            <ClientForm
              clientLogoUrl={clientLogoUrl}
              clientData={client}
              handleSubmit={handleSubmit}
              handleDeleteLogo={handleDeleteLogo}
              setClientLogoUrl={setClientLogoUrl}
              setClientLogo={setClientLogo}
              formType='edit'
              apiError={apiError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
