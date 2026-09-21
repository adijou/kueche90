import type { Config } from '@netlify/functions';
import { getUser } from '@netlify/identity';
import { GoogleGenAI } from '@google/genai';
import { buildPrompt, handleGeneration, IMAGE_MODEL } from '../lib/generation';
import { settings } from '../lib/environment';

export default async (request: Request) => {
  const env = settings();
  return handleGeneration(request, {
    ...env,
    getUser,
    render: async (input) => {
      const ai = new GoogleGenAI({
        apiKey: env.apiKey,
        httpOptions: { baseUrl: env.baseUrl, timeout: 50_000, retryOptions: { attempts: 1 } },
      });
      const [header, data] = input.photo.split(',');
      const result = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildPrompt(input) },
              { inlineData: { mimeType: header.slice(5, -7), data } },
            ],
          },
        ],
        config: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { imageSize: '1K' } },
      });
      const part = result.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data && !p.thought,
      );
      if (
        !part?.inlineData?.data ||
        !['image/png', 'image/jpeg', 'image/webp'].includes(part.inlineData.mimeType || '')
      )
        return '';
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    },
  });
};
export const config: Config = {
  path: '/api/generate',
  rateLimit: { action: 'rate_limit', aggregateBy: 'ip', windowSize: 60, windowLimit: 6 },
};
