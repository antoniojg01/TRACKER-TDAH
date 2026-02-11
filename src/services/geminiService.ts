import { LevelInfo } from "@/types";

// Fallback narratives for each level
const FALLBACK_NARRATIVES: Record<number, string> = {
  1: "No princípio era o vazio absoluto. Então, em uma fração infinitesimal de segundo, toda a matéria e energia do universo explodiram em existência. A temperatura era incompreensível, as leis da física se fundiam. Este é o momento zero - a Singularidade.",
  2: "Nos primeiros trilionésimos de segundo, o universo expandiu exponencialmente. Partículas fundamentais dançavam em um plasma incandescente. A radiação preenchia todo o cosmos nascente. Esta é a era da pura energia primordial.",
  3: "Por 380 mil anos, o universo foi opaco - um nevoeiro denso de hidrogênio ionizado. Quando finalmente esfriou, os primeiros átomos se formaram e a luz pode viajar livremente. A Era das Trevas começa, aguardando o nascimento das primeiras estrelas.",
  4: "Após milhões de anos no escuro, núcleos de gás colapsaram sob sua própria gravidade. As primeiras estrelas acenderam, massivas e azuis. Elas rasgaram as trevas, reionizando o universo. O cosmos finalmente tinha luz novamente.",
  5: "As estrelas primordiais viveram rápido e morreram jovens em supernovas espetaculares. Nessas fornalhas cósmicas, elementos pesados foram forjados - carbono, oxigênio, ferro. A química do universo se enriquecia. Você é feito de poeira estelar.",
  6: "A gravidade puxou estrelas em espirais majestosas. Nossa galáxia, a Via Láctea, tomou forma - um disco rotativo de 200 bilhões de sóis. No centro, um buraco negro supermassivo orquestra a dança cósmica. Arquitetura em escala inimaginável.",
  7: "Em um braço espiral da galáxia, uma nuvem de gás e poeira começou a colapsar. No centro, nosso Sol nasceu. Ao redor, planetesimais colidiram e cresceram. Em 100 milhões de anos, o Sistema Solar estava formado. Nosso lar cósmico nasceu.",
  8: "A Terra recém-formada era um inferno de magma líquido, bombardeada por asteroides. A superfície era uma sopa incandescente de rocha derretida. Lentamente, uma crosta frágil começou a solidificar. Este é o Hadeano - o período do inferno primordial.",
  9: "Nas poças quentes de um planeta jovem, algo extraordinário aconteceu. Moléculas orgânicas se organizaram. RNA primitivo se replicou. A primeira célula se formou. A vida emergiu da química. A abiogênese - o maior milagre do universo.",
  10: "Cianobactérias aprenderam a fotossintetizar, liberando oxigênio como resíduo. Por bilhões de anos, esse gás tóxico se acumulou. A atmosfera mudou radicalmente. Organismos que respiravam oxigênio puderam evoluir. O Grande Evento de Oxidação transformou a Terra.",
  11: "Células procariotas simples foram engolfadas por outras, formando simbioses. Mitocôndrias e cloroplastos nasceram. A célula eucarionte surgiu - complexa, compartimentalizada, capaz de especialização. A complexidade da vida deu um salto quântico.",
  12: "542 milhões de anos atrás, em apenas 25 milhões de anos, a vida marinha explodiu em diversidade. Trilobitas, moluscos, artrópodes - os planos corporais básicos de todos os animais modernos apareceram. A Explosão Cambriana foi a maior inovação evolutiva da história.",
  13: "Plantas pioneiras colonizaram a terra firme, criando solo. Artrópodes as seguiram. Então vieram os anfíbios, saindo das águas primordiais. Florestas de samambaias gigantes cobriram continentes. A vida havia conquistado um novo reino.",
  14: "Por 165 milhões de anos, dinossauros dominaram todos os ecossistemas terrestres. Do minúsculo Compsognathus ao colossal Argentinosaurus. Predadores ferozes e herbívoros pacíficos. Até que um asteroide de 10km terminou seu reinado há 66 milhões de anos.",
  15: "Das cinzas da extinção, mamíferos prosperaram. Primatas evoluíram nas árvores. Há 2 milhões de anos, Homo erectus dominou o fogo - luz, calor, proteção, cozimento. O fogo transformou a humanidade, permitindo cérebros maiores e sociedades complexas.",
  16: "Há 10 mil anos, humanos começaram a plantar sementes. Agricultura nasceu. Cidades surgiram. A escrita preservou conhecimento. Impérios se ergueram. Civilizações florescerem. A humanidade passou de caçadora-coletora a construtora de mundos.",
  17: "Você está aqui, agora, no presente. Tecnologia digital conecta bilhões. Foguetes exploram o cosmos. A humanidade olha para o universo com telescópios e manda sondas aos confins do sistema solar. Somos o universo consciente de si mesmo."
};

export async function getLevelNarrative(level: LevelInfo): Promise<string> {
  const fallbackText = FALLBACK_NARRATIVES[level.level] || `Você alcançou a era: ${level.storyEra}. O conhecimento desta época está sendo descriptografado no registro universal...`;
  
  try {
    // Check if we have an API key
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey || apiKey === "") {
      return fallbackText;
    }

    // Use Gemini REST API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Conte um parágrafo curto, inspirador e educativo (máximo 150 palavras) sobre a história do universo/mundo especificamente sobre o estágio: "${level.storyEra}". Este é o Nível ${level.level} de uma jornada de evolução. Fale como se estivesse narrando a evolução de um planeta para seu guardião. Use português do Brasil.`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 250,
          }
        })
      }
    );

    if (!response.ok) {
      console.log("Gemini API error, using fallback");
      return fallbackText;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return generatedText || fallbackText;
  } catch (error) {
    console.log("Using fallback narrative (Gemini unavailable):", error);
    return fallbackText;
  }
}
