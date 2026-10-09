// Contenu des études de cas. Chaque projet génère une page /projets/<slug>/
// (voir scripts/build-pages.mjs). Les chiffres viennent des dépôts GitHub.

export const projects = [
  /* ------------------------------------------------------------------ */
  {
    slug: 'osanotch',
    name: 'OsaNotch',
    letter: 'N',
    color: '#c4b5fd',
    deep: '#7c5cf0',
    soft: '#f1edff',
    kicker: 'App macOS native · Swift',
    tagline: 'Ton encoche, <em>enfin vivante.</em>',
    summary: "OsaNotch transforme l'encoche du MacBook en petite île dynamique. Au survol, elle s'ouvre avec une animation à ressort et regroupe la musique et ses paroles, une étagère de fichiers, les réglages système et toutes les apps OsaLabs. Au centre, une mascotte qui suit ton curseur des yeux.",
    meta: {
      role: 'Conception, design et développement',
      period: '7 → 9 octobre 2026',
      status: 'Disponible en .dmg, mises à jour automatiques',
    },
    stack: ['Swift', 'SwiftUI', 'AppKit', 'WebKit', 'IOKit', 'EventKit', 'Accessibility API'],
    links: [
      { label: 'Télécharger le .dmg', url: 'https://notch.osalabs.fr', primary: true },
      { label: 'Voir le code', url: 'https://github.com/osayanis/osanotch-native' },
    ],
    stats: [
      { n: '44', label: 'commits en 3 jours' },
      { n: '4 379', label: 'lignes de Swift' },
      { n: '23', label: 'fichiers source' },
      { n: '2', label: 'versions : Electron, puis natif' },
    ],
    problem: {
      quote: "L'encoche, c'est 3 cm de vide en plein milieu de l'écran. Je voulais qu'elle serve à quelque chose.",
      text: [
        "Sur un MacBook récent, l'encoche de la caméra mange le centre de la barre des menus. Des apps comme NotchNook ont montré qu'on pouvait en faire une zone utile, mais je voulais la mienne : connectée à mes propres outils, et avec un peu de personnalité.",
        "Le premier prototype, le matin du 7 octobre, était une app Electron : une fenêtre transparente plein écran qui dessinait dans la bande de l'encoche. Ça marchait, mais l'interrogation de macOS par <code>osascript</code> s'accumulait et l'app pesait lourd pour ce qu'elle faisait. Le soir même, j'ai tout réécrit en Swift natif.",
      ],
    },
    visuals: [
      { type: 'image', src: '/media/osanotch/banner.webp', alt: "Bannière d'OsaNotch : la mascotte dans l'encoche", caption: 'La bannière du projet, avec la mascotte dans son encoche.', wide: true },
      { type: 'browser', src: '/media/osanotch/site.webp', url: 'notch.osalabs.fr', alt: "Page de téléchargement d'OsaNotch", caption: 'Le site de téléchargement, qui sert aussi les mises à jour automatiques.' },
    ],
    how: {
      intro: "OsaNotch est une seule app SwiftUI qui va chercher ses données à plein d'endroits de macOS, sans jamais faire de polling lourd.",
      steps: [
        { t: "Une fenêtre au-dessus de la barre des menus", d: "Un <code>NSPanel</code> sans bordure, placé juste au-dessus du niveau de la barre des menus. Hors de l'île, les clics passent au travers." },
        { t: 'Un survol qui réveille tout', d: "Un moniteur global d'événements détecte la souris près de l'encoche. L'île s'ouvre avec un ressort SwiftUI, et la mascotte, dessinée dans un <code>Canvas</code>, se réveille." },
        { t: 'Les vraies données du Mac', d: "Musique via AppleScript, pochettes via l'API iTunes, paroles via LRCLIB, batterie via IOKit, agenda via EventKit, luminosité via DisplayServices." },
        { t: 'Un HUD qui remplace celui de macOS', d: "Un <code>CGEventTap</code> intercepte les touches volume et luminosité : les gros carrés gris disparaissent, une barre fine glisse sous l'encoche." },
        { t: 'Les apps OsaLabs embarquées', d: "Une <code>WKWebView</code> invisible charge les pages « pont » d'OsaDrop, OsaCast et OsaParty. Le notch utilise donc exactement le même moteur WebRTC que les sites." },
      ],
      diagram: {
        w: 820, h: 380,
        nodes: [
          { id: 'app', x: 410, y: 190, w: 200, h: 84, label: 'OsaNotch', sub: 'SwiftUI + AppKit', c: '#c4b5fd' },
          { id: 'mac', x: 130, y: 70, w: 210, h: 72, label: 'macOS', sub: 'AppleScript · IOKit · EventKit', c: '#e5e7eb' },
          { id: 'ax', x: 130, y: 310, w: 210, h: 72, label: 'Accessibilité', sub: 'état des apps d\'IA', c: '#fde68a' },
          { id: 'tap', x: 690, y: 70, w: 210, h: 72, label: 'CGEventTap', sub: 'volume & luminosité', c: '#a7e8bd' },
          { id: 'web', x: 690, y: 310, w: 210, h: 72, label: 'WKWebView pont', sub: 'WebRTC OsaLabs', c: '#93c5fd' },
          { id: 'api', x: 410, y: 40, w: 190, h: 56, label: 'iTunes · LRCLIB', sub: 'pochettes & paroles', c: '#f3a6cf' },
        ],
        edges: [
          { from: 'mac', to: 'app', label: 'musique, batterie' },
          { from: 'ax', to: 'app', label: 'IA en cours ?' },
          { from: 'tap', to: 'app', label: 'touches' },
          { from: 'app', to: 'web', label: 'fichiers, écran', both: true },
          { from: 'api', to: 'app' },
        ],
      },
    },
    demo: {
      kind: 'notch',
      title: "Survole l'encoche",
      intro: "Une reproduction simplifiée de l'île. Survole-la, change d'onglet, glisse un fichier dessus ou touche au volume.",
    },
    challenges: [
      {
        title: 'Dessiner au-dessus de la barre des menus',
        problem: "Une fenêtre classique passe sous la barre des menus, et une fenêtre trop haute vole le focus des autres apps.",
        solution: "J'ai testé plusieurs niveaux de fenêtre (pleine largeur, économiseur d'écran…) avant de retenir <code>mainMenuWindow + 3</code>, avec <code>acceptsFirstMouse</code> pour que le premier clic réagisse.",
      },
      {
        title: 'Ne jamais bloquer le Mac',
        problem: "Une fenêtre posée au-dessus de tout qui garde le focus peut rendre l'ordinateur inutilisable.",
        solution: "Un correctif prioritaire : Échap referme toujours l'île, plus aucun vol de focus en boucle, et les clics traversent tout ce qui n'est pas l'île.",
      },
      {
        title: "Savoir quand une IA a fini, sans API",
        problem: "Lire la barre d'état des outils donnait des faux positifs, et le scan figeait l'interface.",
        solution: "Détection par signaux propres à une génération en cours, confirmée par 3 relevés de suite (6 s), et scan déplacé sur un thread d'arrière-plan.",
      },
      {
        title: 'Réutiliser plutôt que réécrire',
        problem: "Ma première version native d'OsaCast utilisait une autre bibliothèque WebRTC et ne parlait pas au site.",
        solution: "Une page « pont » chargée dans une WebView : un seul moteur pour le web et le Mac, donc tout est interopérable.",
      },
    ],
    journal: [
      { d: '7 oct · 10h09', t: 'Prototype Electron', x: 'Overlay transparent avec de vraies données : musique, pochette, batteries, agenda.' },
      { d: '7 oct · 11h10', t: 'La mascotte prend vie', x: 'Yeux qui suivent le curseur, respiration, clignements, émotions.' },
      { d: '7 oct · 18h34', t: 'Réécriture en Swift natif', x: "NSPanel dans l'encoche, mascotte dessinée en Canvas SwiftUI." },
      { d: '8 oct · 08h32', t: 'Correctif anti-blocage', x: 'Échap referme toujours, plus de vol de focus.' },
      { d: '8 oct · 09h05', t: 'Moteur OsaDrop unifié', x: 'Pont WebRTC natif via une WebView qui réutilise le site.' },
      { d: '8 oct · 15h43', t: 'HUD volume & luminosité', x: "Une barre blanche sous l'encoche, l'affichage natif supprimé." },
      { d: '8 oct · 16h33', t: 'Paroles animées', x: 'Lecteur compact avec défilement des paroles façon Apple Music.' },
      { d: '8 oct · 21h58', t: 'Mises à jour automatiques', x: 'L\'app lit un manifeste sur mon serveur et se met à jour en un clic.' },
      { d: '9 oct · 08h53', t: 'Étagère & installateur', x: 'Presse-papier de fichiers, mode cinéma OsaCast, icône et DMG.' },
      { d: '9 oct · 14h09', t: 'Pont OsaParty', x: 'Le notch envoie la position de lecture au salon web pour synchroniser les paroles.' },
    ],
    next: [
      "Notariser l'app auprès d'Apple pour supprimer le « clic droit → Ouvrir » au premier lancement.",
      'Rendre les modules activables un par un dans les réglages.',
      "Ouvrir une petite API locale pour que d'autres outils puissent afficher leurs notifications dans l'île.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'osaparty',
    name: 'OsaParty',
    letter: 'P',
    color: '#f3a6cf',
    deep: '#d6408e',
    soft: '#fdeef6',
    kicker: 'App web temps réel · Next.js + Socket.io',
    tagline: 'La même chanson, <em>à la seconde près.</em>',
    summary: "OsaParty crée des salons d'écoute partagée. L'hôte diffuse depuis son Mac, les invités rejoignent avec un code ou un QR code et suivent la même musique en direct, avec les paroles synchronisées, un chat, des réactions, un blind test et un récap de fin de soirée.",
    meta: {
      role: 'Développé à deux, avec pirrokin',
      period: '1 → 9 octobre 2026',
      status: 'En ligne',
    },
    stack: ['Next.js', 'React', 'Socket.io', 'Python', 'AppleScript', 'iTunes Search API', 'LRCLIB'],
    links: [
      { label: 'Ouvrir OsaParty', url: 'https://osaparty.osalabs.fr', primary: true },
      { label: 'Voir le code', url: 'https://github.com/osayanis/osaparty' },
    ],
    stats: [
      { n: '22', label: 'commits' },
      { n: '2 247', label: 'lignes de code' },
      { n: '13', label: "types d'événements temps réel" },
      { n: '6', label: 'chiffres pour rejoindre un salon' },
    ],
    problem: {
      quote: "Apple réserve son API musicale aux comptes développeur payants. On a contourné le problème par le Mac.",
      text: [
        "L'idée : écouter de la musique ensemble à distance, comme si on était dans la même pièce. Le problème : MusicKit, l'API web d'Apple Music, demande un compte développeur payant.",
        "La solution ressemble au « Rich Presence » de Discord. Un petit pont tourne sur le Mac de l'hôte : il lit l'état de l'app Musique (titre, position, file d'attente) et l'envoie au serveur. Les invités n'ont besoin que d'un navigateur. Depuis, OsaNotch peut jouer ce rôle de pont nativement.",
      ],
    },
    visuals: [
      { type: 'browser', src: '/media/osaparty/room.webp', url: 'osaparty.osalabs.fr/room', alt: "Un salon OsaParty prêt, en attente d'un Mac", caption: "Un salon tout juste créé : la mascotte attend qu'un Mac diffuse.", wide: true },
      { type: 'browser', src: '/media/osaparty/landing.webp', url: 'osaparty.osalabs.fr', alt: "Page d'accueil d'OsaParty", caption: 'Créer ou rejoindre un salon, en deux clics.' },
      { type: 'phone', src: '/media/osaparty/mobile.webp', alt: 'OsaParty sur mobile', caption: "Pensé pour rejoindre depuis un téléphone." },
    ],
    how: {
      intro: "Le serveur ne fait que relayer. Toute l'intelligence musicale vient du Mac de l'hôte.",
      steps: [
        { t: 'Un salon façon Kahoot', d: "L'hôte crée un salon : un code à 6 chiffres et un QR code s'affichent à l'écran." },
        { t: "Le pont lit l'app Musique", d: "Un script Python pilote Apple Music en AppleScript (ou OsaNotch le fait nativement) et envoie l'état de lecture au serveur." },
        { t: 'Socket.io relaie à tout le monde', d: "Le serveur diffuse le morceau, la position et la file d'attente à tous les invités du salon." },
        { t: 'Le navigateur habille le tout', d: "Pochette en 600 × 600 via l'API iTunes, paroles synchronisées via LRCLIB, fond teinté par la couleur dominante de la pochette." },
        { t: 'La soirée prend vie', d: "Chat, réactions, vote pour passer un titre, blind test, contrôles de l'hôte, et un « Wrapped » à la fin." },
      ],
      diagram: {
        w: 820, h: 360,
        nodes: [
          { id: 'music', x: 110, y: 180, w: 170, h: 72, label: 'Apple Music', sub: "sur le Mac de l'hôte", c: '#f9a8a8' },
          { id: 'bridge', x: 320, y: 180, w: 160, h: 72, label: 'Pont', sub: 'Python ou OsaNotch', c: '#fde68a' },
          { id: 'srv', x: 540, y: 180, w: 160, h: 72, label: 'Serveur', sub: 'Socket.io', c: '#e5e7eb' },
          { id: 'g1', x: 730, y: 70, w: 140, h: 60, label: 'Invité', sub: 'navigateur', c: '#f3a6cf' },
          { id: 'g2', x: 730, y: 180, w: 140, h: 60, label: 'Invité', sub: 'navigateur', c: '#f3a6cf' },
          { id: 'g3', x: 730, y: 290, w: 140, h: 60, label: 'Invité', sub: 'mobile', c: '#f3a6cf' },
          { id: 'apis', x: 540, y: 320, w: 170, h: 56, label: 'iTunes · LRCLIB', sub: 'pochettes, paroles', c: '#c4b5fd' },
        ],
        edges: [
          { from: 'music', to: 'bridge', label: 'AppleScript', both: true },
          { from: 'bridge', to: 'srv', label: 'bridge-state' },
          { from: 'srv', to: 'g1' },
          { from: 'srv', to: 'g2' },
          { from: 'srv', to: 'g3' },
          { from: 'apis', to: 'g3', dashed: true },
        ],
      },
    },
    demo: {
      kind: 'party',
      title: 'Teste la synchro',
      intro: "L'hôte diffuse, trois invités écoutent avec des connexions différentes. Coupe la synchronisation pour voir les écarts apparaître, et envoie des réactions.",
    },
    challenges: [
      {
        title: 'Une API Apple payante',
        problem: 'MusicKit sur le web demande un compte développeur Apple payant.',
        solution: "Un pont local sur le Mac de l'hôte, en Python et AppleScript, qui lit directement l'app Musique.",
      },
      {
        title: "La file d'attente invisible",
        problem: "Apple n'expose pas la fonction « Lire ensuite » aux scripts.",
        solution: "Lire la playlist en cours : l'hôte lance sa musique depuis une playlist, et le site affiche les 10 titres suivants.",
      },
      {
        title: 'Des paroles au bon moment',
        problem: "Chaque invité reçoit l'état avec un délai différent.",
        solution: "L'hôte envoie la position et la durée du morceau, et chaque navigateur cale les paroles LRCLIB sur cette position.",
      },
      {
        title: 'Un serveur modeste',
        problem: "L'optimisation d'images de Next.js coûtait trop cher sur un petit VPS.",
        solution: 'Optimisation désactivée, pochettes servies directement par Apple en haute définition.',
      },
    ],
    journal: [
      { d: '1 oct · 11h24', t: 'Première version', x: 'Le site et le Mac Bridge fonctionnent ensemble.' },
      { d: '1 oct · 11h36', t: 'Installable', x: "Le site devient une PWA, utilisable comme un petit widget." },
      { d: '1 oct · 11h43', t: 'App de barre des menus', x: 'Le pont devient une vraie app macOS.' },
      { d: '1 oct · 13h41', t: 'Grosse mise à jour', x: 'Chat, paroles, vote pour passer, volume et support de Spotify.' },
      { d: '1 oct · 13h59', t: 'Look Apple Music', x: 'Paroles synchronisées et fonds dynamiques.' },
      { d: '1 oct · 14h03', t: 'Blind test & Wrapped', x: 'Un mode quiz et un récap de soirée.' },
      { d: '2 oct · 10h47', t: "Contrôles de l'hôte", x: 'Verrouiller le salon, exclure, exporter la playlist.' },
      { d: '5 oct · 08h54', t: 'ListenParty devient OsaParty', x: "Le projet rejoint l'écosystème OsaLabs." },
      { d: '9 oct · 14h09', t: 'Salon refait', x: 'Nouvelle interface, et OsaNotch comme pont natif.' },
    ],
    next: [
      'Un mode « DJ tournant » où chaque invité ajoute un titre à son tour.',
      "Un historique des soirées pour retrouver ce qu'on a écouté.",
    ],
    credits: 'Projet mené avec <a href="https://github.com/pirrokin" target="_blank" rel="noopener">pirrokin</a>.',
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'osadrop',
    name: 'OsaDrop',
    letter: 'D',
    color: '#93c5fd',
    deep: '#3b82f6',
    soft: '#ecf4ff',
    kicker: 'Transfert de fichiers · WebRTC',
    tagline: 'Un code, un fichier, <em>zéro serveur.</em>',
    summary: "OsaDrop envoie un fichier d'un appareil à l'autre avec un simple code à 6 caractères ou un QR code. Le fichier va directement d'un navigateur à l'autre : il ne passe jamais par un serveur et n'est stocké nulle part.",
    meta: {
      role: 'Conception et développement',
      period: '5 → 9 octobre 2026',
      status: 'En ligne',
    },
    stack: ['WebRTC', 'Next.js', 'React', 'TypeScript', 'Socket.io', 'Nginx', 'PM2'],
    links: [
      { label: 'Ouvrir OsaDrop', url: 'https://osadrop.osalabs.fr', primary: true },
      { label: 'Voir le code', url: 'https://github.com/osayanis/osadrop' },
    ],
    stats: [
      { n: '689', label: 'lignes de code' },
      { n: '64 Ko', label: 'par morceau envoyé' },
      { n: '1 Mo', label: 'de tampon maximum' },
      { n: '0', label: 'octet stocké sur le serveur' },
    ],
    problem: {
      quote: "Envoyer une photo de mon téléphone à un PC qui n'est pas le mien ne devrait pas demander un compte.",
      text: [
        "AirDrop ne marche qu'entre appareils Apple. Les autres solutions passent par un cloud : on téléverse, on attend, on télécharge, et le fichier reste quelque part.",
        "OsaDrop prend le chemin le plus court : les deux navigateurs se connectent directement en WebRTC. Le serveur ne sert qu'à les présenter l'un à l'autre, puis il n'entend plus parler du fichier.",
      ],
    },
    visuals: [
      { type: 'browser', src: '/media/osadrop/code.webp', url: 'osadrop.osalabs.fr', alt: 'OsaDrop affiche un code et un QR code', caption: "L'expéditeur reçoit un code et un QR code à partager.", wide: true },
      { type: 'browser', src: '/media/osadrop/landing.webp', url: 'osadrop.osalabs.fr', alt: "Accueil d'OsaDrop", caption: 'Envoyer ou recevoir, sur un seul écran.' },
      { type: 'phone', src: '/media/osadrop/mobile.webp', alt: 'OsaDrop sur mobile', caption: 'Côté téléphone, on scanne le QR code.' },
    ],
    how: {
      intro: 'Deux phases : une courte présentation par le serveur, puis une conversation directe entre les deux appareils.',
      steps: [
        { t: 'Un salon à deux', d: "L'expéditeur génère un code. Le serveur Socket.io crée un salon qui n'accepte que deux appareils." },
        { t: 'La signalisation', d: "Les deux navigateurs échangent leur offre, leur réponse SDP et leurs candidats ICE via le serveur. Un serveur STUN les aide à se trouver." },
        { t: 'Le canal direct', d: "Un DataChannel WebRTC s'ouvre entre eux, chiffré par défaut. Le serveur n'est plus utilisé." },
        { t: 'Envoi par morceaux', d: "Le fichier est découpé en morceaux de 64 Ko. Si plus de 1 Mo attend dans le tampon, l'envoi fait une pause jusqu'à ce qu'il se vide." },
        { t: 'Reconstitution', d: "Le destinataire assemble les morceaux, suit la progression, puis le fichier se télécharge tout seul." },
      ],
      diagram: {
        w: 820, h: 340,
        nodes: [
          { id: 'a', x: 130, y: 220, w: 190, h: 80, label: 'Expéditeur', sub: 'navigateur', c: '#93c5fd' },
          { id: 'b', x: 690, y: 220, w: 190, h: 80, label: 'Destinataire', sub: 'navigateur', c: '#93c5fd' },
          { id: 's', x: 410, y: 70, w: 210, h: 72, label: 'Serveur', sub: 'Socket.io · signalisation', c: '#e5e7eb' },
          { id: 'stun', x: 410, y: 300, w: 170, h: 56, label: 'STUN', sub: 'trouver son IP', c: '#fde68a' },
        ],
        edges: [
          { from: 'a', to: 's', label: 'offre, ICE', dashed: true, both: true },
          { from: 's', to: 'b', label: 'réponse, ICE', dashed: true, both: true },
          { from: 'a', to: 'b', label: 'DataChannel : le fichier', thick: true },
          { from: 'stun', to: 'a', dashed: true },
          { from: 'stun', to: 'b', dashed: true },
        ],
      },
    },
    demo: {
      kind: 'drop',
      title: 'Regarde un fichier voyager',
      intro: "Une simulation du vrai algorithme : le fichier part en morceaux de 64 Ko, et l'envoi s'arrête dès que le tampon dépasse 1 Mo. Décoche le contrôle de débit pour voir ce qui se passait avant le correctif.",
    },
    challenges: [
      {
        title: 'Des closures React périmées',
        problem: "Les gestionnaires Socket.io gardaient une ancienne valeur du code de salon : les messages partaient dans le vide.",
        solution: 'Les valeurs utilisées par les callbacks passent par des refs React, toujours à jour.',
      },
      {
        title: 'Le tampon qui déborde',
        problem: "Envoyer un gros fichier d'un coup saturait la file du DataChannel et coupait le transfert.",
        solution: "Contrôle de débit avec <code>bufferedAmount</code> et l'événement <code>bufferedamountlow</code> : on n'envoie que quand il y a de la place.",
      },
      {
        title: 'Des états qui se croisent',
        problem: "L'interface annonçait « connecté » avant que le canal soit vraiment ouvert.",
        solution: "L'interface ne suit plus que l'état réel du canal (<code>readyState</code>), avec un délai de garde en cas de silence.",
      },
    ],
    journal: [
      { d: '5 oct · 08h16', t: 'Première implémentation WebRTC', x: 'Salon, signalisation et DataChannel.' },
      { d: '5 oct · 08h26', t: 'Quatre correctifs en 20 minutes', x: 'Closures périmées, courses entre états, débordement de la file.' },
      { d: '5 oct · 16h13', t: 'Transfert robuste', x: 'Délai de garde sur le flux et scanner de QR code.' },
      { d: '8 oct · 09h06', t: 'Pont OsaNotch', x: "Une page qui expose le même moteur à l'app macOS." },
      { d: '9 oct · 11h55', t: 'Documentation', x: 'README complet avec fonctionnement, déploiement et limites.' },
    ],
    next: [
      'Ajouter un serveur TURN pour les réseaux qui bloquent les connexions directes.',
      "Écrire le fichier en flux sur le disque pour ne plus dépendre de la mémoire du destinataire.",
      "Envoyer plusieurs fichiers d'un coup et reprendre un transfert interrompu.",
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'osacast',
    name: 'OsaCast',
    letter: 'C',
    color: '#a5b4fc',
    deep: '#6366f1',
    soft: '#eef0ff',
    kicker: "Partage d'écran · WebRTC",
    tagline: 'Ton écran chez un ami, <em>en un clic.</em>',
    summary: "OsaCast partage ton écran avec quelqu'un d'autre, directement depuis le navigateur. Pas de compte, rien à installer : un code ou un QR code, et le flux vidéo part en pair-à-pair.",
    meta: {
      role: 'Conception et développement',
      period: '5 → 8 octobre 2026',
      status: 'En ligne',
    },
    stack: ['WebRTC', 'getDisplayMedia', 'Next.js', 'React', 'Socket.io'],
    links: [{ label: 'Ouvrir OsaCast', url: 'https://osacast.osalabs.fr', primary: true }],
    stats: [
      { n: '770', label: 'lignes de code' },
      { n: '1', label: 'clic pour diffuser' },
      { n: '2', label: 'formats gérés : portrait et paysage' },
      { n: '0', label: 'logiciel à installer' },
    ],
    problem: {
      quote: "Montrer son écran à un pote ne devrait pas demander de créer une réunion.",
      text: [
        "Pour partager un écran, on passe souvent par un outil de visio complet : compte, lien de réunion, micro, caméra… alors qu'on veut juste montrer quelque chose.",
        "OsaCast réutilise la mécanique d'OsaDrop, mais pour un flux vidéo : le navigateur capture l'écran avec <code>getDisplayMedia</code> et l'envoie directement au spectateur.",
      ],
    },
    visuals: [
      { type: 'browser', src: '/media/osacast/landing.webp', url: 'osacast.osalabs.fr', alt: "Accueil d'OsaCast", caption: 'Créer un cast ou en rejoindre un, par code ou QR code.', wide: true },
    ],
    how: {
      intro: "La même poignée de main WebRTC qu'OsaDrop, mais pour de la vidéo au lieu de données.",
      steps: [
        { t: "Capture de l'écran", d: "Le diffuseur choisit un écran, une fenêtre ou un onglet avec <code>getDisplayMedia</code>, son compris." },
        { t: 'Un code de session', d: 'Le serveur crée une session, et le spectateur la rejoint par code ou QR code.' },
        { t: 'La poignée de main', d: 'Offre, réponse et candidats ICE transitent par Socket.io.' },
        { t: 'Le flux direct', d: "La vidéo part en pair-à-pair. Le lecteur s'adapte au format du flux, portrait ou paysage, et passe en plein écran." },
      ],
      diagram: {
        w: 820, h: 300,
        nodes: [
          { id: 'a', x: 130, y: 190, w: 200, h: 80, label: 'Diffuseur', sub: 'getDisplayMedia', c: '#a5b4fc' },
          { id: 'b', x: 690, y: 190, w: 200, h: 80, label: 'Spectateur', sub: 'lecteur vidéo', c: '#a5b4fc' },
          { id: 's', x: 410, y: 60, w: 210, h: 72, label: 'Serveur', sub: 'signalisation', c: '#e5e7eb' },
          { id: 'n', x: 130, y: 60, w: 170, h: 56, label: 'OsaNotch', sub: 'peut diffuser aussi', c: '#c4b5fd' },
        ],
        edges: [
          { from: 'a', to: 's', dashed: true, both: true },
          { from: 's', to: 'b', dashed: true, both: true },
          { from: 'a', to: 'b', label: 'flux vidéo + audio', thick: true },
          { from: 'n', to: 'a', dashed: true },
        ],
      },
    },
    demo: {
      kind: 'handshake',
      title: 'La poignée de main WebRTC, pas à pas',
      intro: "Avant la première image, les deux navigateurs doivent se mettre d'accord. Avance étape par étape pour voir qui envoie quoi.",
    },
    challenges: [
      {
        title: 'Tous les formats d\'écran',
        problem: "Un écran de téléphone en portrait s'affichait déformé ou minuscule.",
        solution: "Le conteneur vidéo suit le ratio réel du flux, en portrait comme en paysage.",
      },
      {
        title: 'Un flux qui survit',
        problem: "Dans OsaNotch, replier l'île coupait le partage.",
        solution: "Le flux vit dans la WebView pont, indépendamment de l'interface : il continue quand le notch se replie, et un mode cinéma l'agrandit.",
      },
    ],
    journal: [
      { d: '5 oct · 16h14', t: 'Version complète', x: 'Socket.io, WebRTC robuste et interface en verre dépoli.' },
      { d: '5 oct · 16h37', t: 'Portrait et paysage', x: 'Le lecteur suit le ratio du flux.' },
      { d: '8 oct · 14h18', t: 'Pont OsaNotch', x: "Le notch peut diffuser et regarder avec le même moteur." },
    ],
    next: ['Un pointeur partagé pour montrer un endroit précis de l\'écran.', 'Plusieurs spectateurs pour une même diffusion.'],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'osaboard',
    name: 'OsaBoard',
    letter: 'B',
    color: '#5eead4',
    deep: '#0d9488',
    soft: '#e8fbf7',
    kicker: 'Canvas collaboratif · React Flow + WebRTC',
    tagline: 'Un tableau infini, <em>à plusieurs.</em>',
    summary: "OsaBoard est un espace de travail collaboratif en temps réel. On pose des blocs sur un canvas infini (texte, code, Kanban, sondage, carte, base de données…), on les relie entre eux, et chacun voit les curseurs des autres bouger en direct.",
    meta: {
      role: 'Conception et développement',
      period: '5 → 7 octobre 2026',
      status: 'En ligne',
    },
    stack: ['React Flow', 'WebRTC', 'Next.js', 'Socket.io', 'sql.js'],
    links: [{ label: 'Ouvrir OsaBoard', url: 'https://osaboard.osalabs.fr', primary: true }],
    stats: [
      { n: '18', label: 'types de blocs' },
      { n: '31', label: 'commits en une nuit' },
      { n: '2 178', label: 'lignes de code' },
      { n: '16 Ko', label: 'par message découpé' },
    ],
    problem: {
      quote: "Au départ, c'était un tableau blanc. Au bout de quelques heures, c'était devenu un outil de travail.",
      text: [
        "La première version d'OsaBoard était un simple tableau blanc partagé en WebRTC. Deux heures plus tard, je l'ai réécrite autour de React Flow : au lieu de traits, on manipule des blocs qu'on peut relier.",
        "Le reste de la nuit a servi à ajouter des blocs utiles : du code, du Markdown, une checklist, un Kanban, un sondage, un minuteur, une carte, un agenda, la météo, et même une petite base SQL qui tourne dans le navigateur.",
      ],
    },
    visuals: [
      { type: 'image', src: '/media/osaboard/toolbar.webp', alt: "Barre d'outils d'OsaBoard avec les types de blocs", caption: "La barre d'outils : chaque icône ajoute un type de bloc.", wide: true, dark: true },
      { type: 'browser', src: '/media/osaboard/landing.webp', url: 'osaboard.osalabs.fr', alt: "Accueil d'OsaBoard", caption: 'Créer une room, en importer une, ou rejoindre par code.' },
    ],
    how: {
      intro: 'Chaque participant garde une copie du tableau. Les changements voyagent directement entre les navigateurs.',
      steps: [
        { t: 'Une room et un code', d: 'Le serveur Socket.io ne sert qu\'à présenter les participants.' },
        { t: 'Un maillage WebRTC', d: 'Chaque participant ouvre un DataChannel avec chacun des autres : un vrai réseau à N personnes, sans serveur central.' },
        { t: 'Des messages découpés', d: "Les gros contenus (images compressées, tableaux) sont découpés en morceaux de 16 Ko et réassemblés à l'arrivée." },
        { t: 'Des blocs React Flow', d: '18 types de nœuds personnalisés, reliés par des liens animés. Les curseurs de chacun s\'affichent en direct.' },
        { t: 'Export et import', d: 'Un tableau entier se sauvegarde dans un fichier et se rouvre dans une nouvelle room.' },
      ],
      diagram: {
        w: 820, h: 360,
        nodes: [
          { id: 'a', x: 170, y: 90, w: 170, h: 70, label: 'Alice', sub: 'navigateur', c: '#5eead4' },
          { id: 'b', x: 650, y: 90, w: 170, h: 70, label: 'Bob', sub: 'navigateur', c: '#5eead4' },
          { id: 'c', x: 170, y: 290, w: 170, h: 70, label: 'Chloé', sub: 'mobile', c: '#5eead4' },
          { id: 'd', x: 650, y: 290, w: 170, h: 70, label: 'Dan', sub: 'navigateur', c: '#5eead4' },
          { id: 's', x: 410, y: 190, w: 170, h: 64, label: 'Serveur', sub: 'présentation', c: '#e5e7eb' },
        ],
        edges: [
          { from: 'a', to: 'b', both: true }, { from: 'c', to: 'd', both: true },
          { from: 'a', to: 'c', both: true }, { from: 'b', to: 'd', both: true },
          { from: 'a', to: 's', dashed: true }, { from: 'd', to: 's', dashed: true },
        ],
      },
    },
    demo: {
      kind: 'board',
      title: 'Bouge les blocs',
      intro: "Une version miniature du canvas : déplace les blocs, ajoutes-en, et regarde les liens suivre.",
    },
    challenges: [
      {
        title: 'Des boucles de rendu infinies',
        problem: "Synchroniser l'état React Flow avec le réseau dans un <code>useEffect</code> relançait le rendu à l'infini.",
        solution: "Les mises à jour réseau passent par des fonctions de mise à jour ciblées, sans effet qui se déclenche lui-même.",
      },
      {
        title: 'Les candidats ICE perdus',
        problem: 'Certaines connexions ne s\'établissaient jamais.',
        solution: "Les candidats ICE n'étaient pas envoyés à temps : ils sont maintenant transmis dès qu'ils arrivent.",
      },
      {
        title: 'Passer de 2 à N personnes',
        problem: 'Le premier modèle ne reliait que deux participants.',
        solution: "Une topologie maillée : chaque nouvel arrivant ouvre une connexion avec chacun des participants déjà présents.",
      },
    ],
    journal: [
      { d: '5 oct · 17h03', t: 'Tableau blanc WebRTC', x: 'Première version, en verre dépoli.' },
      { d: '5 oct · 18h39', t: 'Réécriture avec React Flow', x: 'On passe des traits aux blocs reliés.' },
      { d: '5 oct · 20h45', t: 'Une salve de fonctionnalités', x: 'YouTube, Markdown, curseurs, chat, glisser-déposer.' },
      { d: '5 oct · 21h14', t: 'Messages découpés', x: 'Les gros contenus passent enfin par le DataChannel.' },
      { d: '6 oct · 06h41', t: 'Agenda, météo, base SQL', x: 'De vrais outils sur le canvas.' },
      { d: '6 oct · 08h19', t: 'N participants', x: 'Maillage WebRTC et support mobile.' },
    ],
    next: ['Un historique pour annuler les actions des autres.', 'Des modèles de tableaux prêts à l\'emploi (rétro, brainstorming, planning).'],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'clavio',
    name: 'Clavio',
    letter: 'K',
    color: '#a7e8bd',
    deep: '#22a35a',
    soft: '#eefaf1',
    kicker: 'App web · Web MIDI · zéro dépendance',
    tagline: 'Apprendre le piano, <em>une note à la fois.</em>',
    summary: "Clavio apprend le piano façon Duolingo, avec un Casio CT-S100 ou n'importe quel clavier MIDI branché en USB. Un parcours de 28 leçons, des séries de jours, et surtout : on importe n'importe quel fichier MIDI et l'app nous l'apprend note par note.",
    meta: {
      role: 'Conception et développement',
      period: 'Octobre 2026',
      status: 'Open source',
    },
    stack: ['JavaScript', 'Web MIDI API', 'Web Audio', 'HTML', 'CSS'],
    links: [{ label: 'Voir le code', url: 'https://github.com/osayanis/clavio', primary: true }],
    stats: [
      { n: '28', label: 'leçons en 8 unités' },
      { n: '3 988', label: 'lignes, sans aucune dépendance' },
      { n: '16', label: 'badges à débloquer' },
      { n: '61', label: 'touches gérées' },
    ],
    problem: {
      quote: "J'avais un clavier Casio et aucune idée de par où commencer.",
      text: [
        "Les applis pour apprendre le piano sont souvent payantes, en anglais, ou ne savent pas lire ce qu'on joue vraiment. Or un petit clavier comme le CT-S100 a un port USB qui parle MIDI : le navigateur peut savoir exactement quelle touche est enfoncée.",
        "Clavio part de là : un vrai parcours pour débutant, la motivation d'un jeu (cœurs, XP, séries, badges), et un lecteur MIDI maison pour apprendre ensuite les morceaux de son choix.",
      ],
    },
    visuals: [
      { type: 'shot', src: '/media/clavio/morceau-pas-a-pas.webp', alt: 'Mode pas à pas : les notes tombent vers le clavier', caption: "Mode pas à pas : la musique attend la bonne note." },
      { type: 'shot', src: '/media/clavio/parcours.webp', alt: "Parcours d'apprentissage", caption: 'Le parcours : 8 unités, 28 leçons.' },
      { type: 'shot', src: '/media/clavio/lecon-portee.webp', alt: 'Leçon de lecture de portée', caption: 'Lire la portée, en clé de Sol puis de Fa.' },
      { type: 'shot', src: '/media/clavio/rythme.webp', alt: 'Exercice de rythme', caption: 'Des exercices de rythme.' },
      { type: 'shot', src: '/media/clavio/lecon-erreur.webp', alt: "Retour d'erreur pendant une leçon", caption: "Une erreur ? L'exercice revient à la fin." },
      { type: 'shot', src: '/media/clavio/reglages-morceau.webp', alt: "Réglages d'un morceau importé", caption: 'Pour chaque piste : je joue, l\'app joue, ou muet.' },
    ],
    how: {
      intro: "Tout tourne dans le navigateur, en JavaScript pur, découpé en petits modules.",
      steps: [
        { t: 'Le clavier parle MIDI', d: "L'API Web MIDI reçoit chaque touche enfoncée sur le piano, avec sa vélocité. Sans clavier, on joue à la souris, au doigt ou avec le clavier de l'ordi." },
        { t: 'Un lecteur MIDI maison', d: "Le parseur lit les fichiers <code>.mid</code>, convertit les ticks en secondes grâce à la carte des tempos, sépare les canaux et devine la main (grave à gauche, aigu à droite)." },
        { t: 'Trois façons de jouer', d: "Pas à pas (la musique attend), en rythme (on est noté « Parfait » ou « Bien »), ou en écoute. Vitesse réglable de 20 % à 150 %." },
        { t: 'La motivation', d: "5 cœurs par leçon, XP, niveaux, objectif quotidien, série de jours et 16 badges, sauvegardés dans le navigateur." },
      ],
      diagram: {
        w: 820, h: 330,
        nodes: [
          { id: 'piano', x: 120, y: 165, w: 170, h: 76, label: 'Casio CT-S100', sub: 'USB · MIDI', c: '#fde68a' },
          { id: 'input', x: 330, y: 165, w: 150, h: 66, label: 'input.js', sub: 'Web MIDI', c: '#a7e8bd' },
          { id: 'prac', x: 540, y: 165, w: 160, h: 66, label: 'practice.js', sub: 'modes de jeu', c: '#a7e8bd' },
          { id: 'mid', x: 540, y: 50, w: 170, h: 60, label: 'midifile.js', sub: 'parseur maison', c: '#93c5fd' },
          { id: 'les', x: 540, y: 280, w: 170, h: 60, label: 'course.js', sub: '28 leçons', c: '#f3a6cf' },
          { id: 'store', x: 730, y: 165, w: 140, h: 66, label: 'store.js', sub: 'XP, séries', c: '#e5e7eb' },
        ],
        edges: [
          { from: 'piano', to: 'input', label: 'notes' },
          { from: 'input', to: 'prac' },
          { from: 'mid', to: 'prac', label: 'morceaux' },
          { from: 'les', to: 'prac' },
          { from: 'prac', to: 'store' },
        ],
      },
    },
    demo: {
      kind: 'falling',
      title: 'Le mode pas à pas',
      intro: "Les notes tombent, et la musique t'attend. Joue à la souris ou avec les touches Q, S, D, F, G, H, J, K.",
    },
    challenges: [
      {
        title: 'Lire un fichier MIDI à la main',
        problem: "Les fichiers MIDI comptent le temps en « ticks », avec des changements de tempo en cours de route, et parfois un en-tête RIFF en plus.",
        solution: "Un parseur maison : carte des tempos pour convertir en secondes, gestion des notes jamais relâchées, et séparation des canaux mélangés sur une même piste.",
      },
      {
        title: 'Un morceau trop grand pour le clavier',
        problem: "Un MIDI peut utiliser 88 touches, le CT-S100 n'en a que 61.",
        solution: 'Les notes hors tessiture sont ramenées dans les octaves disponibles, et le morceau est découpé en parties de 4 mesures notées sur 3 étoiles.',
      },
      {
        title: 'Deux sons qui se marchent dessus',
        problem: "Le piano joue déjà son propre son, et l'app aussi.",
        solution: "Par défaut, l'app coupe son propre son pour les notes jouées sur le clavier. Un réglage permet de le rétablir.",
      },
    ],
    journal: [
      { d: 'Unité 1 à 8', t: 'Un programme complet', x: "De « trouver le Do » jusqu'aux deux mains, avec un morceau bonus par unité." },
      { d: 'Import MIDI', t: 'N\'importe quel morceau', x: 'Glisser-déposer un .mid, choisir les pistes, apprendre partie par partie.' },
      { d: 'Jeu libre', t: 'Reconnaissance des accords', x: 'Les 61 touches, les accords nommés en direct, un métronome et un enregistreur.' },
      { d: '7 oct', t: 'Publication', x: 'Mise en ligne sur GitHub avec un README illustré.' },
    ],
    next: ['Une version en ligne, sans rien télécharger.', 'Un mode « deux mains séparées » pour travailler chaque main à part.'],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'openpod',
    name: 'OpenPod OS',
    letter: 'O',
    color: '#fcc48b',
    deep: '#ea7a1e',
    soft: '#fff3e6',
    kicker: 'Linux embarqué · matériel',
    tagline: 'Un baladeur, <em>rien que la musique.</em>',
    summary: "OpenPod est un baladeur audio pensé pour écouter sans distraction : un matériel minimaliste, un son bit-perfect et un système ultra-léger développé sur mesure. Je travaille sur OpenPod OS, la partie logicielle : la distribution Linux, le moteur audio et l'interface.",
    meta: {
      role: 'Co-lead du projet, avec Kinam Pirrottina',
      period: 'Depuis octobre 2026',
      status: 'Phase 1 · preuve de concept',
    },
    stack: ['Linux embarqué', 'Buildroot', 'MPD', 'Raspberry Pi Zero 2 W', 'I²S', 'SPI', 'I²C'],
    links: [],
    stats: [
      { n: '< 3 s', label: 'du bouton à la musique (objectif)' },
      { n: '240×320', label: 'pixels sur un écran IPS 2,8"' },
      { n: '4', label: 'phases de développement' },
      { n: '2 000', label: 'mAh de batterie' },
    ],
    problem: {
      quote: "Écouter un album sans notification, sans algorithme, sans écran qui tente de te garder.",
      text: [
        "Un téléphone est un très mauvais baladeur : il sonne, vibre, propose autre chose. L'OpenPod veut revenir à un objet qui ne fait qu'une chose, et bien : lire la musique, avec un son de qualité et une molette agréable sous le pouce.",
        "Le design s'inspire d'Apple et de Teenage Engineering. Côté logiciel, l'enjeu est de démarrer en moins de 3 secondes et de ne rien faire tourner d'inutile.",
      ],
    },
    visuals: [],
    how: {
      intro: "Une pile volontairement courte : un Linux minimal, un moteur audio éprouvé et une interface dessinée directement à l'écran.",
      steps: [
        { t: 'Un Linux compilé de zéro', d: "Une distribution Buildroot (ou Yocto) débarrassée de tout ce qui n'est pas nécessaire, pour démarrer en moins de 3 secondes." },
        { t: 'Un son bit-perfect', d: 'MPD (Music Player Daemon) envoie le son au DAC PCM5102A en I²S, sans rééchantillonnage.' },
        { t: 'Une interface au pixel près', d: "Une grille stricte de 240 × 320, dessinée directement dans le framebuffer Linux, sur un écran IPS relié en SPI." },
        { t: 'Une molette sans pièce mobile', d: "Un trackpad circulaire Cirque relié en I²C. Ses coordonnées sont converties en angle avec <code>atan2</code>, puis en défilement fluide." },
      ],
      diagram: {
        w: 820, h: 340,
        nodes: [
          { id: 'pi', x: 410, y: 170, w: 190, h: 86, label: 'Raspberry Pi', sub: 'Zero 2 W · Linux', c: '#fcc48b' },
          { id: 'dac', x: 130, y: 80, w: 190, h: 70, label: 'DAC PCM5102A', sub: 'jack 3,5 mm', c: '#a7e8bd' },
          { id: 'lcd', x: 690, y: 80, w: 190, h: 70, label: 'Écran IPS 2,8"', sub: '240 × 320', c: '#93c5fd' },
          { id: 'tp', x: 130, y: 270, w: 190, h: 70, label: 'Trackpad Cirque', sub: 'molette tactile', c: '#f3a6cf' },
          { id: 'bat', x: 690, y: 270, w: 190, h: 70, label: 'LiPo 2 000 mAh', sub: 'USB-C · 5 V', c: '#fde68a' },
        ],
        edges: [
          { from: 'pi', to: 'dac', label: 'I²S' },
          { from: 'pi', to: 'lcd', label: 'SPI' },
          { from: 'tp', to: 'pi', label: 'I²C' },
          { from: 'bat', to: 'pi', label: '5 V' },
        ],
      },
    },
    demo: {
      kind: 'wheel',
      title: 'Essaie la molette',
      intro: "Fais glisser ton doigt ou ta souris en cercle sur la molette. L'angle est calculé avec atan2, exactement comme sur le vrai trackpad, et fait défiler le menu.",
    },
    challenges: [
      {
        title: 'Démarrer en moins de 3 secondes',
        problem: 'Un Raspberry Pi OS classique met plus de 20 secondes à démarrer.',
        solution: "Une image Linux construite sur mesure avec Buildroot : uniquement le noyau, les pilotes et MPD.",
      },
      {
        title: 'Transformer un trackpad en molette',
        problem: 'Le trackpad donne des coordonnées X/Y, pas une rotation.',
        solution: "On calcule l'angle avec <code>atan2</code> et on suit sa variation d'un point à l'autre : chaque fraction de tour devient un cran de défilement.",
      },
      {
        title: 'Séparer le son et l\'image',
        problem: 'Les signaux vidéo et audio peuvent se perturber sur une petite carte.',
        solution: 'Une carte mère dessinée sur mesure où le SPI (écran) et l\'I²S (audio) sont routés séparément.',
      },
    ],
    journal: [
      { d: 'Phase 1', t: 'Preuve de concept', x: 'Écran, DAC et trackpad sur breadboard, première interface, lecture via MPD.', now: true },
      { d: 'Phase 2', t: 'Électronique', x: 'Schémas et routage de la carte mère sous KiCad, fabrication.' },
      { d: 'Phase 3', t: 'Mécanique & design', x: "Boîtier en nylon SLS, mécanique du clic de la molette, façade en acrylique fumé." },
      { d: 'Phase 4', t: 'Intégration', x: 'Assemblage et noyau Buildroot optimisé pour la production.' },
    ],
    next: ["Choisir le langage de l'interface (Python, Swift 6 ou C/C++) après les premiers tests de performance.", 'Valider la lecture bit-perfect sur le DAC.'],
    credits: 'Projet mené avec Kinam Pirrottina.',
  },

  /* ------------------------------------------------------------------ */
  {
    slug: 'proxmox',
    name: 'Proxmox Automatisation',
    letter: 'X',
    color: '#fde68a',
    deep: '#c99a06',
    soft: '#fffaea',
    kicker: 'Script Bash · administration système',
    tagline: 'Dix machines, <em>une seule commande.</em>',
    summary: "Un script interactif pour créer des conteneurs LXC et des machines virtuelles en série sur Proxmox VE. Il détecte le réseau, propose les templates et les ISO disponibles, trouve un identifiant libre pour chaque machine et refuse toute valeur impossible avant de lancer la création.",
    meta: {
      role: 'Développement',
      period: '18 → 19 novembre 2025',
      status: 'Open source',
    },
    stack: ['Bash', 'Proxmox VE', 'pct', 'qm', 'LXC', 'KVM'],
    links: [{ label: 'Voir le script', url: 'https://github.com/osayanis/Proxmox-Automatisation-Script', primary: true }],
    stats: [
      { n: '352', label: 'lignes de Bash' },
      { n: '10', label: 'versions en 2 jours' },
      { n: '9', label: 'fonctions' },
      { n: '4', label: 'règles de validation des IP' },
    ],
    problem: {
      quote: "Créer dix conteneurs dans l'interface web, c'est dix fois les mêmes écrans et les mêmes erreurs possibles.",
      text: [
        "En cours, on monte régulièrement des maquettes réseau sur Proxmox : plusieurs conteneurs ou VM à configurer d'affilée. L'interface web est lente pour ça, et rien n'empêche de donner une IP déjà prise ou plus de RAM que le serveur n'en a.",
        "Le script enchaîne les créations depuis le terminal avec <code>pct</code> et <code>qm</code>, et vérifie chaque réponse avant de toucher au serveur.",
      ],
    },
    visuals: [],
    how: {
      intro: 'Le script regarde ce qui est possible sur le serveur avant de proposer quoi que ce soit.',
      steps: [
        { t: 'Un menu simple', d: 'Créer des conteneurs, créer des VM, lister les templates, lister les ISO, ou quitter.' },
        { t: 'Il regarde la machine', d: 'Passerelle et broadcast lus sur <code>vmbr0</code>, RAM libre (avec 512 Mo de marge) et espace disque du stockage choisi.' },
        { t: 'Il valide chaque réponse', d: "Nom, stockage, RAM, disque, IP : chaque valeur est vérifiée, et la question revient tant qu'elle n'est pas valide." },
        { t: 'Il crée en série', d: 'Un identifiant libre est trouvé à partir de 100, puis <code>pct create</code> ou <code>qm create</code> lance la machine. On recommence pour la suivante.' },
      ],
      diagram: {
        w: 820, h: 300,
        nodes: [
          { id: 'menu', x: 120, y: 150, w: 170, h: 72, label: 'Menu', sub: '5 options', c: '#fde68a' },
          { id: 'chk', x: 330, y: 150, w: 170, h: 72, label: 'Le serveur', sub: 'réseau, RAM, disque', c: '#e5e7eb' },
          { id: 'ask', x: 540, y: 150, w: 170, h: 72, label: 'Validation', sub: 'chaque réponse', c: '#f9a8a8' },
          { id: 'ct', x: 730, y: 70, w: 150, h: 64, label: 'pct create', sub: 'conteneurs', c: '#a7e8bd' },
          { id: 'vm', x: 730, y: 230, w: 150, h: 64, label: 'qm create', sub: 'VM', c: '#93c5fd' },
        ],
        edges: [
          { from: 'menu', to: 'chk' }, { from: 'chk', to: 'ask' },
          { from: 'ask', to: 'ct', label: '× N' }, { from: 'ask', to: 'vm', label: '× N' },
        ],
      },
    },
    demo: {
      kind: 'terminal',
      title: 'Lance le script',
      intro: "Une simulation qui reprend le menu et les contrôles du vrai script. Tape tes réponses et appuie sur Entrée : essaie de donner l'IP de la passerelle, pour voir.",
    },
    challenges: [
      {
        title: 'Des identifiants qui ne se marchent pas dessus',
        problem: 'Deux machines ne peuvent pas avoir le même identifiant, et conteneurs et VM partagent la même numérotation.',
        solution: "Une fonction part de 100 et avance tant que l'ID est pris par un conteneur (<code>pct status</code>) ou une VM (<code>qm status</code>).",
      },
      {
        title: 'Ne pas demander l\'impossible',
        problem: 'On peut réclamer plus de RAM ou de disque que le serveur n\'en a.',
        solution: 'Le script lit la RAM libre (moins 512 Mo de marge) et l\'espace du stockage choisi, et refuse toute valeur au-delà.',
      },
      {
        title: 'Des IP qui ne cassent pas le réseau',
        problem: 'Une faute de frappe sur une IP peut couper la passerelle de tout le réseau.',
        solution: 'Chaque IP est contrôlée : bon format, octets ≤ 255, ni la passerelle, ni le broadcast, ni une adresse en .0.',
      },
    ],
    journal: [
      { d: '18 nov · 08h16', t: 'V1', x: 'Création de conteneurs en série.' },
      { d: '18 nov · 13h42', t: 'V2 & V3', x: 'Machines virtuelles, templates et ISO.' },
      { d: '18 nov · 19h47', t: 'V3.5.x', x: 'Réseau détecté automatiquement et choix du stockage.' },
      { d: '19 nov · 13h44', t: 'V7', x: 'Version finale avec vérification des ressources et des IP.' },
    ],
    next: ['Lire un fichier de configuration pour monter une maquette complète sans questions.', "Supprimer en une commande les machines d'une maquette terminée."],
  },
]

export const bySlug = Object.fromEntries(projects.map(p => [p.slug, p]))
