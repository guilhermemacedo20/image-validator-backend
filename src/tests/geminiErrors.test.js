import { getGeminiErrorMessage } from '../../dist/infrastructure/ai/geminiErrors.js'

describe('getGeminiErrorMessage', () => {
  it('maps invalid API key errors', () => {
    expect(
      getGeminiErrorMessage({ message: 'API_KEY_INVALID: invalid api key' })
    ).toMatch(/inválida/i)
  })

  it('maps quota errors', () => {
    expect(
      getGeminiErrorMessage({ message: 'RESOURCE_EXHAUSTED quota exceeded' })
    ).toMatch(/limite/i)
  })

  it('maps rate limit errors', () => {
    expect(
      getGeminiErrorMessage({ message: '429 too many requests' })
    ).toMatch(/muitas requisições/i)
  })

  it('returns a generic message for unknown errors', () => {
    expect(getGeminiErrorMessage({ message: 'something weird' })).toMatch(
      /comunicar com a API/i
    )
  })
})
