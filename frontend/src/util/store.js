import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import eventReducer from "./slices/eventSlice"; // Add event slice
import ticketReducer from "./slices/ticketSlice"; // Add ticket slice
// import paymentReducer from "./slices/paymentSlice";
// import salesReducer from "./slices/salesSlice";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user", "ticket", "event"], // persist only essential slices
};

const rootReducer = combineReducers({
  user: userReducer,
  event: eventReducer, // Manage event state
  ticket: ticketReducer, // Manage ticket state
//   payment: paymentReducer,
//   sales: salesReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
