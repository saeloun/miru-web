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

const removeFromLocalStorage = key => {
  localStorage.removeItem(key);
};

const clearCredentialsFromLocalStorage = () => {
  setToLocalStorage("authEmail", null);
  setToLocalStorage("authToken", null);
};

export {
  setToLocalStorage,
  getValueFromLocalStorage,
  clearCredentialsFromLocalStorage,
  removeFromLocalStorage,
};
