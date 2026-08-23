import { apiSlice } from "../../services/apiSlice";
import { GradeStructureDto } from "@history-app/shared";

export const contentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGradeStructure: builder.query<GradeStructureDto, number>({
      query: (gradeId) => `/api/content/grade-struct/${gradeId}`, 
      providesTags: ["User"],
    }),
    getGrades: builder.query<{ grades: any[] }, void>({
      query: () => `/api/content/grades`,
      providesTags: ["User"],
    }),
    getTopicsByGrade: builder.query<{ topics: any[] }, number>({
      query: (gradeId) => `/api/content/grades/${gradeId}/topics`,
      providesTags: ["User"],
    }),
    getLessonsByTopic: builder.query<{ lessons: any[] }, number>({
      query: (topicId) => `/api/content/topics/${topicId}/lessons`,
      providesTags: ["User"],
    }),
    getSectionsByLesson: builder.query<{ sections: any[] }, number>({
      query: (lessonId) => `/api/content/lessons/${lessonId}/sections`,
      providesTags: ["User"],
    }),
    getNodesBySection: builder.query<{ nodes: any[] }, number>({
      query: (sectionId) => `/api/content/sections/${sectionId}/nodes`,
      providesTags: ["User"],
    }),
    getScopeLineage: builder.query<
      {
        gradeId?: number;
        topicId?: number;
        lessonId?: number;
        sectionId?: number;
        nodeId?: number;
      },
      { scopeType: string; scopeId: number }
    >({
      query: ({ scopeType, scopeId }) =>
        `/api/content/scope-lineage?scopeType=${scopeType}&scopeId=${scopeId}`,
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetGradeStructureQuery,
  useGetGradesQuery,
  useGetTopicsByGradeQuery,
  useGetLessonsByTopicQuery,
  useGetSectionsByLessonQuery,
  useGetNodesBySectionQuery,
  useGetScopeLineageQuery,
} = contentApiSlice;