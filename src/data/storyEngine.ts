// Motor de geração de sugestões criativas DIRETAMENTE baseadas na SINOPSE

import { SynopsisAnalysis } from '@/types/story';

export type { SynopsisAnalysis };

export interface StoryContext {
  title: string;
  genre: string;
  synopsis: string;
  beginning: string;
  middle: string;
  end: string;
  previousEvents: { position: number; content: string }[];
  currentPosition: number;
}

// Analisa a sinopse e extrai elementos narrativos de forma mais profunda
export function analyzeSynopsis(synopsis: string): SynopsisAnalysis {
  const lowerSynopsis = synopsis.toLowerCase();
  
  // Extrai todos os nomes próprios (palavras que começam com maiúscula)
  const allNames: string[] = [];
  const namePattern = /\b([A-Z][a-záàâãéêíóôõúçA-Z]+(?:\s+(?:de|da|do|dos|das)\s+)?(?:[A-Z][a-záàâãéêíóôõúçA-Z]+)?)\b/g;
  let nameMatch;
  const excludeWords = ['Um', 'Uma', 'O', 'A', 'Os', 'As', 'No', 'Na', 'Nos', 'Nas', 'Em', 'De', 'Para', 'Com', 'Por', 'Quando', 'Depois', 'Antes', 'Durante', 'Ela', 'Ele', 'Seu', 'Sua', 'Seus', 'Suas', 'Este', 'Esta', 'Esse', 'Essa', 'Aquele', 'Aquela', 'Mas', 'Porém', 'Contudo', 'Enquanto', 'Até', 'Sobre', 'Sob', 'Entre', 'Contra', 'Após', 'Segundo'];
  
  while ((nameMatch = namePattern.exec(synopsis)) !== null) {
    const name = nameMatch[1].trim();
    if (!excludeWords.includes(name) && name.length > 2 && !allNames.includes(name)) {
      allNames.push(name);
    }
  }

  // Extrai protagonista
  let protagonist = '';
  const protagonistPatterns = [
    /^([A-Z][a-záàâãéêíóôõúç]+(?:\s+[A-Z][a-záàâãéêíóôõúç]+)?)/,
    /história\s+(?:de|sobre)\s+([A-Z][a-záàâãéêíóôõúç]+(?:\s+[A-Z][a-záàâãéêíóôõúç]+)?)/i,
    /([A-Z][a-záàâãéêíóôõúç]+)\s+(?:é\s+um|é\s+uma|deve|precisa|descobre|encontra|busca|luta|enfrenta)/,
    /protagonista[:\s]+([^,.]+)/i,
    /jovem\s+([A-Z][a-záàâãéêíóôõúç]+)/i,
  ];
  
  for (const pattern of protagonistPatterns) {
    const match = synopsis.match(pattern);
    if (match && match[1] && !excludeWords.includes(match[1].trim())) {
      protagonist = match[1].trim();
      break;
    }
  }
  if (!protagonist && allNames.length > 0) {
    protagonist = allNames[0];
  }

  // Extrai antagonista
  let antagonist = '';
  const antagonistPatterns = [
    /(?:vilão|antagonista|inimigo|adversário)[:\s]+([^,.]+)/i,
    /(?:rei|rainha|senhor|lorde|doutor|dr\.|mestre)\s+([A-Z][a-záàâãéêíóôõúç]+)/i,
    /(?:contra|enfrentar|derrotar|combater|vencer)\s+(?:o|a|os|as)?\s*([A-Z][a-záàâãéêíóôõúç]+(?:\s+[A-Z][a-záàâãéêíóôõúç]+)?)/i,
    /(?:tirano|ditador|imperador|feiticeiro|bruxa|demônio|dragão|monstro|criatura)\s+([A-Z][a-záàâãéêíóôõúç]+)/i,
    /([A-Z][a-záàâãéêíóôõúç]+)\s+(?:quer\s+destruir|ameaça|persegue|caça)/i,
  ];
  
  for (const pattern of antagonistPatterns) {
    const match = synopsis.match(pattern);
    if (match && match[1]) {
      const potential = match[1].trim();
      if (!excludeWords.includes(potential) && potential !== protagonist) {
        antagonist = potential;
        break;
      }
    }
  }

  // Extrai cenário/local - mais específico
  let setting = '';
  const settingPatterns = [
    /(?:em|no|na|num|numa)\s+((?:um|uma)\s+)?([^,.]{3,40}(?:reino|mundo|cidade|vila|floresta|castelo|nave|planeta|dimensão|terra|país|era|época|ilha|montanha|deserto|oceano|caverna|templo|torre|aldeia|metrópole|galáxia|universo|dimensão|realidade))/i,
    /(?:mundo|reino|terra|lugar)\s+(?:de|onde|chamado|conhecido)\s+([^,.]+)/i,
    /ambientad[oa]\s+(?:em|no|na)\s+([^,.]+)/i,
    /(?:vive|mora|habita)\s+(?:em|no|na)\s+([^,.]+)/i,
    /(?:na|no)\s+([A-Z][a-záàâãéêíóôõúç]+(?:\s+(?:de|da|do|dos|das)\s+)?(?:[A-Z][a-záàâãéêíóôõúç]+)?)/,
  ];
  
  for (const pattern of settingPatterns) {
    const match = synopsis.match(pattern);
    if (match) {
      setting = (match[2] || match[1] || '').trim();
      if (setting.length > 3) break;
    }
  }

  // Extrai conflito principal - mais detalhado
  let mainConflict = '';
  const conflictPatterns = [
    /(?:precisa|deve|tem que)\s+([^,.]+)/i,
    /(?:missão|objetivo|jornada|busca)\s+(?:é|de|para)\s+([^,.]+)/i,
    /(?:para|afim de)\s+(salvar|resgatar|proteger|destruir|encontrar|descobrir|derrotar|impedir|libertar|recuperar)\s+([^,.]+)/i,
    /(?:luta|batalha|conflito)\s+(?:para|contra|por)\s+([^,.]+)/i,
    /(?:antes que|senão)\s+([^,.]+)/i,
  ];
  
  for (const pattern of conflictPatterns) {
    const match = synopsis.match(pattern);
    if (match) {
      mainConflict = (match[2] ? match[1] + ' ' + match[2] : match[1]).trim();
      if (mainConflict.length > 5) break;
    }
  }

  // Detecta temas com mais precisão
  const themes: string[] = [];
  const themeKeywords: Record<string, string[]> = {
    'redenção': ['redenção', 'redimir', 'perdão', 'segunda chance', 'recomeçar', 'expiar'],
    'vingança': ['vingança', 'vingar', 'retaliação', 'pagar pelo', 'punir', 'justiça pelas próprias mãos'],
    'amor': ['amor', 'paixão', 'romance', 'coração', 'amante', 'apaixon', 'amar'],
    'amizade': ['amizade', 'amigo', 'companheiro', 'lealdade', 'parceiro', 'aliado'],
    'família': ['família', 'pai', 'mãe', 'irmão', 'irmã', 'filho', 'filha', 'herança', 'linhagem', 'ancestral'],
    'poder': ['poder', 'trono', 'governar', 'dominar', 'controle', 'reinar', 'conquistar'],
    'liberdade': ['liberdade', 'escapar', 'fugir', 'livre', 'libertação', 'prisão', 'cativeiro'],
    'identidade': ['identidade', 'quem sou', 'descobrir-se', 'verdadeiro eu', 'passado oculto', 'origem'],
    'sacrifício': ['sacrifício', 'sacrificar', 'dar tudo', 'entregar', 'abrir mão', 'renunciar'],
    'sobrevivência': ['sobreviver', 'sobrevivência', 'viver', 'morte', 'apocalipse', 'extinção'],
    'justiça': ['justiça', 'justo', 'culpado', 'inocente', 'crime', 'tribunal', 'lei'],
    'destino': ['destino', 'profecia', 'escolhido', 'fadado', 'predestinado', 'oráculo'],
    'traição': ['traição', 'trair', 'traidor', 'confiança quebrada', 'enganar', 'mentira'],
    'esperança': ['esperança', 'esperar', 'acreditar', 'fé', 'último'],
    'guerra': ['guerra', 'batalha', 'exército', 'soldado', 'invasão', 'conflito armado'],
    'magia': ['magia', 'mágico', 'feitiço', 'encantamento', 'poderes', 'sobrenatural'],
    'segredo': ['segredo', 'oculto', 'escondido', 'mistério', 'revelação', 'verdade'],
    'perda': ['perda', 'perder', 'morte', 'luto', 'saudade', 'ausência'],
  };
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(k => lowerSynopsis.includes(k))) {
      themes.push(theme);
    }
  }

  // Extrai objetivos específicos
  const objectives: string[] = [];
  const objectivePatterns = [
    /(?:para|afim de|com objetivo de)\s+([^,.]+)/gi,
    /(?:busca|procura|quer|deseja|almeja|sonha em)\s+([^,.]+)/gi,
    /(?:missão de|tarefa de)\s+([^,.]+)/gi,
  ];
  
  for (const pattern of objectivePatterns) {
    let objMatch;
    while ((objMatch = pattern.exec(synopsis)) !== null) {
      if (objMatch[1] && objMatch[1].length > 5) {
        objectives.push(objMatch[1].trim());
      }
    }
  }

  // Detecta tom da história
  let tone = 'aventura';
  if (/sombri|escur|terror|medo|horror|morte|sangue|macabr|sinistro/i.test(synopsis)) tone = 'sombrio';
  else if (/amor|romance|paixão|coração|apaixon/i.test(synopsis)) tone = 'romântico';
  else if (/engraçad|cômico|hilári|diversão|absurd/i.test(synopsis)) tone = 'cômico';
  else if (/épic|grand|legend|heró|destino|profecia/i.test(synopsis)) tone = 'épico';
  else if (/mistério|segredo|investig|pista|detetive/i.test(synopsis)) tone = 'misterioso';
  else if (/filosóf|existenc|profund|sentido|reflex/i.test(synopsis)) tone = 'filosófico';
  else if (/ação|luta|combate|perseguição|explosão/i.test(synopsis)) tone = 'ação';

  // Remove protagonista da lista de personagens
  const characters = allNames.filter(n => n !== protagonist);

  return {
    protagonist,
    antagonist,
    setting,
    mainConflict,
    themes,
    characters,
    objectives,
    tone,
  };
}

// ========== BANCOS DE TEMPLATES POR FASE ==========

const OPENING_TEMPLATES = [
  (p: string, s: string) => `${p} acorda em ${s}, sentindo que algo mudou no ar`,
  (p: string, s: string) => `A rotina de ${p} em ${s} é interrompida por um evento inesperado`,
  (p: string, s: string) => `${p} começa mais um dia comum em ${s}, sem saber que tudo está prestes a mudar`,
  (p: string, s: string) => `Uma visão perturbadora assombra ${p} durante a noite, mostrando ${s} em chamas`,
  (p: string, s: string) => `${p} encontra algo estranho que não pertence a ${s}`,
  (p: string, s: string) => `O primeiro sinal de que algo está errado: ${p} percebe mudanças sutis em ${s}`,
  (p: string, s: string) => `Uma figura misteriosa observa ${p} de longe nas ruas de ${s}`,
  (p: string, s: string) => `${p} descobre um objeto antigo escondido em ${s}`,
  (p: string, s: string) => `Rumores estranhos começam a circular em ${s}, chegando aos ouvidos de ${p}`,
  (p: string, s: string) => `${p} recebe uma mensagem enigmática que menciona ${s}`,
  (p: string, a: string) => `Boatos sobre ${a} começam a se espalhar, causando inquietação`,
  (p: string, a: string) => `${p} ouve falar de ${a} pela primeira vez e sente um calafrio`,
  (p: string, c: string) => `${p} tem um pressentimento sobre ${c}`,
  (p: string) => `${p} encontra um objeto que pertencia a alguém de seu passado`,
  (p: string) => `A vida de ${p} está prestes a tomar um rumo inesperado`,
];

const CALL_ADVENTURE_TEMPLATES = [
  (p: string, s: string) => `Um evento catastrófico força ${p} a deixar ${s} e iniciar sua jornada`,
  (p: string, s: string, c: string) => `${p} descobre que o destino de ${s} depende de ${c}`,
  (p: string, a: string) => `${p} descobre que ${a} está mais próximo do que imaginava`,
  (p: string, c: string) => `Uma escolha impossível: ${p} deve decidir se aceita ${c}`,
  (p: string, a: string) => `O passado de ${p} volta para assombrá-lo, revelando conexões com ${a}`,
  (p: string, c: string) => `${p} aceita a missão de ${c}, mesmo sem saber o custo`,
  (p: string, a: string) => `Uma perda pessoal impulsiona ${p} a agir contra ${a}`,
  (p: string, s: string) => `Sinais antigos em ${s} revelam que ${p} foi escolhido para algo maior`,
  (p: string, char: string) => `${char} aparece com informações cruciais que mudam tudo`,
  (p: string, char: string, c: string) => `${char} propõe uma aliança a ${p} para ${c}`,
  (p: string) => `${p} tem um sonho profético que revela seu verdadeiro destino`,
  (p: string, s: string) => `Uma carta misteriosa chega a ${p}, pedindo ajuda urgente em ${s}`,
  (p: string, a: string) => `${p} jura vingança contra ${a} após uma grande perda`,
  (p: string) => `${p} descobre que possui um dom oculto essencial para a jornada`,
  (p: string, s: string) => `O chamado ecoa em ${s}, e ${p} não pode mais ignorá-lo`,
];

const CROSSING_THRESHOLD_TEMPLATES = [
  (p: string, s: string) => `${p} cruza a fronteira de ${s}, entrando em território desconhecido`,
  (p: string, a: string) => `O primeiro confronto com as forças de ${a} mostra a magnitude do desafio`,
  (p: string, char: string) => `${p} encontra ${char}, que compartilha o mesmo objetivo`,
  (p: string, c: string) => `Uma revelação sobre ${c} muda completamente os planos de ${p}`,
  (p: string, c: string) => `${p} descobre que possui uma habilidade oculta, essencial para ${c}`,
  (p: string, c: string) => `O verdadeiro preço de ${c} começa a se tornar claro para ${p}`,
  (p: string, a: string) => `${a} toma conhecimento de ${p} e começa a agir contra ele`,
  (p: string) => `${p} recebe treinamento crucial de um mentor improvável`,
  (p: string, s: string) => `${p} adentra as profundezas de ${s}, onde poucos retornaram`,
  (p: string) => `${p} quebra uma regra fundamental e não há mais volta`,
  (p: string, char: string) => `${char} oferece ajuda, mas com condições que ${p} não esperava`,
  (p: string, s: string) => `A verdadeira natureza de ${s} começa a se revelar para ${p}`,
  (p: string) => `${p} faz um juramento que mudará tudo`,
  (p: string, a: string) => `${p} envia uma mensagem desafiadora para ${a}`,
  (p: string) => `${p} transforma-se, deixando para trás quem costumava ser`,
];

const TESTS_ALLIES_TEMPLATES = [
  (p: string, c: string) => `${p} é testado duramente e quase falha, questionando se conseguirá ${c}`,
  (p: string, char: string) => `Uma aliança inesperada com ${char} fortalece a jornada`,
  (p: string, a: string) => `${a} envia seus melhores agentes para interceptar ${p}`,
  (p: string, s: string) => `${p} descobre um segredo terrível sobre ${s} que muda tudo`,
  (p: string) => `A confiança entre ${p} e seus aliados é testada por uma traição aparente`,
  (p: string, c: string) => `${p} encontra uma pista crucial que o aproxima de ${c}`,
  (p: string, a: string) => `Uma emboscada de ${a} resulta em perdas significativas`,
  (p: string) => `${p} deve fazer uma escolha moral difícil que define seu caráter`,
  (p: string, char: string) => `${char} revela um segredo doloroso sobre o passado`,
  (p: string, s: string) => `${p} descobre uma facção oculta operando em ${s}`,
  (p: string) => `${p} aprende uma habilidade crucial através de sacrifício`,
  (p: string, a: string) => `${p} captura um mensageiro de ${a} e obtém informações vitais`,
  (p: string, char: string) => `Tensão surge entre ${p} e ${char}, ameaçando a aliança`,
  (p: string) => `${p} enfrenta seus próprios demônios internos`,
  (p: string, s: string) => `Uma antiga profecia sobre ${s} começa a fazer sentido para ${p}`,
];

const APPROACH_CAVE_TEMPLATES = [
  (p: string, a: string) => `${p} finalmente confronta ${a}, mas a batalha não sai como esperado`,
  (p: string, a: string) => `Uma revelação chocante: ${a} e ${p} estão conectados de forma inesperada`,
  (p: string) => `${p} perde tudo que conquistou e deve recomeçar do zero`,
  (p: string, a: string) => `O verdadeiro plano de ${a} é revelado, e é pior do que se imaginava`,
  (p: string, c: string) => `${p} deve sacrificar algo precioso para ter chance de ${c}`,
  (p: string, a: string) => `A maior fraqueza de ${p} é explorada por ${a} sem piedade`,
  (p: string, char: string) => `${char} trai ${p} no pior momento possível`,
  (p: string) => `${p} descobre que a única forma de vencer é tornar-se aquilo que sempre temeu`,
  (p: string, a: string) => `${p} infiltra-se no território de ${a}, arriscando tudo`,
  (p: string, s: string) => `O destino de ${s} pende por um fio nas mãos de ${p}`,
  (p: string) => `${p} enfrenta uma ilusão cruel de seu maior desejo`,
  (p: string, char: string) => `${char} sacrifica-se para dar a ${p} uma última chance`,
  (p: string, a: string) => `${a} oferece a ${p} uma proposta tentadora que poderia mudar tudo`,
  (p: string) => `${p} percebe que foi enganado desde o início`,
  (p: string, c: string) => `A verdadeira natureza de ${c} é finalmente revelada`,
];

const ORDEAL_TEMPLATES = [
  (p: string) => `${p} ressurge das cinzas, transformado pela provação`,
  (p: string, c: string) => `Uma nova abordagem para ${c} surge após a derrota`,
  (p: string, a: string) => `${a} comete um erro fatal, subestimando a determinação de ${p}`,
  (p: string) => `${p} encontra aliados onde menos esperava, reunindo forças`,
  (p: string, c: string) => `A verdadeira natureza de ${c} é revelada - nada é como parecia`,
  (p: string) => `${p} faz as pazes com seu passado, encontrando força interior`,
  (p: string) => `A jornada interior de ${p} atinge seu ponto crucial`,
  (p: string, a: string) => `${p} desenvolve um plano ousado para derrotar ${a} de vez`,
  (p: string) => `${p} descobre um poder latente que sempre esteve dentro dele`,
  (p: string, char: string) => `${char} retorna de forma inesperada para ajudar ${p}`,
  (p: string, s: string) => `Os habitantes de ${s} unem-se em apoio a ${p}`,
  (p: string) => `${p} recebe uma visão que mostra o caminho para a vitória`,
  (p: string, a: string) => `${p} compreende finalmente as motivações de ${a}`,
  (p: string) => `${p} perdoa-se por seus erros passados e avança renovado`,
  (p: string) => `Uma arma inesperada cai nas mãos de ${p}`,
];

const ROAD_BACK_TEMPLATES = [
  (p: string, a: string, s: string) => `O confronto final entre ${p} e ${a} começa em ${s}`,
  (p: string, a: string) => `${p} usa tudo que aprendeu na jornada para enfrentar ${a}`,
  (p: string, a: string) => `Uma reviravolta final: ${a} tinha razões mais complexas do que parecia`,
  (p: string, s: string, c: string) => `${p} deve escolher entre vitória pessoal e o bem maior de ${s}`,
  (p: string, char: string) => `O sacrifício de ${char} dá a ${p} a chance necessária`,
  (p: string, a: string) => `${p} enfrenta sua versão mais sombria antes de poder vencer ${a}`,
  (p: string, s: string) => `A batalha final transforma ${s} para sempre`,
  (p: string, c: string) => `${p} percebe que ${c} era apenas parte de algo muito maior`,
  (p: string, a: string) => `${p} e ${a} travam um duelo que abala os fundamentos da realidade`,
  (p: string) => `${p} faz a escolha final que define quem ele realmente é`,
  (p: string, s: string) => `O futuro de ${s} é decidido pelas ações de ${p}`,
  (p: string, a: string) => `${p} oferece redenção a ${a}, mas será aceita?`,
  (p: string) => `${p} usa o poder que jurou nunca tocar`,
  (p: string, char: string) => `${char} revela ter sido a chave para tudo desde o início`,
  (p: string, a: string) => `${p} e ${a} devem unir forças contra uma ameaça maior`,
];

const RESOLUTION_TEMPLATES = [
  (p: string, c: string) => `${p} finalmente ${c}, mas não da forma que esperava`,
  (p: string, s: string, a: string) => `${s} começa a se reconstruir após a derrota de ${a}`,
  (p: string) => `${p} retorna transformado, carregando as cicatrizes da jornada`,
  (p: string, a: string) => `O legado de ${a} ainda ecoa - uma semente para futuras histórias`,
  (p: string) => `${p} encontra paz, mas sinais sutis indicam que novos desafios virão`,
  (p: string, s: string) => `As consequências da jornada se revelam para ${p} e todos em ${s}`,
  (p: string, a: string) => `${p} deve lidar com quem se tornou após enfrentar ${a}`,
  (p: string) => `Um epílogo mostra ${p} anos depois, e como a jornada o moldou`,
  (p: string, s: string) => `${p} torna-se lenda em ${s}, inspirando gerações futuras`,
  (p: string, c: string) => `A missão de ${c} está completa, mas a que custo?`,
  (p: string) => `${p} passa o bastão para a próxima geração`,
  (p: string, char: string) => `${p} e ${char} partem em direções diferentes, mas para sempre conectados`,
  (p: string, s: string) => `Uma nova era começa em ${s} graças a ${p}`,
  (p: string) => `${p} finalmente compreende o verdadeiro significado de sua jornada`,
  (p: string) => `${p} desaparece nas brumas do tempo, tornando-se mito`,
];

// Função principal para gerar sugestões ESPECÍFICAS baseadas na sinopse
export function generateCreativeSuggestions(
  context: StoryContext,
  seed: number = Date.now()
): string[] {
  // Se não há sinopse, retorna sugestões genéricas pedindo sinopse
  if (!context.synopsis || context.synopsis.trim().length < 10) {
    return [
      "📝 Adicione uma sinopse para receber sugestões personalizadas!",
      "✨ Com uma sinopse, as sugestões usarão os nomes e eventos da SUA história",
      "💡 Descreva seu protagonista, conflito e mundo para sugestões criativas",
    ];
  }

  const analysis = analyzeSynopsis(context.synopsis);
  const allSuggestions: string[] = [];
  
  // Função para randomização baseada em seed
  let currentSeed = seed;
  const seededRandom = (max: number) => {
    const x = Math.sin(currentSeed++) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };
  const random = <T,>(arr: T[]): T => arr[seededRandom(arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = seededRandom(i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  // Elementos da sinopse para usar nas sugestões
  const protag = analysis.protagonist || 'o protagonista';
  const antag = analysis.antagonist || 'o antagonista';
  const setting = analysis.setting || 'este mundo';
  const conflict = analysis.mainConflict || 'completar sua missão';
  const chars = analysis.characters.length > 0 ? analysis.characters : ['um aliado misterioso'];
  const themes = analysis.themes;

  // Determina fase narrativa
  const pos = context.currentPosition;
  
  // ========== GERA SUGESTÕES USANDO TEMPLATES ==========
  
  let templates: any[] = [];
  
  if (pos <= 1.25) {
    // ABERTURA
    templates = OPENING_TEMPLATES;
  } else if (pos < 1.75) {
    // CHAMADO À AVENTURA
    templates = CALL_ADVENTURE_TEMPLATES;
  } else if (pos < 2) {
    // CRUZANDO O LIMIAR
    templates = CROSSING_THRESHOLD_TEMPLATES;
  } else if (pos < 2.35) {
    // TESTES E ALIADOS
    templates = TESTS_ALLIES_TEMPLATES;
  } else if (pos < 2.65) {
    // APROXIMAÇÃO DA CAVERNA / CLÍMAX
    templates = APPROACH_CAVE_TEMPLATES;
  } else if (pos < 2.85) {
    // PROVAÇÃO SUPREMA
    templates = ORDEAL_TEMPLATES;
  } else if (pos < 3) {
    // CAMINHO DE VOLTA
    templates = ROAD_BACK_TEMPLATES;
  } else {
    // RESOLUÇÃO
    templates = RESOLUTION_TEMPLATES;
  }

  // Embaralha templates e gera sugestões
  const shuffledTemplates = shuffle(templates);
  
  for (const template of shuffledTemplates.slice(0, 20)) {
    try {
      // Tenta diferentes combinações de parâmetros
      const variations = [
        template(protag, setting, conflict),
        template(protag, antag, setting),
        template(protag, setting),
        template(protag, antag),
        template(protag, conflict),
        template(protag, random(chars)),
        template(protag),
      ];
      
      // Pega a primeira variação válida
      for (const variation of variations) {
        if (variation && typeof variation === 'string' && !variation.includes('undefined')) {
          allSuggestions.push(variation);
          break;
        }
      }
    } catch (e) {
      // Ignora erros de template
    }
  }

  // ========== ADICIONA SUGESTÕES BASEADAS EM TEMAS ==========
  
  if (themes.includes('redenção')) {
    allSuggestions.push(
      `${protag} tem a oportunidade de corrigir o maior erro de seu passado`,
      `Alguém que ${protag} prejudicou aparece oferecendo uma chance de redenção`,
    );
  }
  if (themes.includes('vingança')) {
    allSuggestions.push(
      `A sede de vingança de ${protag} contra ${antag} ameaça consumi-lo por completo`,
      `${protag} descobre que vingança pode custar mais do que está disposto a pagar`,
    );
  }
  if (themes.includes('amor')) {
    allSuggestions.push(
      `O amor de ${protag} é colocado em risco direto por ${antag}`,
      `${protag} deve escolher entre seu amor e ${conflict}`,
    );
  }
  if (themes.includes('família')) {
    allSuggestions.push(
      `Segredos sobre a família de ${protag} vêm à tona, mudando tudo`,
      `${protag} descobre que ${antag} tem conexões com sua própria linhagem`,
    );
  }
  if (themes.includes('poder')) {
    allSuggestions.push(
      `${protag} é tentado pelo mesmo poder que corrompeu ${antag}`,
      `O verdadeiro custo do poder necessário para ${conflict} se revela`,
    );
  }
  if (themes.includes('traição')) {
    allSuggestions.push(
      `${random(chars)} revela ter trabalhado para ${antag} o tempo todo`,
      `${protag} é forçado a fingir trair seus aliados para se infiltrar`,
    );
  }
  if (themes.includes('sacrifício')) {
    allSuggestions.push(
      `${protag} percebe que ${conflict} exigirá o sacrifício definitivo`,
      `${random(chars)} oferece-se para sacrificar tudo por ${protag}`,
    );
  }
  if (themes.includes('destino')) {
    allSuggestions.push(
      `Uma profecia antiga revela que ${protag} sempre foi destinado a enfrentar ${antag}`,
      `${protag} tenta escapar de seu destino, mas cada ação o leva de volta a ele`,
    );
  }

  // ========== CONECTA COM EVENTOS ANTERIORES ==========
  
  const prevEvents = context.previousEvents
    .filter(e => e.position < pos && e.content && e.content.length > 10)
    .sort((a, b) => b.position - a.position);
  
  if (prevEvents.length > 0) {
    const lastEvent = prevEvents[0].content;
    const lastWords = lastEvent.split(/\s+/).filter(w => w.length > 4);
    if (lastWords.length > 0) {
      const keyword = random(lastWords);
      allSuggestions.push(
        `As consequências do que aconteceu com "${keyword.toLowerCase()}" começam a se manifestar`,
        `${protag} reflete sobre o evento anterior e toma uma decisão crucial`,
      );
    }
  }

  // ========== SUGESTÕES COM PERSONAGENS SECUNDÁRIOS ==========
  
  if (chars.length > 0 && chars[0] !== 'um aliado misterioso') {
    allSuggestions.push(
      `${random(chars)} revela um segredo que muda a perspectiva de ${protag}`,
      `A lealdade de ${random(chars)} é colocada à prova de forma dramática`,
    );
    
    if (chars.length > 1) {
      allSuggestions.push(
        `Tensão surge entre ${chars[0]} e ${chars[1]}, forçando ${protag} a intervir`,
      );
    }
  }

  // Remove duplicatas e embaralha
  const uniqueSuggestions = [...new Set(allSuggestions)].filter(s => s && s.length > 10);
  
  // Retorna 6 sugestões aleatórias
  return shuffle(uniqueSuggestions).slice(0, 6);
}

// Retorna uma descrição do contexto atual
export function getSuggestionRationale(context: StoryContext): string {
  const pos = context.currentPosition;
  const hasSynopsis = context.synopsis && context.synopsis.length > 10;
  
  let positionHint = '';
  if (pos <= 1) positionHint = "🌅 Abertura";
  else if (pos < 1.5) positionHint = "📖 Estabelecendo o mundo";
  else if (pos < 2) positionHint = "🚀 Chamado à aventura";
  else if (pos < 2.35) positionHint = "⚔️ Testes e aliados";
  else if (pos < 2.65) positionHint = "🔥 Clímax";
  else if (pos < 2.85) positionHint = "💪 Provação suprema";
  else if (pos < 3) positionHint = "🏃 Caminho de volta";
  else positionHint = "🏁 Resolução";
  
  if (hasSynopsis) {
    const analysis = analyzeSynopsis(context.synopsis);
    const info: string[] = [];
    if (analysis.protagonist) info.push(`👤 ${analysis.protagonist}`);
    if (analysis.themes.length > 0) info.push(`🎭 ${analysis.themes.slice(0, 2).join(', ')}`);
    return `${positionHint} | ${info.join(' • ') || 'Sinopse analisada'}`;
  }
  
  return `${positionHint} | ⚠️ Adicione sinopse para sugestões personalizadas`;
}
