import type { ImageMetadataSummary } from '../../../domain/types/ai.types.js'

export const IMAGE_ANALYSIS_PROMPT_VERSION = '2.1.0'

function describeMetadata(metadata: ImageMetadataSummary): string {
  const lines: string[] = [`- Formato do arquivo: ${metadata.format}`]

  if (metadata.width && metadata.height) {
    lines.push(`- Dimensões: ${metadata.width} x ${metadata.height} px`)
  }
  if (metadata.cameraMake || metadata.cameraModel) {
    lines.push(
      `- Câmera informada no EXIF: ${[metadata.cameraMake, metadata.cameraModel].filter(Boolean).join(' ')}`
    )
  }
  if (metadata.captureDate)
    lines.push(`- Data de captura no EXIF: ${metadata.captureDate}`)
  if (metadata.software)
    lines.push(`- Software registrado: ${metadata.software}`)
  if (metadata.hasContentCredentials) {
    lines.push('- O arquivo contém Content Credentials (C2PA).')
  }
  if (metadata.aiGeneratorHint) {
    lines.push(
      `- ALERTA: os metadados indicam geração por IA → ${metadata.aiGeneratorHint}`
    )
  }
  if (metadata.editingSoftwareHint) {
    lines.push(
      `- Os metadados indicam uso de editor de imagens → ${metadata.editingSoftwareHint}`
    )
  }
  if (
    !metadata.hasExif &&
    !metadata.software &&
    !metadata.aiGeneratorHint &&
    !metadata.hasContentCredentials
  ) {
    lines.push(
      '- Nenhum metadado relevante. Isso é comum em prints e em imagens que passaram por redes sociais ou apps de mensagem. NÃO é evidência de IA nem de foto real: a conclusão depende só da análise visual.'
    )
  }

  return lines.join('\n')
}

export function buildImageAnalysisPrompt(
  metadata: ImageMetadataSummary
): string {
  return `Você é um perito em forense digital especializado em identificar imagens geradas ou manipuladas por inteligência artificial.

## Tarefa
Analise a imagem anexada e estime três pontuações de 0 a 100:
- scoreIa: probabilidade de a imagem ter sido GERADA por IA (Midjourney, DALL·E, Stable Diffusion, Gemini/Imagen, Firefly, FLUX etc.).
- scoreReal: probabilidade de ser um registro real do mundo (foto de câmera ou celular, digitalização). Se a imagem for um print de tela ou uma foto de outra tela, avalie a imagem mostrada dentro dela: ser um print NÃO torna o conteúdo real. scoreIa + scoreReal deve somar 100.
- scoreEdicao: probabilidade de uma imagem real ter sido EDITADA ou MONTADA por uma pessoa (recorte e colagem, clonagem, retoque pesado, troca de rosto, texto inserido). É independente das outras duas.

## Método (siga nesta ordem)
1. Identifique o tipo de conteúdo: foto, retrato, paisagem, print de tela, ilustração ou arte digital, documento, meme.
2. Examine cada critério abaixo e registre apenas o que você REALMENTE vê, dizendo em que parte da imagem aparece:
   - ANATOMIA: mãos, dedos, dentes, orelhas, olhos (reflexos diferentes em cada pupila), cabelo se fundindo ao fundo, membros a mais.
   - ILUMINACAO: sombras em direções diferentes, reflexos que não batem com a fonte de luz, brilho de estúdio impossível no cenário.
   - TEXTURA: pele lisa como plástico, ausência de poros, superfícies cerosas, ruído de sensor ausente ou uniforme demais.
   - ARTEFATOS: borrões localizados, objetos derretendo ou fundidos, bordas incoerentes, halos.
   - PADROES: repetições perfeitas (tijolos, folhas, multidões com rostos parecidos), simetria artificial.
   - TEXTO: letras deformadas, placas e rótulos ilegíveis ou sem sentido.
   - GEOMETRIA: perspectiva quebrada, linhas retas que entortam, escala impossível entre objetos.
   - EDICAO: bordas de recorte, diferenças de nitidez ou compressão entre regiões, objetos inseridos sem sombra, áreas clonadas.
3. Procure também sinais de AUTENTICIDADE (direction = REAL): ruído natural de sensor, aberração cromática, desfoque de movimento coerente, imperfeições comuns do mundo real, textos legíveis e coerentes.
4. Lembre que geradores atuais (ChatGPT/GPT-Image, Gemini/Imagen, Midjourney, FLUX) criam imagens fotorrealistas que quase não erram mãos, texto ou sombras. Não encontrar erros grosseiros NÃO prova que a foto é real. Procure sinais sutis: iluminação perfeita e uniforme demais, pele e superfícies lisas demais, fundo genérico ou desfocado de forma artificial, composição de banco de imagens, ausência de ruído de sensor, pequenos detalhes sem sentido.
5. Calibre as pontuações:
   - Use valores extremos (até 15 ou a partir de 85) somente com evidências claras e múltiplas.
   - Alta qualidade, fundo desfocado (bokeh) ou estética bonita NÃO são, sozinhos, sinais de IA.
   - Compressão forte, baixa resolução ou print de tela reduzem a certeza: prefira pontuações mais próximas de 50 e confiança BAIXA.
   - Só use scoreIa abaixo de 35 quando houver sinais POSITIVOS de registro real (ruído de sensor, imperfeições naturais, contexto coerente). A simples ausência de sinais de IA não basta.
   - Ilustrações e artes digitais feitas por pessoas não devem ser marcadas como IA sem artefatos típicos de geração.
   - Não invente evidências. Se nada for conclusivo, diga isso no resumo.

## Metadados extraídos do arquivo
(podem ter sido removidos ou falsificados; use como evidência complementar)
${describeMetadata(metadata)}

## Formato da resposta
Responda SOMENTE com JSON válido, em português do Brasil:
- summary: 1 ou 2 frases simples, para um público leigo, explicando a conclusão.
- confidence: BAIXA, MEDIA ou ALTA.
- indicators: de 2 a 6 itens, do mais forte para o mais fraco. Cada item tem category, direction (IA, REAL ou EDICAO), weight (BAIXO, MEDIO ou ALTO) e description (uma frase curta e concreta dizendo o que foi visto e onde).`
}
