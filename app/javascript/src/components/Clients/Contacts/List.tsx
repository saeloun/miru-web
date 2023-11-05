import React from "react";

import { DeleteIcon, PencilIcon, PlusIcon, XIcon } from "miruIcons";
import { Badge, Modal } from "StyledComponents";

const ContactsList = ({
  isContactOpen,
  setIsContactOpen,
  contacts,
  invitedEmails,
  setAddContactModal,
  displayEditContact,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
    isOpen={isContactOpen}
    onClose={() => setIsContactOpen(false)}
  >
    <div className="flex items-center justify-between">
      <h6 className="text-base font-extrabold capitalize">Add Contacts</h6>
      <div>
        <button
          className="menuButton__button"
          type="button"
          onClick={() => setAddContactModal(true)}
        >
          <PlusIcon color="#5b34ea" size={16} weight="bold" />
        </button>
        <button
          className="menuButton__button ml-2"
          type="button"
          onClick={() => setIsContactOpen(false)}
        >
          <XIcon color="#CDD6DF" size={16} weight="bold" />
        </button>
      </div>
    </div>
    <div className="mt-4 text-base text-miru-dark-purple-400">
      {contacts.map((contact, index) => (
        <div className="mb-2 flex items-center justify-between" key={index}>
          <p
            style={{
              maxWidth: "80%",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {contact.email}
          </p>
          <div className="iconWrapper flex items-center justify-evenly">
            <button onClick={() => displayEditContact(contact)}>
              <PencilIcon color="#5b34ea" size={16} weight="bold" />
            </button>
            <button className="ml-10">
              <DeleteIcon color="#5b34ea" size={16} weight="bold" />
            </button>
          </div>
        </div>
      ))}
      {invitedEmails.map((contact, index) => (
        <div className="mb-2 flex items-center justify-between" key={index}>
          <span
            style={{
              maxWidth: "80%",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {contact.recipient_email}
          </span>
          <Badge text="Pending Invitation" />
        </div>
      ))}
    </div>
  </Modal>
);

export default ContactsList;
