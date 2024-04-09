import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {baseUrl} from "../config/config"

export const lightApi = createApi({
  reducerPath: "light/api",
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    // prepareHeaders: (headers, { getState }) => {
    //   const token = getState().auth.token
    //   if (token) {
    //     headers.set('authorization', `Bearer ${token}`)
    //   }
    //   return headers
    // },
  }),
  endpoints: (build) => ({
    getState: build.query({
      query: () => ({
        url: "state",
      }),
     // providesTags:['State'],
    }),
    update: build.mutation({
      query(body) {
        return {
          url: `update`,
          method: 'POST',
          body
        }
      },
      //invalidatesTags: ['State'],
    }),
  }),
});

export const { useGetStateQuery,useUpdateMutation, refetch } = lightApi;
