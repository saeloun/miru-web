import Logger from "js-logger";

const setToLocalStorage = (key, value) => {
  if (value !== null) {
    localStorage.setItem(key, JSON.stringify(value));
  } else localStorage.removeItem(key);
};

const getValueFromLocalStorage = key => {
  let response = "";
  try {
    const value = localStorage.getItem(key);
    response = value ? JSON.parse(value) : "";
  } catch (error) {
    Logger.error(error);
    response = "";
  }

  return response;
};

const clearCredentialsFromLocalStorage = () => {
  setToLocalStorage("authEmail", null);
  setToLocalStorage("authToken", null);
};

export {
  setToLocalStorage,
  getValueFromLocalStorage,
  clearCredentialsFromLocalStorage,
};
