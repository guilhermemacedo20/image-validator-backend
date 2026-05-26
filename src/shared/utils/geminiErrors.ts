// Função para extrair mensagens de erro de respostas da API Gemini e retornar mensagens de erro amigáveis para o usuário, identificando erros comuns como chave de API inválida, limite de uso excedido, requisição inválida, acesso bloqueado e erros internos da API.
export function getGeminiErrorMessage(error: any): string {
  const rawMessage = [
    error?.message,
    error?.statusText,
    error?.errorDetails,
    error?.response?.data,
    error?.response?.data?.error?.message,
    error?.response?.data?.error?.status,
    error?.response?.data?.error?.code,
  ]
    .filter(Boolean)
    .map((item) =>
      typeof item === 'string' ? item : JSON.stringify(item)
    )
    .join(' ')

  const message = rawMessage.toLowerCase()

  if (
    message.includes('api_key_invalid') ||
    message.includes('api key not valid') ||
    message.includes('invalid api key') ||
    message.includes('api key inválida')
  ) {
    return 'API Key do Gemini inválida. Verifique se a chave informada está correta.'
  }

  if (
    message.includes('api key') &&
    (
      message.includes('missing') ||
      message.includes('not found') ||
      message.includes('encontrada')
    )
  ) {
    return 'API Key não encontrada. Informe uma chave válida para continuar.'
  }

  if (
    message.includes('quota') ||
    message.includes('resource_exhausted') 
  ) {
    return 'Limite de uso da API excedido.'
  }

  if (
    message.includes('429') ||
    message.includes('too many requests')
  ) {
    return 'Muitas requisições para a API.'
  }

  if (
    message.includes('400')
  ) {
    return 'Requisição inválida.'
  }

  if (
    message.includes('403')
  ) {
    return 'Acesso bloqueado a API. Verifique se a API está habilitada.'
  }

  if (
    message.includes('500')
  ) {
    return 'Erro interno na API. Tente novamente mais tarde.'
  }

  return 'Erro ao comunicar com a API.'
}