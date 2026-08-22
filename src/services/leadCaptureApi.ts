import { baseApi } from './baseApi'

export interface LeadCaptureInput {
  name: string
  phone: string
  message?: string
}

export const leadCaptureApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    submitLead: build.mutation<{ received: boolean }, LeadCaptureInput>({
      query: (body) => ({
        url: '/lead-capture',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => (res?.data ?? res) as { received: boolean },
    }),
  }),
})

export const { useSubmitLeadMutation } = leadCaptureApi
