import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils'
import { z } from 'zod'

const modalWebEndpointErrorSchema = z.object({
  detail: z.string().optional(),
})

export const modalWebEndpointFailedResponseHandler =
  createJsonErrorResponseHandler({
    errorSchema: modalWebEndpointErrorSchema,
    errorToMessage: (error) =>
      error.detail || 'Unknown error from Modal endpoint',
  })
