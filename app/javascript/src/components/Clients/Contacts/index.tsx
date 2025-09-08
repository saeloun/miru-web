import React, { useEffect, useState } from "react";

import { clientMembersApi, teamApi } from "apis/api";
import Loader from "common/Loader";

import AddContacts from "./AddContacts";
import DeleteContact from "./DeleteContact";
import EditContact from "./EditContact";
import ContactsList from "./List";

const Contacts = ({ isContactOpen, setIsContactOpen, clientDetails }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [addContactModal, setAddContactModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [deleteContactModal, setDeleteContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contact, setContact] = useState({});
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [
    virtualVerifiedInvitationsAllowed,
    setVirtualVerifiedInvitationsAllowed,
  ] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    const res = await clientMembersApi.get(clientDetails.id);
    const pendingInvitationEmails = res?.data?.invitations.filter(
      contact => contact.accepted_at === null
    );

    setContacts(res?.data?.clientMembers);
    setInvitedEmails(pendingInvitationEmails);
    setVirtualVerifiedInvitationsAllowed(
      res?.data?.virtualVerifiedInvitationsAllowed
    );
    setIsLoading(false);
  };

  const displayEditContact = contact => {
    setContact(contact);
    setEditContactModal(true);
  };

  const displayDeleteContact = contact => {
    setContact(contact);
    setDeleteContactModal(true);
  };

  const handleVerifyContact = async contact => {
    const payload = { virtual_verified: !contact.virtual_verified };
    await teamApi.updateInvitedMember(contact.id, payload);
    fetchContacts();
  };

  if (isLoading) {
    return <Loader />;
  }

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

  if (deleteContactModal) {
    return (
      <DeleteContact
        client={clientDetails}
        contact={contact}
        fetchContacts={fetchContacts}
        setShowDeleteDialog={setDeleteContactModal}
        showDeleteDialog={deleteContactModal}
      />
    );
  }

  return (
    <ContactsList
      contacts={contacts}
      displayDeleteContact={displayDeleteContact}
      displayEditContact={displayEditContact}
      handleVerifyContact={handleVerifyContact}
      invitedEmails={invitedEmails}
      isContactOpen={isContactOpen}
      setAddContactModal={setAddContactModal}
      setIsContactOpen={setIsContactOpen}
      virtualVerifiedInvitationsAllowed={virtualVerifiedInvitationsAllowed}
    />
  );
};

export default Contacts;
