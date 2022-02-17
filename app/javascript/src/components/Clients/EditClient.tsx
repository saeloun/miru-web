import * as React from "react";
import clients from "../../apis/clients";

export interface IEditClient {
  setShowEditDialog: any;
  client: any;
}

const EditClient = ({ setShowEditDialog, client }: IEditClient) => {
  const { useState } = React;
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [address, setAddress] = useState(client.address);
  const [errors, setErrors] = useState({} as any);

  const handleNameChange = e => {
    setName(e.target.value);
  };

  const handleEmailChange = e => {
    setEmail(e.target.value);
  };

  const handlePhoneChange = e => {
    setPhone(e.target.value);
  };

  const handleAddressChange = e => {
    setAddress(e.target.value);
  };

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

      if (res.data?.success) {
        window.location.reload();
      }
    } catch (err) {
      if (err.response.status == 422) {
        setErrors({
          name: err.response.data.name ? err.response.data.name[0] : null,
          email: err.response.data.email ? err.response.data.email[0] : null
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
                  src="http://localhost:3000/assets/close_button-620ce255d4d2499e9732af0732c2945de213d68bda45dd7f7642f319df09b569.svg"
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
                      onChange={handleNameChange}
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
                      onChange={handleEmailChange}
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
                      onChange={handlePhoneChange}
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
                      onChange={handleAddressChange}
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
