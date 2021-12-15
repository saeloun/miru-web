import React, { useEffect, useState } from "react";
import { setAuthHeaders } from "./apis/axios";
import { initializeLogger } from "./common/logger";

const App = () => {
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    initializeLogger();
    setAuthHeaders(setLoading);
  }, []);
  if (loading) {
    return <h1>Loading...</h1>;
  }
  return <div className="bg-gray-100 text-center">Welcome to Miru Web!</div>;
};

export default App;
