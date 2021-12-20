const setToLocalStorage = ({ isLoggedIn, email, token }) => {
  localStorage.setItem("isLoggedIn", isLoggedIn);
  localStorage.setItem("authEmail", email);
  localStorage.setItem("authToken", token);
};

const getFromLocalStorage = key => localStorage.getItem(key);

export { setToLocalStorage, getFromLocalStorage };
