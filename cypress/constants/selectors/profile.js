import { dataCy } from "../../support/utils/datacy";

export const profileSelectors = {
  updateProfile:dataCy('update-profile'),
  profileImage: dataCy('profile-image'),
  deleteImage: dataCy('delete-image'),
  firstName: dataCy('first-name'),
  lastName: dataCy('last-name'),
  changePassword: dataCy('change-password'),
  currentPassword: dataCy('current-password'),
  password: dataCy("password"),
  confirmPassword: dataCy("confirm-password")
};
