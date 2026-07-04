import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}

export default AppRoutes;