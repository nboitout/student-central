export type TeachLang = "en" | "fr";

export interface TeachStrings {
  /* Left panel */
  coursesEyebrow:       string;
  loadingCourses:       string;
  expandList:           string;
  collapseList:         string;
  /* Mode tabs */
  tabQuestions:         string;
  tabStudents:          string;
  tabShare:             string;
  tabAnalytics:         string;
  /* Questions panel */
  loading:              string;
  orderingPlaylist:     string;
  done:                 string;
  cancel:               string;
  orderPlaylist:        string;
  newQuestion:          string;
  playlistHint:         string;
  edit:                 string;
  del:                  string;
  /* Share panel */
  shareEmailPlaceholder: string;
  share:                string;
  addStudent:           string;
  export:               string;
  noSessionsYet:        string;
  remove:               string;
  noQuestionsYet:       string;
  studentWithAccess:    string;
  studentsWithAccess:   string;
  noStudentsYet:        string;
  courseSettings:       string;
  allowDownload:        string;
  allowDownloadHint:    string;
  allowStudentSharing:  string;
  allowStudentSharingHint: string;
  visibleProgress:      string;
  visibleProgressHint:  string;
  on:                   string;
  off:                  string;
  /* Students panel */
  invite:               string;
  dropCsv:              string;
  oneEmailPerLine:      string;
  joined:               string;
  groupsLoading:        string;
  groups:               string;
  addGroup:             string;
  shared:               string;
  noGroups:             string;
  /* Analytics panel */
  selectGroupPlaceholder: string;
  statsStudents:        string;
  statsSessions:        string;
  statsAvgScore:        string;
  selectGroupHint:      string;
  loadingGroupAnalytics: string;
  noSessions:           string;
  weakConceptsLabel:    string;
  signalBreakdownLabel: string;
  /* Right panel — empty state */
  selectQuestion:       string;
  shareSettings:        string;
  invitationLabel:      string;
  selectStudent:        string;
  clickToEdit:          string;
  enterEmail:           string;
  clickInvite:          string;
  clickStudent:         string;
  /* Question editor */
  newQ:                 string;
  editQ:                string;
  pdfReference:         string;
  page:                 string;
  collapse:             string;
  expand:               string;
  hasVisual:            string;
  yes:                  string;
  no:                   string;
  source:               string;
  openFullPdf:          string;
  saveChanges:          string;
  createQuestion:       string;
  deleteQuestion:       string;
  questionLabel:        string;
  explanationLabel:     string;
  functionLabel:        string;
  pageRefLabel:         string;
  reformulate:          string;
  reformulating:        string;
  keepOriginal:         string;
  useThis:              string;
  /* Invite panel */
  invitationPreview:    string;
  inviteSubject:        string;
  inviteHello:          string;
  inviteBody:           string;
  inviteLink:           string;
  inviteAfter:          string;
  pasteEmails:          string;
  sendInvitations:      string;
  /* Group panels */
  createGroup:          string;
  groupName:            string;
  members:              string;
  deleteGroup:          string;
  groupEyebrow:         string;
  alreadyShared:        string;
  addsAllMembers:       string;
  shareWith:            string;
  /* Teach intro modal */
  introEyebrow:         string;
  introTitle:           string;
  introSubtitle:        string;
  dontShowAgain:        string;
  gotIt:                string;
  tabDescQuestions:     string;
  tabDescStudents:      string;
  tabDescShare:         string;
  tabDescAnalytics:     string;
  /* Reformulation panel */
  reformulationReady:   string;
  editReformulation:    string;
  originalLabel:        string;
  reformulatedLabel:    string;
  yourEdit:             string;
  editArrow:            string;
  accept:               string;
  /* Question editor extras */
  optionsLabel:         string;
  replaceDistractor:    string;
  pageNotSet:           string;
  loadingPdf:           string;
  pdfUnavailable:       string;
  /* Delete confirm dialog */
  deleteThisQuestion:   string;
  deleteConfirmBody:    string;
  deleteConfirmBtn:     string;
  selectCourse:         string;
}

const teach: Record<string, TeachStrings> = {

  en: {
    coursesEyebrow:       "Courses",
    loadingCourses:       "Loading courses…",
    expandList:           "Expand course list",
    collapseList:         "Collapse course list",
    tabQuestions:         "Questions",
    tabStudents:          "Students",
    tabShare:             "Share",
    tabAnalytics:         "Analytics",
    loading:              "Loading…",
    orderingPlaylist:     "Ordering playlist",
    done:                 "Done",
    cancel:               "Cancel",
    orderPlaylist:        "✎ Order playlist",
    newQuestion:          "+ New",
    playlistHint:         "Drag rows to reorder · Done saves the order",
    edit:                 "Edit",
    del:                  "Del",
    shareEmailPlaceholder: "Student email address…",
    share:                "Share",
    addStudent:           "Add student",
    export:               "Export",
    noSessionsYet:        "No sessions yet",
    remove:               "Remove",
    noQuestionsYet:       "No questions yet",
    studentWithAccess:    "student with access",
    studentsWithAccess:   "students with access",
    noStudentsYet:        "No students yet — add a student email above.",
    courseSettings:       "Course settings",
    allowDownload:        "Allow PDF download",
    allowDownloadHint:    "Students can save the course document",
    allowStudentSharing:  "Allow student sharing",
    allowStudentSharingHint: "Students you share this with can prepare and share it from Teach mode",
    visibleProgress:      "Visible progress tracking",
    visibleProgressHint:  "Students see a banner indicating their sessions are reviewed by the instructor",
    on:                   "On",
    off:                  "Off",
    invite:               "+ Invite",
    dropCsv:              "Drop a .csv of student emails",
    oneEmailPerLine:      "one email per line",
    joined:               "Joined",
    groupsLoading:        "Groups loading",
    groups:               "Groups",
    addGroup:             "+ Group",
    shared:               "Shared",
    noGroups:             "No groups yet — upload a CSV to create one.",
    selectGroupPlaceholder: "Select a group…",
    statsStudents:        "Students",
    statsSessions:        "Sessions",
    statsAvgScore:        "Avg score",
    selectGroupHint:      "Select a group to view class analytics.",
    loadingGroupAnalytics: "Loading group analytics…",
    noSessions:           "No sessions",
    weakConceptsLabel:    "Weak concepts — class",
    signalBreakdownLabel: "Signal breakdown — all sessions",
    selectQuestion:       "Select a question",
    shareSettings:        "Share settings",
    invitationLabel:      "Invitation",
    selectStudent:        "Select a student",
    clickToEdit:          "Click a question to edit, or create a new one.",
    enterEmail:           "Enter a student email above to share this course.",
    clickInvite:          "Click Invite to send bulk invitations.",
    clickStudent:         "Click a student row to inspect their progress.",
    newQ:                 "New question",
    editQ:                "Edit question",
    pdfReference:         "PDF reference",
    page:                 "Page",
    collapse:             "Collapse",
    expand:               "Expand",
    hasVisual:            "Has visual",
    yes:                  "Yes",
    no:                   "No",
    source:               "Source",
    openFullPdf:          "Open full PDF →",
    saveChanges:          "Save changes",
    createQuestion:       "Create question",
    deleteQuestion:       "Delete question",
    questionLabel:        "Question",
    explanationLabel:     "Explanation",
    functionLabel:        "Function",
    pageRefLabel:         "Page ref",
    reformulate:          "Reformulate",
    reformulating:        "Reformulating…",
    keepOriginal:         "Keep original",
    useThis:              "Use this",
    invitationPreview:    "Invitation preview",
    inviteSubject:        "You've been enrolled in",
    inviteHello:          "Hello,",
    inviteBody:           "Your professor has shared a course with you on Student Central. Click below to access your MCQ session and AI tutor.",
    inviteLink:           "→ Open Student Central",
    inviteAfter:          "Once logged in, the course will appear in your workspace automatically.",
    pasteEmails:          "Paste emails or upload CSV",
    sendInvitations:      "Send invitations",
    createGroup:          "Create group",
    groupName:            "Group name",
    members:              "Members",
    deleteGroup:          "Delete group",
    groupEyebrow:         "Group",
    alreadyShared:        "Already shared — students have access",
    addsAllMembers:       "Adds all members to this course",
    shareWith:            "Share with",
    introEyebrow:         "Faculty dashboard",
    introTitle:           "Welcome to Teach",
    introSubtitle:        "The four tabs above are your instructor toolkit. Here's what each one does:",
    dontShowAgain:        "Don't show me this again",
    gotIt:                "Got it →",
    tabDescQuestions:     "Review and edit the MCQ bank generated from your course PDF — reorder, reformulate, or add questions manually.",
    tabDescStudents:      "Manage your class roster, send bulk invitations, and track who has joined.",
    tabDescShare:         "Grant students access to your course in one click — they see it instantly in their workspace, no email needed.",
    tabDescAnalytics:     "Monitor session performance, signal breakdowns, and weak concepts across your whole class.",
    reformulationReady:   "Reformulation ready",
    editReformulation:    "Edit reformulation",
    originalLabel:        "Original",
    reformulatedLabel:    "Reformulated",
    yourEdit:             "Your edit",
    editArrow:            "Edit ↗",
    accept:               "Accept",
    optionsLabel:         "Options — click letter to mark correct",
    replaceDistractor:    "Replace",
    pageNotSet:           "Page not set",
    loadingPdf:           "Loading PDF",
    pdfUnavailable:       "PDF unavailable",
    deleteThisQuestion:   "Delete this question?",
    deleteConfirmBody:    "This removes the question from the course bank immediately.",
    deleteConfirmBtn:     "Delete",
    selectCourse:         "Select a course",
  },

  fr: {
    coursesEyebrow:       "Cours",
    loadingCourses:       "Chargement des cours…",
    expandList:           "Développer la liste",
    collapseList:         "Réduire la liste",
    tabQuestions:         "Questions",
    tabStudents:          "Étudiants",
    tabShare:             "Partager",
    tabAnalytics:         "Analytique",
    loading:              "Chargement…",
    orderingPlaylist:     "Réorganisation de la liste",
    done:                 "Terminé",
    cancel:               "Annuler",
    orderPlaylist:        "✎ Ordonner la liste",
    newQuestion:          "+ Nouveau",
    playlistHint:         "Glissez les lignes pour réorganiser · Terminé enregistre l'ordre",
    edit:                 "Modifier",
    del:                  "Suppr.",
    shareEmailPlaceholder: "Adresse e-mail de l'étudiant…",
    share:                "Partager",
    addStudent:           "Ajouter l'étudiant",
    export:               "Exporter",
    noSessionsYet:        "Aucune session pour l'instant",
    remove:               "Retirer",
    noQuestionsYet:       "Aucune question pour l'instant",
    studentWithAccess:    "étudiant avec accès",
    studentsWithAccess:   "étudiants avec accès",
    noStudentsYet:        "Aucun étudiant pour l'instant — ajoutez une adresse e-mail ci-dessus.",
    courseSettings:       "Paramètres du cours",
    allowDownload:        "Autoriser le téléchargement PDF",
    allowDownloadHint:    "Les étudiants peuvent enregistrer le document du cours",
    allowStudentSharing:  "Autoriser le partage par les étudiants",
    allowStudentSharingHint: "Les étudiants avec accès peuvent le préparer et le partager depuis le mode enseignant",
    visibleProgress:      "Suivi de progression visible",
    visibleProgressHint:  "Les étudiants voient une bannière indiquant que leurs sessions sont examinées par l'enseignant",
    on:                   "Activé",
    off:                  "Désactivé",
    invite:               "+ Inviter",
    dropCsv:              "Déposez un fichier .csv d'adresses e-mail",
    oneEmailPerLine:      "une adresse par ligne",
    joined:               "Rejoint le",
    groupsLoading:        "Chargement des groupes",
    groups:               "Groupes",
    addGroup:             "+ Groupe",
    shared:               "Partagé",
    noGroups:             "Aucun groupe pour l'instant — importez un CSV pour en créer un.",
    selectGroupPlaceholder: "Sélectionner un groupe…",
    statsStudents:        "Étudiants",
    statsSessions:        "Sessions",
    statsAvgScore:        "Score moyen",
    selectGroupHint:      "Sélectionnez un groupe pour voir les statistiques de la classe.",
    loadingGroupAnalytics: "Chargement des statistiques du groupe…",
    noSessions:           "Aucune session",
    weakConceptsLabel:    "Concepts fragiles — classe",
    signalBreakdownLabel: "Répartition des signaux — toutes les sessions",
    selectQuestion:       "Sélectionner une question",
    shareSettings:        "Paramètres de partage",
    invitationLabel:      "Invitation",
    selectStudent:        "Sélectionner un étudiant",
    clickToEdit:          "Cliquez sur une question pour la modifier, ou créez-en une nouvelle.",
    enterEmail:           "Saisissez l'e-mail d'un étudiant ci-dessus pour partager ce cours.",
    clickInvite:          "Cliquez sur Inviter pour envoyer des invitations groupées.",
    clickStudent:         "Cliquez sur la ligne d'un étudiant pour consulter sa progression.",
    newQ:                 "Nouvelle question",
    editQ:                "Modifier la question",
    pdfReference:         "Référence PDF",
    page:                 "Page",
    collapse:             "Réduire",
    expand:               "Développer",
    hasVisual:            "Contient un visuel",
    yes:                  "Oui",
    no:                   "Non",
    source:               "Source",
    openFullPdf:          "Ouvrir le PDF complet →",
    saveChanges:          "Enregistrer les modifications",
    createQuestion:       "Créer la question",
    deleteQuestion:       "Supprimer la question",
    questionLabel:        "Question",
    explanationLabel:     "Explication",
    functionLabel:        "Fonction",
    pageRefLabel:         "Page de référence",
    reformulate:          "Reformuler",
    reformulating:        "Reformulation…",
    keepOriginal:         "Garder l'original",
    useThis:              "Utiliser cette version",
    invitationPreview:    "Aperçu de l'invitation",
    inviteSubject:        "Vous avez été inscrit(e) à",
    inviteHello:          "Bonjour,",
    inviteBody:           "Votre enseignant a partagé un cours avec vous sur Student Central. Cliquez ci-dessous pour accéder à votre session de QCM et à l'IA tuteur.",
    inviteLink:           "→ Ouvrir Student Central",
    inviteAfter:          "Une fois connecté(e), le cours apparaîtra automatiquement dans votre espace de travail.",
    pasteEmails:          "Collez les e-mails ou importez un CSV",
    sendInvitations:      "Envoyer les invitations",
    createGroup:          "Créer un groupe",
    groupName:            "Nom du groupe",
    members:              "Membres",
    deleteGroup:          "Supprimer le groupe",
    groupEyebrow:         "Groupe",
    alreadyShared:        "Déjà partagé — les étudiants ont accès",
    addsAllMembers:       "Ajoute tous les membres à ce cours",
    shareWith:            "Partager avec",
    introEyebrow:         "Tableau de bord enseignant",
    introTitle:           "Bienvenue dans Teach",
    introSubtitle:        "Les quatre onglets ci-dessus sont votre boîte à outils d'enseignant. Voici ce que fait chacun :",
    dontShowAgain:        "Ne plus afficher ce message",
    gotIt:                "Compris →",
    tabDescQuestions:     "Consultez et modifiez la banque de QCM générée à partir de votre PDF — réorganisez, reformulez ou ajoutez des questions manuellement.",
    tabDescStudents:      "Gérez votre liste de classe, envoyez des invitations groupées et suivez les inscriptions.",
    tabDescShare:         "Donnez aux étudiants accès à votre cours en un clic — ils le voient instantanément dans leur espace de travail, sans e-mail nécessaire.",
    tabDescAnalytics:     "Suivez les performances des sessions, la répartition des signaux et les concepts fragiles dans toute votre classe.",
    reformulationReady:   "Reformulation prête",
    editReformulation:    "Modifier la reformulation",
    originalLabel:        "Original",
    reformulatedLabel:    "Reformulé",
    yourEdit:             "Votre modification",
    editArrow:            "Modifier ↗",
    accept:               "Accepter",
    optionsLabel:         "Options — cliquer sur la lettre pour marquer la bonne réponse",
    replaceDistractor:    "Remplacer",
    pageNotSet:           "Page non définie",
    loadingPdf:           "Chargement du PDF",
    pdfUnavailable:       "PDF indisponible",
    deleteThisQuestion:   "Supprimer cette question ?",
    deleteConfirmBody:    "Cette action supprime immédiatement la question de la banque.",
    deleteConfirmBtn:     "Supprimer",
    selectCourse:         "Sélectionner un cours",
  },

};

export function teachT(lang: string): TeachStrings {
  return teach[lang] ?? teach.en;
}
