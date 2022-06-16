import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import UserContext from "context/UserContext";
import List from "./List";

const RouteConfig = ({ isAdminUser }) => {
  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
  }, []);

  return (
    <UserContext.Provider value={{ isAdminUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="team">
            <Route index element={<List />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserContext.Provider>
  );
};

export default RouteConfig;
