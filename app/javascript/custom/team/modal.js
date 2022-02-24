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

  function ClearFields () {
    document.getElementById("team_first_name").value = "";
    document.getElementById("team_last_name").value = "";
    document.getElementById("team_email").value = "";
  }

  const newTeamMemberBtn = document.getElementById("new-team-member-btn");
  const teamInviteModalClose = document.getElementById(
    "team-invite-modal-close"
  );
  const teamInviteModalCloseBtn = document.getElementById(
    "team-invite-modal-close-btn"
  );
  const teamModalClose = document.getElementById("team-modal-close");
  const editTeamMembers = document.querySelectorAll(".edit-team-member");

  if (newTeamMemberBtn)
    newTeamMemberBtn.addEventListener("click", () => openModal("main-modal"));
  if (teamInviteModalClose)
    teamInviteModalClose.addEventListener("click", () =>
      modalClose("main-modal")
    );
  if (teamInviteModalCloseBtn)
    teamInviteModalCloseBtn.addEventListener("click", () => ClearFields());
  if (teamModalClose)
    teamModalClose.addEventListener("click", () => modalClose("another-modal"));

  editTeamMembers.forEach(editTeamMember => {
    editTeamMember.addEventListener("click", () => openModal("another-modal"));
  });
});
