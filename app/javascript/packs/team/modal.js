document.addEventListener("DOMContentLoaded", function () {
  const all_modals = ["main-modal", "another-modal"];
  all_modals.forEach(modal => {
    const modalSelected = document.querySelector("." + modal);
    if (modalSelected === undefined || modalSelected === null) return;

    modalSelected.classList.remove("fadeIn");
    modalSelected.classList.add("fadeOut");
    modalSelected.style.display = "none";
  });

  const modalClose = modal => {
    const modalToClose = document.querySelector("." + modal);
    modalToClose.classList.remove("fadeIn");
    modalToClose.classList.add("fadeOut");
    setTimeout(() => {
      modalToClose.style.display = "none";
    }, 500);
  };

  const openModal = modal => {
    const modalToOpen = document.querySelector("." + modal);
    modalToOpen.classList.remove("fadeOut");
    modalToOpen.classList.add("fadeIn");
    modalToOpen.style.display = "flex";
  };

  const ClearFields = () => {
    document.getElementById("team_first_name").value = "";
    document.getElementById("team_last_name").value = "";
    document.getElementById("team_email").value = "";
  };

  const newUserBtn = document.querySelector(
    "a[data-team-element=\"new-user-btn\"]"
  );
  const inviteModalClose = document.querySelector(
    "div[data-team-element=\"invite-modal-close\"]"
  );
  const inviteModalCloseBtn = document.querySelector(
    "button[data-team-element=\"invite-modal-close-btn\"]"
  );
  const teamModalClose = document.querySelector(
    "div[data-team-element=\"modal-close\"]"
  );
  const editMembers = document.querySelectorAll(
    "img[data-team-element=\"edit-member\"]"
  );
  const editInvitations = document.querySelectorAll(
    "img[data-invitation-element=\"edit-invitation\"]"
  );

  if (newUserBtn)
    newUserBtn.addEventListener("click", () => openModal("main-modal"));
  if (inviteModalClose)
    inviteModalClose.addEventListener("click", () => modalClose("main-modal"));
  if (inviteModalCloseBtn)
    inviteModalCloseBtn.addEventListener("click", () => ClearFields());
  if (teamModalClose)
    teamModalClose.addEventListener("click", () => modalClose("another-modal"));

  editMembers.forEach(editMember => {
    editMember.addEventListener("click", () => openModal("another-modal"));
  });

  editInvitations.forEach(editMember => {
    editMember.addEventListener("click", () => openModal("main-modal"));
  });
});
