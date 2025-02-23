import { NoSuchModelError, ProviderV1 } from '@ai-sdk/provider'
import type { FetchFunction } from '@ai-sdk/provider-utils'
import { loadApiKey } from '@ai-sdk/provider-utils'
import { ModalWebEndpointImageModel } from './image-model'
import {
  ModalWebEndpointImageModelId,
  ModalWebEndpointImageSettings,
} from './image-settings'

export interface ModalWebEndpointProviderSettings {
  /**
API token that is being send using the `Authorization` header.
It defaults to the `MODAL_AUTH_TOKEN` environment variable.
   */
  apiToken?: string

  /**
Use a different URL prefix for API calls, e.g. to use proxy servers.
   */
  baseURL?: string

  /**
Custom headers to include in the requests.
     */
  headers?: Record<string, string>

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: FetchFunction
}

export interface ModalWebEndpointProvider extends ProviderV1 {
  /**
   * Creates a ModalWebEndpoint image generation model.
   */
  image(
    modelId: ModalWebEndpointImageModelId,
    settings?: ModalWebEndpointImageSettings
  ): ModalWebEndpointImageModel

  /**
   * Creates a ModalWebEndpoint image generation model.
   */
  imageModel(
    modelId: ModalWebEndpointImageModelId,
    settings?: ModalWebEndpointImageSettings
  ): ModalWebEndpointImageModel
}

/**
 * Create a Replicate provider instance.
 */
export function createModalWebEndpoint(
  options: ModalWebEndpointProviderSettings = {}
): ModalWebEndpointProvider {
  const createImageModel = (
    modelId: ModalWebEndpointImageModelId,
    settings?: ModalWebEndpointImageSettings
  ) => {
    if (!options.baseURL) {
      throw new Error('Base URL is required')
    }

    return new ModalWebEndpointImageModel(modelId, settings ?? {}, {
      provider: 'modal',
      baseURL: options.baseURL,
      headers: {
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiToken,
          environmentVariableName: 'MODAL_AUTH_TOKEN',
          description: 'Modal Auth Token',
        })}`,
        ...options.headers,
      },
      fetch: options.fetch,
    })
  }

  return {
    image: createImageModel,
    imageModel: createImageModel,
    languageModel: () => {
      throw new NoSuchModelError({
        modelId: 'languageModel',
        modelType: 'languageModel',
      })
    },
    textEmbeddingModel: () => {
      throw new NoSuchModelError({
        modelId: 'textEmbeddingModel',
        modelType: 'textEmbeddingModel',
      })
    },
  }
}

/**
 * Default Modal Web Endpoint provider instance.
 */
export const modalWebEndpoint = createModalWebEndpoint()
