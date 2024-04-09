import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from '@reduxjs/toolkit/query'
import { localStorageMiddleware, reHydrateStore } from "./localStoreMiddleware";
import { lightApi } from "./lightApi";

const reducer = {
  [lightApi.reducerPath]: lightApi.reducer,
};

export const store = configureStore({
  reducer,
  preloadedState: reHydrateStore(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([lightApi.middleware,localStorageMiddleware]),
});

setupListeners(store.dispatch)
