import React from "react";
import { Navigate } from "react-router-dom";

const Gate = ({ role, allowedRoles, children }) => {
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default Gate;
