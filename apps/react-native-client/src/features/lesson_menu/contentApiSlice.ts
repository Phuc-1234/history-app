import { apiSlice } from "../../services/apiSlice";
import { GradeStructureDto } from "@history-app/shared";

export const contentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGradeStructure: builder.query<GradeStructureDto, number>({
      query: (gradeId) => `/api/content/grade-struct/${gradeId}`, 
    }),
  }),
});

export const { useGetGradeStructureQuery } = contentApiSlice;