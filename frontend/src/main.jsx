// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
// import App from "./App";

// // Create a root using ReactDOM.createRoot
// const root = ReactDOM.createRoot(document.getElementById("root"));

// // Render the App component within the BrowserRouter
// root.render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </React.StrictMode>
// );

import { createRoot } from "react-dom/client";
import "./index.css";
import { ToastContainer } from "react-toastify";
import { mainRouter } from "./router/mainRouter.jsx";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import store, { persistor } from "./util/store.js";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <ToastContainer position="top-right" autoClose={3000} />
      <RouterProvider router={mainRouter} />
    </PersistGate>
  </Provider>
);
