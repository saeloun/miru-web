import * as React from "react";

const divStyle = {
  backgroundColor: "rgba(29, 26, 49, 0.6)"
};

export interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => (
  <div className="px-4 min-h-screen flex items-center justify-center">
    <div
      className="overflow-auto absolute inset-0 z-10 flex items-start justify-center"
      style={divStyle}
    >
      <div className="relative px-4 min-h-screen md:flex md:items-center md:justify-center">
        <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
          <div className="flex justify-between items-center mt-6">
            <h6 className="text-base font-extrabold">Add New Client</h6>
            <button type="button">
              <img
                src="http://localhost:3000/assets/close_button-620ce255d4d2499e9732af0732c2945de213d68bda45dd7f7642f319df09b569.svg"
                onClick={() => {
                  setShowEditDialog(false);
                }}
              />
            </button>
          </div>
          <form action="/clients" acceptCharset="UTF-8" method="post">
            <input
              type="hidden"
              name="authenticity_token"
              value="xBTEYrP4yUDrrlF_EX7rK7CrZoqVUANxvnxPCIH6t6E82Gc0sf_HClgaomRPHOWKcbuCI9a1_Xf7xmSvMqToiA"
            />
            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Name</label>
                  <div className="tracking-wider block text-xs text-red-600"></div>
                </div>
                <div className="mt-1">
                  <input
                    placeholder="Enter name"
                    className="form__input border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                    type="text"
                    name="client[name]"
                    id="client_name"
                    value={client.name}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Email</label>
                  <div className="tracking-wider block text-xs text-red-600"></div>
                </div>
                <div className="mt-1">
                  <input
                    placeholder="Enter email ID"
                    className="form__input border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                    type="text"
                    name="client[email]"
                    id="client_email"
                    value={client.email}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Phone number</label>
                  <div className="tracking-wider block text-xs text-red-600"></div>
                </div>
                <div className="mt-1">
                  <input
                    placeholder="Enter phone number"
                    className="form__input border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                    type="text"
                    name="client[phone]"
                    id="client_phone"
                    value={client.phone}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="field">
                <div className="field_with_errors">
                  <label className="form__label">Address</label>
                  <div className="tracking-wider block text-xs text-red-600"></div>
                </div>
                <div className="mt-1">
                  <textarea
                    placeholder="Enter address"
                    className="form__textarea border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                    name="client[address]"
                    id="client_address"
                    value={client.address}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="actions mt-4">
              <input
                type="submit"
                name="commit"
                value="ADD CLIENT"
                className="form__input_submit"
                data-disable-with="ADD CLIENT"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);

export default EditClient;
