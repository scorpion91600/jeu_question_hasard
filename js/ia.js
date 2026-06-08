// js/claude.js — scoring local (pas d'API IA requise)

const CONNECTORS = [
  'car','parce que','en effet','ainsi','donc','or','mais','cependant',
  'néanmoins','toutefois','de plus','par ailleurs','premièrement',
  'deuxièmement','enfin','en revanche','certes','pourtant','d\'abord',
  'ensuite','finalement','notamment','surtout','c\'est pourquoi',
  'il est vrai que','force est de constater','on peut affirmer'
];

const STRONG_WORDS_POUR = [
  'essentiel','indispensable','évidemment','clairement','absolument',
  'meilleur','supérieur','incontestablement','sans aucun doute','parfait',
  'excellent','remarquable','nécessaire','fondamental','prouvé','démontré'
];

const STRONG_WORDS_CONTRE = [
  'ridicule','absurde','impossible','inacceptable','faux','erreur',
  'illusion','mensonge','dangereux','néfaste','catastrophique',
  'irresponsable','insensé','inadmissible','déplorable','scandaleux'
];

const VERDICTS_HIGH = [
  'Une plaidoirie digne des plus grands tribuns !',
  'Le jury est sous le choc. Bravo l\'artiste !',
  'Même l\'adversaire applaudit. Impressionnant.',
  'La salle est en délire. Chef-d\'œuvre rhétorique !',
  'Aristote lui-même aurait pris des notes.',
  'Plaidoirie de génie. La défense pleure déjà.',
  'Le juge retire sa robe pour applaudir.'
];

const VERDICTS_MID = [
  'Convaincant, mais peut mieux faire.',
  'Solide sans être flamboyant. Honorable.',
  'Le jury délibère encore. C\'est tout dire.',
  'Correct, mais l\'adversaire n\'a pas tremblé.',
  'Du bon travail, mais l\'éloquence manque.',
  'Pas mauvais, mais pas inoubliable non plus.',
  'La cause est défendue. Faiblement, mais défendue.'
];

const VERDICTS_LOW = [
  'Le jury s\'est endormi avant la fin.',
  'Plaidoirie vue, aussitôt oubliée.',
  'L\'accusé aurait mieux fait de se taire.',
  'Même le greffier bâillait. Désolant.',
  'La défense demande l\'acquittement… par pitié.',
  'Arguments introuvables. Courage visible, résultat nul.',
  'Le juge a demandé une traduction en logique.'
];

/** Sélectionne un élément aléatoire dans un tableau */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Compte combien d'éléments d'une liste apparaissent dans le texte */
function countMatches(text, list) {
  const lower = text.toLowerCase();
  return list.filter(w => lower.includes(w)).length;
}

/** Ratio de mots uniques sur total (richesse lexicale) */
function lexicalRichness(text) {
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  if (words.length === 0) return 0;
  const unique = new Set(words).size;
  return unique / words.length;
}

/** Nombre de phrases dans le texte */
function sentenceCount(text) {
  return (text.match(/[.!?]+/g) || []).length;
}

/**
 * Score une plaidoirie localement.
 * Retourne { conviction, arguments, originality, style, total, verdict }
 */
export async function scorePlea({ subject, camp, content }) {
  const text    = content.trim();
  const words   = (text.match(/\b\w+\b/g) || []);
  const wordCnt = words.length;
  const sentences = sentenceCount(text);

  // ── Conviction (0–30) ──
  const strongWords = camp === 'POUR' ? STRONG_WORDS_POUR : STRONG_WORDS_CONTRE;
  const strongHits  = countMatches(text, strongWords);
  const exclMarks   = (text.match(/!/g) || []).length;
  const convRaw     = Math.min(strongHits * 4 + exclMarks * 2 + Math.min(wordCnt / 8, 10), 30);
  const conviction  = Math.round(convRaw);

  // ── Arguments (0–30) ──
  const connectorHits = countMatches(text, CONNECTORS);
  const lengthBonus   = Math.min(wordCnt / 5, 15);
  const structBonus   = Math.min(sentences * 2, 10);
  const argsRaw       = Math.min(connectorHits * 5 + lengthBonus + structBonus, 30);
  const args          = Math.round(argsRaw);

  // ── Originalité (0–20) ──
  const richness    = lexicalRichness(text);
  const originality = Math.round(Math.min(richness * 28, 20));

  // ── Style (0–20) ──
  const hasPunct   = /[,;:—]/.test(text) ? 3 : 0;
  const hasQuestion = /\?/.test(text) ? 3 : 0;
  const sentVariety = sentences >= 3 ? 4 : sentences >= 2 ? 2 : 0;
  const lengthStyle = Math.min(wordCnt / 6, 10);
  const style       = Math.round(Math.min(hasPunct + hasQuestion + sentVariety + lengthStyle, 20));

  const total = conviction + args + originality + style;

  // ── Verdict ──
  let verdict;
  if (total >= 70)      verdict = pick(VERDICTS_HIGH);
  else if (total >= 40) verdict = pick(VERDICTS_MID);
  else                  verdict = pick(VERDICTS_LOW);

  // Simuler un léger délai pour l'effet "l'IA réfléchit"
  await new Promise(r => setTimeout(r, 1200));

  return { conviction, arguments: args, originality, style, total, verdict };
}

/** Génère un sujet du jour depuis une liste prédéfinie */
export async function generateSubject() {
  const subjects = [
    { text: 'Les chats sont supérieurs aux chiens',                    category: 'absurde' },
    { text: 'L\'ananas a sa place sur la pizza',                       category: 'absurde' },
    { text: 'Dormir est une perte de temps',                           category: 'absurde' },
    { text: 'Les réseaux sociaux font plus de mal que de bien',        category: 'societal' },
    { text: 'Le télétravail devrait être la norme pour tous',          category: 'societal' },
    { text: 'La semaine de 4 jours est l\'avenir du travail',          category: 'societal' },
    { text: 'L\'argent fait le bonheur',                               category: 'philosophique' },
    { text: 'La liberté vaut mieux que la sécurité',                  category: 'philosophique' },
    { text: 'Les jeux vidéo sont un art à part entière',               category: 'philosophique' },
    { text: 'La voiture devrait être interdite en ville',              category: 'societal' },
    { text: 'Les devoirs à la maison sont inutiles',                   category: 'societal' },
    { text: 'Tout le monde devrait apprendre à coder',                 category: 'societal' },
    { text: 'Les extraterrestres existent forcément',                  category: 'absurde' },
    { text: 'Il vaut mieux être chanceux qu\'intelligent',             category: 'philosophique' },
    { text: 'Le matin est le meilleur moment de la journée',          category: 'absurde' },
  ];
  return pick(subjects);
}
