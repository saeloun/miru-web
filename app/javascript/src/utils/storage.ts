import Logger from "js-logger";

const setToLocalStorage = (key, value) => {
    if (value !== null) {
      localStorage.setItem(key, JSON.stringify(value));
    } else localStorage.removeItem(key);
  };

  const getFromLocalStorage = key => {
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

  const clearLocalStorageCredentials = () => {
    setToLocalStorage("authEmail", null);
    setToLocalStorage("authToken", null);
  };

  export { setToLocalStorage, getFromLocalStorage, clearLocalStorageCredentials };
