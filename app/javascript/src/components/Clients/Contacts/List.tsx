import React from "react";

import { DeleteIcon, PencilIcon, PlusIcon, XIcon } from "miruIcons";
import { Badge, Modal, Switch } from "StyledComponents";
import { i18n } from "../../../i18n";

const ContactsList = ({
  isContactOpen,
  setIsContactOpen,
  contacts,
  invitedEmails,
  setAddContactModal,
  displayEditContact,
  displayDeleteContact,
  handleVerifyContact,
  virtualVerifiedInvitationsAllowed,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-xl sm:align-middle overflow-visible"
    isOpen={isContactOpen}
    onClose={() => setIsContactOpen(false)}
  >
    <div className="flex items-center justify-between">
      <h6 className="text-base font-extrabold capitalize">
        {i18n.t("contacts.addContacts")}
      </h6>
      <div>
        <button
          className="menuButton__button"
          type="button"
          aria-label={i18n.t("contacts.addContact")}
          onClick={() => setAddContactModal(true)}
        >
          <PlusIcon color="#5b34ea" size={16} weight="bold" />
        </button>
        <button
          className="menuButton__button ml-2"
          type="button"
          aria-label={i18n.t("close")}
          onClick={() => setIsContactOpen(false)}
        >
          <XIcon color="#CDD6DF" size={16} weight="bold" />
        </button>
      </div>
    </div>
    <div className="mt-4 text-base text-muted-foreground">
      {contacts.map((contact, index) => (
        <div className="mb-3 flex items-center justify-between" key={index}>
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
            <button
              aria-label={i18n.t("contacts.editContact")}
              type="button"
              onClick={() => displayEditContact(contact)}
            >
              <PencilIcon color="#5b34ea" size={16} weight="bold" />
            </button>
            <button
              aria-label={i18n.t("contacts.deleteContact")}
              className="ml-10"
              type="button"
              onClick={() => displayDeleteContact(contact)}
            >
              <DeleteIcon color="#5b34ea" size={16} weight="bold" />
            </button>
          </div>
        </div>
      ))}
      <div className="mt-4">
        {invitedEmails.map((contact, index) => (
          <div className="mb-3 flex items-center justify-between" key={index}>
            <span
              style={{
                maxWidth: "60%",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {contact.recipient_email}
            </span>
            <div className="iconWrapper flex items-center justify-evenly">
              <Badge className="mr-2" text={i18n.t("pending")} />
              {virtualVerifiedInvitationsAllowed && (
                <Switch
                  enabled={contact.virtual_verified}
                  onChange={() => handleVerifyContact(contact)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </Modal>
);

export default ContactsList;
