import React from "react";

import clients from "apis/clients";

const closeButton = require("../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

export interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const [name, setName] = React.useState<string>(client.name);
  const [email, setEmail] = React.useState<string>(client.email);
  const [phone, setPhone] = React.useState<string>(client.phone);
  const [address, setAddress] = React.useState<string>(client.address);
  const [errors, setErrors] = React.useState<{ name: string; email: string }>({
    name: "",
    email: ""
  });

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const res = await clients.update(client.id, {
        client: {
          name,
          email,
          phone,
          address
        }
      });
      setTimeout(() => {
        if (res.data?.success) {
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      if (err.response.status == 422) {
        setErrors({
          name: err.response.data.errors.name
            ? err.response.data.errors.name[0]
            : null,
          email: err.response.data.errors.email
            ? err.response.data.errors.email[0]
            : null
        });
      }
    }
  };
  return (
    <div className="px-4 min-h-screen flex items-center justify-center">
      <div
        className="overflow-auto absolute inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 min-h-screen md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">Edit Client Details</h6>
              <button type="button">
                <img
                  src={closeButton}
                  onClick={() => {
                    setShowEditDialog(false);
                  }}
                />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mt-4">
                <div className="field">
                  <div className="field_with_errors">
                    <label className="form__label">Name</label>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.name}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      placeholder="Enter name"
                      className={`form__input ${
                        errors.name
                          ? "border-red-600 focus:ring-red-600 focus:border-red-600"
                          : "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                      }`}
                      type="text"
                      name="client[name]"
                      id="client_name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="field">
                  <div className="field_with_errors">
                    <label className="form__label">Email</label>
                    <div className="tracking-wider block text-xs text-red-600">
                      {errors.email}
                    </div>
                  </div>
                  <div className="mt-1">
                    <input
                      placeholder="Enter email ID"
                      className={`form__input ${
                        errors.email
                          ? "border-red-600 focus:ring-red-600 focus:border-red-600"
                          : "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"
                      }`}
                      type="text"
                      name="client[email]"
                      id="client_email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
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
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
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
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="actions mt-4">
                <input
                  type="submit"
                  name="commit"
                  value="SAVE CHANGES"
                  className="form__input_submit"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClient;
