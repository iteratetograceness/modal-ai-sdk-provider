import type { ImageModelV1, ImageModelV1CallWarning } from '@ai-sdk/provider'
import type { Resolvable } from '@ai-sdk/provider-utils'
import {
  FetchFunction,
  combineHeaders,
  createJsonResponseHandler,
  postJsonToApi,
  resolve,
} from '@ai-sdk/provider-utils'
import { z } from 'zod'
import { modalWebEndpointFailedResponseHandler } from './error'
import {
  ModalWebEndpointImageModelId,
  ModalWebEndpointImageSettings,
} from './image-settings'

interface ModalWebEndpointImageModelConfig {
  provider: string
  baseURL: string
  headers?: Resolvable<Record<string, string | undefined>>
  fetch?: FetchFunction
  _internal?: {
    currentDate?: () => Date
  }
}

export class ModalWebEndpointImageModel implements ImageModelV1 {
  readonly specificationVersion = 'v1'

  get provider(): string {
    return this.config.provider
  }

  get maxImagesPerCall(): number {
    return this.settings.maxImagesPerCall || 1
  }

  constructor(
    readonly modelId: ModalWebEndpointImageModelId,
    private readonly settings: ModalWebEndpointImageSettings,
    private readonly config: ModalWebEndpointImageModelConfig
  ) {}

  async doGenerate({
    prompt,
    n,
    seed,
    providerOptions,
    headers,
    abortSignal,
  }: Parameters<ImageModelV1['doGenerate']>[0]): Promise<
    Awaited<ReturnType<ImageModelV1['doGenerate']>>
  > {
    const warnings: Array<ImageModelV1CallWarning> = []

    const [_, modelId] = this.modelId.split('/')

    const currentDate = this.config._internal?.currentDate?.() ?? new Date()
    const {
      value: { images },
      responseHeaders,
    } = await postJsonToApi({
      url: `${this.config.baseURL}/v1/pixel`,

      headers: combineHeaders(await resolve(this.config.headers), headers, {
        prefer: 'wait',
      }),

      body: {
        input: {
          prompt,
          seed,
          num_outputs: n,
          style: modelId,
          ...(providerOptions.modalWebEndpoint ?? {}),
        },
      },

      successfulResponseHandler: createJsonResponseHandler(
        modalWebEndpointImageResponseSchema
      ),
      failedResponseHandler: modalWebEndpointFailedResponseHandler,
      abortSignal,
      fetch: this.config.fetch,
    })

    return {
      images,
      warnings,
      response: {
        timestamp: currentDate,
        modelId: this.modelId,
        headers: responseHeaders,
      },
    }
  }
}

const modalWebEndpointImageResponseSchema = z.object({
  images: z.array(z.string()),
})
