import Logger from "js-logger";

const setToLocalStorage = (key, value) => {
  try {
    if (value !== null) {
      localStorage.setItem(key, JSON.stringify(value));
    } else localStorage.removeItem(key);
  } catch (error) {
    Logger.error(error);
  }
};

const getValueFromLocalStorage = key => {
  let response = "";
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      response = "";
    } else {
      try {
        response = JSON.parse(value);
      } catch {
        response = value;
      }
    }
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
