/* ============================================================
   NIGHTACTIONS.JS
   Systeme d'alibis/activites nocturnes (a la "parmi nous",
   adapte au Loup-Garou). Chaque round, TOUS les joueurs vivants
   recoivent une carte privee decrivant ce qu'ils ont fait/vu/
   entendu cette nuit-la. Ce n'est PAS lie a leur vrai role : un
   Villageois peut tomber sur une carte tres suspecte et devoir
   se justifier, pendant qu'un Loup peut avoir une carte
   parfaitement innocente qui le couvre. Le but est de donner a
   CHACUN quelque chose de concret a raconter (vrai ou invente)
   pendant son tour de parole, pour faire vivre le debat.
   ============================================================ */

// {name} = un(e) autre joueur(euse) vivant(e) au hasard
// {victim} = la victime de la nuit precedente si elle existe (sinon la carte est ignoree)
const NIGHT_ACTION_CARDS = [
  // --- Neutres / sans nom, faciles a raconter, ne compromettent personne ---
  { id: 'slept', type: 'neutral', text: "Tu as dormi comme une souche, tu n'as rien vu ni entendu de la nuit." },
  { id: 'water', type: 'neutral', text: "Tu es sorti(e) chercher de l'eau au puits, rien de plus." },
  { id: 'prayed', type: 'neutral', text: "Tu as prié un long moment avant de trouver le sommeil." },
  { id: 'cold', type: 'neutral', text: "Tu as eu trop froid pour dormir, tu as juste tourné en rond chez toi." },
  { id: 'dream', type: 'neutral', text: "Tu as fait un rêve étrange dont tu te souviens à peine." },
  { id: 'silence', type: 'neutral', text: "Le silence total cette nuit t'a semblé presque anormal." },

  // --- Auto-suspectes : te placent en position delicate a justifier ---
  { id: 'window', type: 'self_suspicious', text: "Ta fenêtre était étrangement ouverte ce matin, tu ne te souviens pas de l'avoir laissée ainsi." },
  { id: 'mud', type: 'self_suspicious', text: "Tu as retrouvé de la boue sur tes chaussures ce matin, sans savoir pourquoi." },
  { id: 'sneak', type: 'self_suspicious', text: "Tu es sorti(e) discrètement en pleine nuit pour une raison que tu préfères garder pour toi." },
  { id: 'insomnia', type: 'self_suspicious', text: "Tu n'as pas fermé l'œil de la nuit, rongé(e) par une angoisse que tu as du mal à expliquer." },
  { id: 'blood', type: 'self_suspicious', text: "Tu as une petite égratignure ce matin que tu ne t'expliques pas." },
  { id: 'footprints', type: 'self_suspicious', text: "Des traces de pas mystérieuses menaient jusqu'à ta porte ce matin." },
  { id: 'noheard', type: 'self_suspicious', text: "Tu étais dehors au moment où tout s'est joué cette nuit, mais tu jures n'avoir rien vu." },

  // --- Implique quelqu'un d'autre : de quoi lancer une vraie discussion ---
  { id: 'saw_out', type: 'accuses', text: "Tu as vu {name} sortir de chez lui/elle en pleine nuit, alors que tout le monde aurait dû dormir." },
  { id: 'heard_whisper', type: 'accuses', text: "Tu jures avoir entendu {name} chuchoter avec quelqu'un dans l'obscurité." },
  { id: 'light_on', type: 'accuses', text: "Tu as aperçu de la lumière chez {name} en pleine nuit." },
  { id: 'near_noise', type: 'accuses', text: "Tu as entendu du bruit venir de la direction de la maison de {name}." },
  { id: 'weird_look', type: 'accuses', text: "{name} avait un regard bizarre hier soir avant que tout le monde aille se coucher, tu y repenses." },
  { id: 'gone_missing', type: 'accuses', text: "Tu as remarqué que {name} avait disparu un moment pendant que vous discutiez encore hier soir." },

  // --- Alibi partage : peut etre confirme ou contredit par l'autre personne ---
  { id: 'together', type: 'alibi', text: "Tu prétends avoir passé un moment avec {name} hier soir avant de dormir — voyez si son récit correspond au tien !" },
  { id: 'walked_with', type: 'alibi', text: "Tu dis avoir raccompagné {name} chez lui/elle hier soir. Est-ce que son histoire colle avec la tienne ?" },

  // --- Ambiance / vagues, laissent la place a l'interpretation ---
  { id: 'shadow', type: 'vague', text: "Tu as vu une ombre traverser la place du village vers minuit, sans pouvoir dire qui c'était." },
  { id: 'howl', type: 'vague', text: "Tu as entendu un hurlement au loin, mais tu n'as pas osé sortir voir." },
  { id: 'branch', type: 'vague', text: "Une branche a craqué juste sous ta fenêtre en pleine nuit. Tu n'as rien vu en regardant dehors." },
  { id: 'cold_wind', type: 'vague', text: "Un courant d'air glacial a traversé ta maison cette nuit, comme si une porte s'était ouverte quelque part." },
  { id: 'animal', type: 'vague', text: "Tu as entendu un animal s'agiter près de chez toi, rien de plus." },

  // --- Lien avec la victime de la nuit precedente (si applicable) ---
  { id: 'saw_victim', type: 'victim_link', text: "Tu as croisé {victim} juste avant que tout le monde aille dormir hier soir. Il/elle t'a semblé nerveux(se)." },
  { id: 'talked_victim', type: 'victim_link', text: "Tu as eu une courte conversation avec {victim} hier soir, peu avant le drame." }
];

/**
 * Genere une carte d'activite nocturne pour chaque joueur vivant.
 * Evite de redonner exactement la meme carte que le round precedent
 * a la meme personne, et remplit intelligemment {name}/{victim}.
 */
function generateNightActionCards(room) {
  const alive = Object.entries(room.players || {}).filter(([id, p]) => p.alive);
  const aliveIds = alive.map(([id]) => id);
  const lastRoundVictimId = (room.deathsThisRound || [])[0] || null;
  const cards = {};

  alive.forEach(([id, p]) => {
    const previousCardId = p.lastNightActionId;
    const others = aliveIds.filter(pid => pid !== id);

    let pool = NIGHT_ACTION_CARDS.filter(c => {
      if (c.id === previousCardId) return false; // pas deux fois la meme carte de suite
      if (c.type === 'accuses' || c.type === 'alibi') return others.length > 0;
      if (c.type === 'victim_link') return !!lastRoundVictimId && lastRoundVictimId !== id;
      return true;
    });
    if (pool.length === 0) pool = NIGHT_ACTION_CARDS.filter(c => c.type === 'neutral');

    const card = pool[Math.floor(Math.random() * pool.length)];
    let text = card.text;
    if (text.includes('{name}')) {
      const otherId = others[Math.floor(Math.random() * others.length)];
      text = text.replace('{name}', room.players[otherId].name);
    }
    if (text.includes('{victim}') && lastRoundVictimId && room.players[lastRoundVictimId]) {
      text = text.replace('{victim}', room.players[lastRoundVictimId].name);
    }

    cards[id] = { cardId: card.id, type: card.type, text };
  });

  return cards;
}
