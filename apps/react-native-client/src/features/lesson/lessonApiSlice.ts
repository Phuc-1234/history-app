// services/contentApi.ts
import { apiSlice } from "../../services/apiSlice";
import { LessonWithContentDto } from "@history-app/shared"; 

export const contentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLessonTree: builder.query<LessonWithContentDto, number>({
      query: (lessonId) => `/api/content/lessons/${lessonId}/tree`,
      providesTags: (result, error, lessonId) => [{ type: 'History', id: lessonId }],
    }),
  }),
});

export const { useGetLessonTreeQuery } = contentApi;