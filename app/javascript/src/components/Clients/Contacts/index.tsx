import React, { useEffect, useState } from "react";

import clientMembersApi from "apis/clientMembers";

import AddContacts from "./AddContacts";
import EditContact from "./EditContact";
import ContactsList from "./List";

const Contacts = ({ isContactOpen, setIsContactOpen, clientDetails }) => {
  const [addContactModal, setAddContactModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contact, setContact] = useState({});
  const [invitedEmails, setInvitedEmails] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const res = await clientMembersApi.get(clientDetails.id);
    const pendingInvitationEmails = res?.data?.invitations.filter(
      contact => contact.accepted_at === null
    );

    setContacts(res?.data?.clientMembers);
    setInvitedEmails(pendingInvitationEmails);
  };

  const displayEditContact = contact => {
    setContact(contact);
    setEditContactModal(true);
  };

  if (addContactModal) {
    return (
      <AddContacts
        client={clientDetails}
        fetchDetails={fetchContacts}
        setShowContactModal={setAddContactModal}
        showContactModal={addContactModal}
      />
    );
  }

  if (editContactModal) {
    return (
      <EditContact
        client={clientDetails}
        contact={contact}
        fetchDetails={fetchContacts}
        setShowContactModal={setEditContactModal}
        showContactModal={editContactModal}
      />
    );
  }

  return (
    <ContactsList
      contacts={contacts}
      displayEditContact={displayEditContact}
      invitedEmails={invitedEmails}
      isContactOpen={isContactOpen}
      setAddContactModal={setAddContactModal}
      setIsContactOpen={setIsContactOpen}
    />
  );
};

export default Contacts;
