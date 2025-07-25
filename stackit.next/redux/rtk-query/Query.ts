import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  User,
  Question,
  Answer,
  Vote,
  Notification,
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  CreateQuestionRequest,
  QuestionResponse,
  QuestionDetailsResponse,
  CreateAnswerRequest,
  ReplyRequest,
  AnswerResponse,
  VoteRequest,
  VoteResponse,
  ErrorResponse
} from '../../types/apis'

// Create the API slice
export const stackitApi = createApi({
  reducerPath: 'stackitApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl:  process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      // Get token from localStorage or state
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Question', 'Answer', 'Vote', 'Notification', 'User'],
  endpoints: (build) => ({
    // Authentication endpoints
    register: build.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Questions endpoints
    getQuestions: build.query<Question[], { filter?: string } | void>({
      query: (arg) => {
        let url = '/questions';
        if (arg && arg.filter) {
          url += `?filter=${arg.filter}`;
        }
        return url;
      },
      transformResponse: (response: { questions: Question[] }) => response.questions,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Question' as const, id: _id })),
              { type: 'Question', id: 'LIST' },
            ]
          : [{ type: 'Question', id: 'LIST' }],
    }),

    getQuestion: build.query<QuestionDetailsResponse, string>({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Question', id },
        ...(result?.answers?.map(answer => ({ type: 'Answer' as const, id: answer._id })) || [])
      ],
    }),

    createQuestion: build.mutation<QuestionResponse, CreateQuestionRequest>({
      query: (question) => ({
        url: '/questions',
        method: 'POST',
        body: question,
      }),
      invalidatesTags: [{ type: 'Question', id: 'LIST' }],
    }),

    // Answers endpoints
    createAnswer: build.mutation<AnswerResponse, CreateAnswerRequest>({
      query: (answer) => ({
        url: '/answers',
        method: 'POST',
        body: answer,
      }),
      invalidatesTags: (result, error, { questionId }) => [
        { type: 'Question', id: questionId },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    replyToAnswer: build.mutation<AnswerResponse, ReplyRequest>({
      query: (reply) => ({
        url: '/answers/reply',
        method: 'POST',
        body: reply,
      }),
      invalidatesTags: (result, error, { answerId }) => [
        { type: 'Answer', id: answerId },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    // Votes endpoints
    vote: build.mutation<VoteResponse, VoteRequest>({
      query: (vote) => ({
        url: '/votes',
        method: 'POST',
        body: vote,
      }),
      invalidatesTags: (result, error, { targetType, targetId }) => [
        { type: targetType === 'question' ? 'Question' : 'Answer', id: targetId },
        { type: 'Vote', id: `${targetType}-${targetId}` },
      ],
    }),

    // Notifications endpoints
    getNotifications: build.query<Notification[], void>({
      query: () => '/notifications',
      transformResponse: (response: { notifications: Notification[] }) => response.notifications,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Notification' as const, id: _id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    markNotificationAsRead: build.mutation<{ success: boolean }, string>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    // User profile endpoints
    getUserProfile: build.query<User, string>({
      query: (username) => `/users/${username}`,
      providesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),

    updateUserProfile: build.mutation<User, Partial<User>>({
      query: (updates) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { username }) => [
        { type: 'User', id: username },
      ],
    }),
  }),
})

// Export hooks for usage in functional components
export const {
  // Auth hooks
  useRegisterMutation,
  useLoginMutation,
  
  // Question hooks
  useGetQuestionsQuery,
  useGetQuestionQuery,
  useCreateQuestionMutation,
  
  // Answer hooks
  useCreateAnswerMutation,
  useReplyToAnswerMutation,
  
  // Vote hooks
  useVoteMutation,
  
  // Notification hooks
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  
  // User hooks
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = stackitApi

// Export the API slice for store configuration
export default stackitApi