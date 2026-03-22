export const t = {
  en: {
    nav: {
      whyItMatters:    "Why it matters",
      howItWorks:      "How it works",
      whatFacultySee:  "What faculty see",
      academicIntegrity: "Academic integrity",
      forInstitutions: "For institutions",
      myWorkspace:     "My Workspace",
      tryIt:           "Try it",
    },
    hero: {
      ribbon: "Assessment beyond the multiple-choice score",
      h1a:    "See the thinking behind",
      h1em:   "every answer",
      sub:    "Student Central helps educators go beyond MCQs by combining answer selection with short AI-guided discussion. The result: educators gain a deeper view of student reasoning, misconceptions, confidence, and true topic mastery.",
      tryIt:  "Try it",
      myWorkspace: "My Workspace",
      trust: [
        "Built for higher education",
        "Course-aligned assessment flows",
        "Faculty-controlled prompts and review",
        "No student data used to train public models",
      ],
      steps: [
        { num: "01", label: "Answer the question" },
        { num: "02", label: "Explain your reasoning" },
        { num: "03", label: "Faculty receives the signal" },
      ],
      step1: {
        topic: "Assessment moment",
        q: "Which of the following best explains why stablecoins reduce friction in cross-border payments?",
        opts: [
          "Because stablecoins are pegged to fiat currencies, eliminating exchange rate risk entirely.",
          "Because settlement can be faster and more programmable than traditional correspondent banking flows.",
          "Because central banks are legally required to accept stablecoin payments.",
        ],
        selected: 1,
      },
      step2: {
        ai1: "What made you choose this answer?",
        s1:  "I think it's because stablecoins are faster… like they don't go through banks the same way.",
        ai2: "What do you mean by 'not the same way'?",
        s2:  "Like… normally payments go through several banks, right? And that takes time.",
        ai3: "Exactly. And how is it different with stablecoins?",
        s3:  "With stablecoins it can go directly on the blockchain, so fewer intermediaries and faster settlement.",
        senderAI: "AI Tutor",
        senderStudent: "Student",
      },
      step3: {
        verdictTitle: "Strong understanding",
        verdictSub:   "Answer reflects real reasoning, not guesswork",
        section1Label: "What the student understood",
        section1Points: [
          "Fewer intermediaries make payments faster",
          "Blockchain enables direct settlement",
          "Price stability is not the main mechanism",
        ],
        section2Label: "Any confusion?",
        section2Points: [
          "Initially mixed up speed and price stability",
          "Clarified after follow-up — no remaining confusion",
        ],
        reliableLabel:   "How reliable is this answer?",
        reliableVerdict: "High — consistent and well-explained reasoning",
      },
      prev: "← Prev",
      next: "Next →",
    },
    divider: [
      "Reasoning-Aware Assessment",
      "Misconception Detection",
      "Faculty Assessment Intelligence",
      "Interpretable Learning Signals",
      "Course-Aligned Explanation Analysis",
    ],
    problem: {
      ribbon:    "Why traditional MCQs are not enough",
      headline:  "A correct answer is not always evidence of understanding",
      body:      "Multiple-choice questions are efficient, scalable, and familiar. But they mainly capture the final selection, not the reasoning behind it. A student may answer correctly through guessing, pattern recognition, or partial recall. Another may answer incorrectly while showing strong partial understanding. Traditional scoring rarely captures that difference.",
      cards: [
        {
          num: "01",
          title: "Correct does not always mean understood",
          body: "Students can land on the right option for the wrong reason.",
        },
        {
          num: "02",
          title: "Wrong does not always mean lost",
          body: "Some incorrect answers still reveal partial mastery worth building on.",
        },
        {
          num: "03",
          title: "Faculty need more than a score",
          body: "To teach effectively, instructors need to see misconceptions, not just outcomes.",
        },
      ],
    },
    approach: {
      ribbon:   "Our Approach",
      headline: "Student Central turns MCQs into reasoning-aware assessment",
      kicker:   "From answer selection to evidence of reasoning",
      body:     "After each selected answer, Student Central invites the learner to explain their choice, compare it with alternative options, and articulate the underlying concept. AI then helps classify the quality of the reasoning so educators can distinguish real understanding from fragile success.",
      summaryTitle: "Four assessment outcome states",
      summary: [
        { from: "Correct + strong explanation",     to: "Likely robust understanding" },
        { from: "Correct + weak explanation",        to: "Possible guess or fragile knowledge" },
        { from: "Incorrect + partial explanation",   to: "Misconception worth targeted feedback" },
        { from: "Incorrect + confused explanation",  to: "Low mastery, requiring deeper support" },
      ],
      quads: [
        { badge: "Robust",      answer: "Correct",   state: "Correct + Strong Explanation",    body: "Likely robust understanding. Student demonstrates command of the concept beyond the selected option." },
        { badge: "Fragile",     answer: "Correct",   state: "Correct + Weak Explanation",      body: "Possible guess, pattern recognition, or fragile knowledge. Success may not survive context-switching." },
        { badge: "Partial",     answer: "Incorrect", state: "Incorrect + Partial Explanation",  body: "Misconception or incomplete model. Worth targeted feedback — there is a foundation to build on." },
        { badge: "Low mastery", answer: "Incorrect", state: "Incorrect + Confused Explanation", body: "Low mastery. Requires deeper instructional support rather than simple correction." },
      ],
    },
    workflow: {
      ribbon:   "How it works",
      headline: "A simple workflow for faculty, a deeper signal for learning",
      steps: [
        { idx: "Step 01", title: "Start from an MCQ",             body: "Faculty upload or author multiple-choice questions aligned with course objectives." },
        { idx: "Step 02", title: "Capture the \"why\"",           body: "After each response, the student is prompted to justify their choice, contrast alternatives, or explain the concept in their own words." },
        { idx: "Step 03", title: "Analyze reasoning",             body: "Student Central evaluates the explanation against course-grounded expectations: conceptual accuracy, option distinction, presence of misconceptions, depth of reasoning." },
        { idx: "Step 04", title: "Generate actionable insight",   body: "Faculty see not only who got the question right or wrong, but where reasoning is solid, fragile, or confused across topics, cohorts, and assessments." },
      ],
    },
    faculty: {
      ribbon:   "Faculty Visibility",
      headline: "Move from grades and percentages to interpretable learning signals",
      body:     "Student Central gives instructors a more usable picture of student understanding. Instead of seeing only item success rates, they can inspect how students justify answers, where distractors remain attractive, and which misconceptions cluster around specific concepts.",
      tiles: [
        { label: "Questions answered this week",    value: "247" },
        { label: "Correct-but-fragile responses",   value: "31"  },
        { label: "Strong explanations by topic",    value: "68%" },
        { label: "Students needing follow-up",      value: "14"  },
      ],
      rows: [
        { label: "Topics with highest misconception rate",               value: "Regression models · Stablecoin settlement" },
        { label: "Distractors most frequently defended incorrectly",     value: "View full report →" },
      ],
      insights: [
        {
          topic: "Topic: Regression vs Classification",
          title: "Students identify the right model — but can't explain the decision rule",
          body:  "Students often identify the correct model when examples are obvious, but struggle to articulate the decision rule when variables or outcomes become ambiguous. The gap appears in justification, not in selection.",
        },
        {
          topic: "Topic: Stablecoin Settlement",
          title: "Confusing price stability with payment efficiency",
          body:  "Students recognize speed and programmability language, but frequently confuse price stability with payment efficiency — a recurring misconception that answer selection alone would never surface.",
        },
      ],
    },
    pedagogy: {
      ribbon:    "Pedagogical Value",
      headline:  "Better assessment, better feedback, better teaching decisions",
      cols: [
        { title: "More valid assessment",       body: "Measure understanding more credibly than answer selection alone. Capture the reasoning, not just the outcome." },
        { title: "Better formative feedback",   body: "Detect whether a student needs reassurance, correction, or conceptual rebuilding — before the summative assessment." },
        { title: "Better course improvement",   body: "See where items are misleading, where misconceptions persist, and where teaching may need reinforcement." },
      ],
      punchText: "Student Central does not replace MCQs. It makes them more meaningful.",
      punchSub:  "Discussion-Enhanced MCQ Evaluation",
    },
    trust: {
      ribbon:   "Academic Integrity & Trust",
      headline: "Designed for serious academic use, not generic AI chat",
      body:     "The platform speaks directly to governance, rollout, privacy posture, and evidence expectations for university stakeholders.",
      blocks: [
        { title: "Course-grounded evaluation",      body: "Assessment prompts and interpretation can be aligned to faculty expectations and course language." },
        { title: "Faculty control",                  body: "Educators define the question flows, acceptable reasoning patterns, and review process." },
        { title: "Transparent assessment logic",    body: "The platform surfaces why an explanation appears strong, partial, or weak — not just the final classification." },
        { title: "Privacy-conscious deployment",    body: "Student data stays within institutionally appropriate boundaries and is not used to train public models." },
      ],
    },
    institutional: {
      ribbon:   "For Departments & Institutions",
      headline: "A scalable way to enrich assessment without abandoning familiar formats",
      body:     "Most institutions will not replace MCQs overnight. Student Central offers a practical path forward: keep the efficiency and comparability of selected-response assessment, while adding a structured layer that captures reasoning, misconception patterns, and depth of understanding.",
      bullets: [
        "Works with existing assessment habits",
        "Adds richer evidence without requiring full essay grading",
        "Supports pilot programs in high-enrollment courses",
        "Generates aggregate insight for curriculum improvement",
        "Helps departments explore AI-enhanced assessment responsibly",
      ],
      whoHeadline: "Built for educators who want more than a percentage score",
      who: [
        "Professors running large undergraduate courses",
        "Departments piloting AI-enhanced assessment",
        "Programs focused on learning quality and retention",
        "Institutions exploring authentic evidence of mastery",
      ],
    },
    cta: {
      h2a:     "MCQs tell you what students selected. Student Central shows you",
      h2em:    "the thinking behind every answer.",
      sub:     "Bring reasoning, misconception detection, and richer mastery signals into your existing assessment workflow.",
      primary: "Try it",
      ghost:   "Talk to the team",
    },
    footer: {
      message: "Built by",
      name:    "Nicolas Boitout",
      rest:    "and a Franco-Romanian team passionate about learning",
      copy:    "© 2025 Student Central",
    },
  },

  /* ═══════════════════════════════════════════════════════
     FRANÇAIS — registre académique, orientation professionnelle
  ═══════════════════════════════════════════════════════ */
  fr: {
    nav: {
      whyItMatters:      "Pourquoi c'est essentiel",
      howItWorks:        "Comment ça fonctionne",
      whatFacultySee:    "Ce que voit l'enseignant",
      academicIntegrity: "Intégrité académique",
      forInstitutions:   "Pour les établissements",
      myWorkspace:       "Mon espace",
      tryIt:             "Essayer",
    },
    hero: {
      ribbon: "L'évaluation au-delà du score QCM",
      h1a:    "Accédez au raisonnement derrière",
      h1em:   "chaque réponse",
      sub:    "Student Central aide les enseignants à dépasser les QCM en combinant la sélection de réponses avec un dialogue guidé par l'IA. Résultat : une lecture précise du raisonnement étudiant, des représentations erronées, du niveau de confiance et de la maîtrise réelle des concepts.",
      tryIt:       "Essayer",
      myWorkspace: "Mon espace",
      trust: [
        "Conçu pour l'enseignement supérieur",
        "Évaluations alignées sur les objectifs pédagogiques",
        "Prompts et révisions contrôlés par l'enseignant",
        "Données étudiantes non utilisées pour entraîner des modèles publics",
      ],
      steps: [
        { num: "01", label: "Répondre à la question" },
        { num: "02", label: "Justifier son choix" },
        { num: "03", label: "L'enseignant reçoit le signal" },
      ],
      step1: {
        topic: "Moment d'évaluation",
        q: "Laquelle des affirmations suivantes explique le mieux pourquoi les stablecoins réduisent les frictions dans les paiements transfrontaliers ?",
        opts: [
          "Parce que les stablecoins sont indexés sur des devises fiduciaires, éliminant totalement le risque de change.",
          "Parce que le règlement peut être plus rapide et plus programmable que les flux bancaires correspondants traditionnels.",
          "Parce que les banques centrales sont légalement tenues d'accepter les paiements en stablecoins.",
        ],
        selected: 1,
      },
      step2: {
        ai1: "Qu'est-ce qui vous a amené à choisir cette réponse ?",
        s1:  "Je pense que c'est parce que les stablecoins sont plus rapides… comme s'ils ne passaient pas par les banques de la même façon.",
        ai2: "Que voulez-vous dire par « pas de la même façon » ?",
        s2:  "Enfin… normalement les paiements transitent par plusieurs banques, non ? Et ça prend du temps.",
        ai3: "Exactement. Et en quoi c'est différent avec les stablecoins ?",
        s3:  "Avec les stablecoins, ça peut passer directement par la blockchain, donc moins d'intermédiaires et un règlement plus rapide.",
        senderAI:      "Tuteur IA",
        senderStudent: "Étudiant",
      },
      step3: {
        verdictTitle: "Compréhension solide",
        verdictSub:   "La réponse reflète un vrai raisonnement, pas une intuition",
        section1Label: "Ce que l'étudiant a compris",
        section1Points: [
          "Moins d'intermédiaires accélèrent les paiements",
          "La blockchain permet un règlement direct",
          "La stabilité des prix n'est pas le mécanisme principal",
        ],
        section2Label: "Une confusion détectée ?",
        section2Points: [
          "A d'abord confondu vitesse et stabilité des prix",
          "Clarifié après relance — aucune confusion résiduelle",
        ],
        reliableLabel:   "Dans quelle mesure cette réponse est-elle fiable ?",
        reliableVerdict: "Élevée — raisonnement cohérent et bien argumenté",
      },
      prev: "← Préc.",
      next: "Suiv. →",
    },
    divider: [
      "Évaluation du raisonnement",
      "Détection des représentations erronées",
      "Intelligence pédagogique pour l'enseignant",
      "Signaux d'apprentissage interprétables",
      "Analyse des explications alignée sur les cours",
    ],
    problem: {
      ribbon:   "Pourquoi les QCM traditionnels ne suffisent pas",
      headline: "Une bonne réponse n'est pas toujours la preuve d'une vraie compréhension",
      body:     "Les QCM sont efficaces, scalables et bien établis dans les pratiques académiques. Mais ils ne capturent que la sélection finale, non le raisonnement sous-jacent. Un étudiant peut répondre correctement par conjecture, par reconnaissance de motifs ou par mémorisation partielle. Un autre peut répondre incorrectement tout en faisant preuve d'une compréhension partielle solide. La notation traditionnelle ne saisit que rarement cette nuance.",
      cards: [
        {
          num: "01",
          title: "Correct ne signifie pas toujours compris",
          body: "Un étudiant peut sélectionner la bonne option pour de mauvaises raisons.",
        },
        {
          num: "02",
          title: "Incorrect ne signifie pas toujours perdu",
          body: "Certaines réponses erronées révèlent une maîtrise partielle sur laquelle on peut s'appuyer.",
        },
        {
          num: "03",
          title: "L'enseignant a besoin de plus qu'un score",
          body: "Pour enseigner efficacement, les formateurs doivent identifier les représentations erronées, pas seulement les résultats.",
        },
      ],
    },
    approach: {
      ribbon:   "Notre approche",
      headline: "Student Central transforme les QCM en évaluation du raisonnement",
      kicker:   "De la sélection de réponse à la preuve du raisonnement",
      body:     "Après chaque réponse sélectionnée, Student Central invite l'apprenant à expliquer son choix, à le comparer avec les alternatives et à articuler le concept sous-jacent. L'IA aide ensuite à qualifier la qualité du raisonnement afin que les enseignants puissent distinguer une vraie compréhension d'une réussite fragile.",
      summaryTitle: "Quatre états d'évaluation possibles",
      summary: [
        { from: "Correct + explication solide",      to: "Compréhension probablement robuste" },
        { from: "Correct + explication faible",      to: "Conjecture possible ou savoir fragile" },
        { from: "Incorrect + explication partielle", to: "Représentation erronée à corriger ciblément" },
        { from: "Incorrect + explication confuse",   to: "Faible maîtrise, nécessite un soutien approfondi" },
      ],
      quads: [
        { badge: "Robuste",          answer: "Correct",    state: "Correct + Explication solide",    body: "Compréhension probablement robuste. L'étudiant démontre une maîtrise du concept au-delà de l'option sélectionnée." },
        { badge: "Fragile",          answer: "Correct",    state: "Correct + Explication faible",    body: "Conjecture possible, reconnaissance de motifs ou savoir fragile. La réussite pourrait ne pas résister à un changement de contexte." },
        { badge: "Partiel",          answer: "Incorrect",  state: "Incorrect + Explication partielle", body: "Représentation erronée ou modèle incomplet. Un retour ciblé s'impose — il existe une base sur laquelle s'appuyer." },
        { badge: "Faible maîtrise",  answer: "Incorrect",  state: "Incorrect + Explication confuse",  body: "Faible maîtrise. Nécessite un soutien pédagogique approfondi plutôt qu'une simple correction." },
      ],
    },
    workflow: {
      ribbon:   "Comment ça fonctionne",
      headline: "Un parcours simple pour l'enseignant, un signal d'apprentissage plus riche",
      steps: [
        { idx: "Étape 01", title: "Partir d'un QCM",              body: "Les enseignants importent ou créent des questions à choix multiples alignées sur les objectifs pédagogiques du cours." },
        { idx: "Étape 02", title: "Capturer le « pourquoi »",     body: "Après chaque réponse, l'étudiant est invité à justifier son choix, à contraster les alternatives ou à expliquer le concept dans ses propres mots." },
        { idx: "Étape 03", title: "Analyser le raisonnement",     body: "Student Central évalue l'explication au regard des attendus du cours : exactitude conceptuelle, distinction entre options, présence de représentations erronées, profondeur du raisonnement." },
        { idx: "Étape 04", title: "Générer des insights actionnables", body: "Les enseignants voient non seulement qui a répondu juste ou faux, mais où le raisonnement est solide, fragile ou confus — par sujet, cohorte et évaluation." },
      ],
    },
    faculty: {
      ribbon:   "Visibilité pour l'enseignant",
      headline: "Passer des notes et pourcentages aux signaux d'apprentissage interprétables",
      body:     "Student Central offre aux enseignants une vision exploitable de la compréhension étudiante. Plutôt que de ne voir que les taux de réussite par item, ils peuvent examiner comment les étudiants justifient leurs réponses, quels distracteurs restent attractifs, et quelles représentations erronées se concentrent autour de concepts spécifiques.",
      tiles: [
        { label: "Questions traitées cette semaine",          value: "247" },
        { label: "Réponses correctes mais fragiles",          value: "31"  },
        { label: "Explications solides par thème",            value: "68%" },
        { label: "Étudiants nécessitant un suivi",            value: "14"  },
      ],
      rows: [
        { label: "Thèmes avec le taux d'erreur conceptuelle le plus élevé", value: "Modèles de régression · Règlement stablecoin" },
        { label: "Distracteurs le plus souvent défendus à tort",            value: "Voir le rapport complet →" },
      ],
      insights: [
        {
          topic: "Thème : Régression vs Classification",
          title: "Les étudiants identifient le bon modèle — mais ne savent pas expliquer la règle de décision",
          body:  "Les étudiants identifient souvent le bon modèle lorsque les exemples sont évidents, mais peinent à formuler la règle de décision dès que les variables ou les résultats deviennent ambigus. Le décalage apparaît dans la justification, pas dans la sélection.",
        },
        {
          topic: "Thème : Règlement des stablecoins",
          title: "Confusion entre stabilité des prix et efficacité des paiements",
          body:  "Les étudiants reconnaissent le langage de la vitesse et de la programmabilité, mais confondent fréquemment stabilité des prix et efficacité des paiements — une représentation erronée récurrente que la sélection de réponse seule n'aurait jamais fait émerger.",
        },
      ],
    },
    pedagogy: {
      ribbon:   "Valeur pédagogique",
      headline: "Une meilleure évaluation, un meilleur retour, de meilleures décisions pédagogiques",
      cols: [
        { title: "Une évaluation plus valide",             body: "Mesurez la compréhension de façon plus crédible que la seule sélection de réponse. Captez le raisonnement, pas seulement le résultat." },
        { title: "Un meilleur retour formatif",            body: "Détectez si un étudiant a besoin de réassurance, de correction ou d'une reconstruction conceptuelle — avant l'évaluation sommative." },
        { title: "Une amélioration continue des cours",    body: "Identifiez les items trompeurs, les représentations erronées persistantes et les points du cours qui nécessitent un renforcement." },
      ],
      punchText: "Student Central ne remplace pas les QCM. Il les rend plus significatifs.",
      punchSub:  "Évaluation QCM enrichie par le dialogue",
    },
    trust: {
      ribbon:   "Intégrité académique et confiance",
      headline: "Conçu pour un usage académique rigoureux, pas pour une IA généraliste",
      body:     "La plateforme répond directement aux exigences de gouvernance, de déploiement, de protection des données et d'évidence probante des parties prenantes universitaires.",
      blocks: [
        { title: "Évaluation ancrée dans les cours",       body: "Les prompts d'évaluation et leur interprétation peuvent être alignés sur les attendus des enseignants et le vocabulaire du cours." },
        { title: "Contrôle de l'enseignant",               body: "Les pédagogues définissent les flux de questions, les schémas de raisonnement acceptables et le processus de révision." },
        { title: "Logique d'évaluation transparente",      body: "La plateforme indique pourquoi une explication paraît solide, partielle ou faible — et ne se limite pas à la classification finale." },
        { title: "Déploiement respectueux de la vie privée", body: "Les données étudiantes restent dans des périmètres institutionnels appropriés et ne sont pas utilisées pour entraîner des modèles publics." },
      ],
    },
    institutional: {
      ribbon:   "Pour les départements et établissements",
      headline: "Une voie scalable pour enrichir l'évaluation sans abandonner les formats établis",
      body:     "La plupart des établissements n'abandonneront pas les QCM du jour au lendemain. Student Central offre une trajectoire pragmatique : conserver l'efficacité et la comparabilité de l'évaluation à réponse choisie, tout en ajoutant une couche structurée qui capte le raisonnement, les schémas d'erreur conceptuelle et la profondeur de compréhension.",
      bullets: [
        "S'intègre aux pratiques d'évaluation existantes",
        "Produit des preuves plus riches sans exiger la correction intégrale de dissertations",
        "Soutient les programmes pilotes dans les cours à fort effectif",
        "Génère des insights agrégés pour l'amélioration des curricula",
        "Aide les départements à explorer l'évaluation augmentée par l'IA de façon responsable",
      ],
      whoHeadline: "Conçu pour les enseignants qui veulent aller au-delà du pourcentage de réussite",
      who: [
        "Enseignants gérant des cours magistraux à fort effectif",
        "Départements pilotant l'évaluation augmentée par l'IA",
        "Programmes axés sur la qualité des apprentissages et la rétention",
        "Établissements en quête de preuves authentiques de la maîtrise",
      ],
    },
    cta: {
      h2a:     "Les QCM vous disent ce que les étudiants ont sélectionné. Student Central vous révèle",
      h2em:    "le raisonnement derrière chaque réponse.",
      sub:     "Intégrez l'analyse du raisonnement, la détection des représentations erronées et des signaux de maîtrise plus riches dans votre workflow d'évaluation existant.",
      primary: "Essayer",
      ghost:   "Contacter l'équipe",
    },
    footer: {
      message: "Conçu par",
      name:    "Nicolas Boitout",
      rest:    "et une équipe franco-roumaine passionnée par l'apprentissage",
      copy:    "© 2025 Student Central",
    },
  },
} as const;

export type Translations = typeof t.en;

/** Returns translations for the given lang, falling back to English for untranslated langs */
export function tx(lang: string): Translations {
  return ((t as unknown) as Record<string, Translations>)[lang] ?? t.en;
}
