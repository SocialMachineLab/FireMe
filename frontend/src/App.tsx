import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import GlobalSnackbar from "./components/common/GlobalSnackbar";

const App : React.FC = () => {
  return (
  <>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
    <GlobalSnackbar />
  </>);
}


export default App;
