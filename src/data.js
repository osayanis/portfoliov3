// Toutes les infos perso au même endroit : modifie ici, le site suit.
export const profile = {
  name: 'Yanis',
  github: 'https://github.com/osayanis',
  site: 'https://yanis.pro',
  osalabs: 'https://osalabs.fr',
  discord: 'yanis.osa',
  // Mets ton adresse ici pour activer le bouton "Écris-moi" (sinon il renvoie vers GitHub).
  email: '',
}

// Les touches du clavier du hero. x/y en unités du viewBox (585 × 200).
export const heroKeys = [
  { letter: 'P', label: 'Projets phares', target: '#notch', x: 35, y: 0, c: '#f3a6cf', d: '#d877ab' },
  { letter: 'O', label: 'OsaLabs', target: '#osalabs', x: 135, y: 0, c: '#c4b5fd', d: '#9b86ec' },
  { letter: 'R', label: 'Mon parcours', target: '#parcours', x: 235, y: 0, c: '#a7e8bd', d: '#6fcb90' },
  { letter: 'T', label: 'Ma boîte à outils', target: '#stack', x: 335, y: 0, c: '#fcc48b', d: '#ec9a52' },
  { letter: 'F', label: 'Flux GitHub', target: '#github', x: 0, y: 100, c: '#93c5fd', d: '#5f9ded' },
  { letter: 'O', label: 'Un peu de moi', target: '#apropos', x: 100, y: 100, c: '#f9a8a8', d: '#e57373' },
  { letter: 'L', label: 'Le labo', target: '#labo', x: 200, y: 100, c: '#fde68a', d: '#efc94c' },
  { letter: 'I', label: 'Ma méthode', target: '#methode', x: 300, y: 100, c: '#a5b4fc', d: '#7b8cf0' },
  { letter: 'O', label: 'Dire bonjour', target: '#contact', x: 400, y: 100, c: '#86efac', d: '#4fd17f' },
]

export const osalabsApps = [
  {
    name: 'OsaParty',
    page: '/projets/osaparty/',
    url: 'https://osaparty.osalabs.fr',
    color: '#f472b6',
    tag: 'Écoute synchronisée',
    desc: "Des listen parties Apple Music & Spotify, à la seconde près. On rejoint avec un code PIN ou un QR code, façon Kahoot.",
    detail: "Apple bloque MusicKit derrière un compte dev payant ? Un Mac sert de pont, comme le Rich Presence de Discord.",
    stack: ['Next.js', 'Socket.io', 'iTunes API'],
    visual: 'party',
  },
  {
    name: 'OsaDrop',
    page: '/projets/osadrop/',
    url: 'https://osadrop.osalabs.fr',
    color: '#60a5fa',
    tag: 'Transfert P2P',
    desc: "Envoie un fichier d'un appareil à l'autre avec un code à 6 caractères ou un QR code. Rien ne passe par un serveur.",
    detail: 'Envoi par morceaux via les DataChannels WebRTC, donc pas de limite de taille.',
    stack: ['WebRTC', 'Next.js', 'TypeScript'],
    visual: 'drop',
  },
  {
    name: 'OsaCast',
    page: '/projets/osacast/',
    url: 'https://osacast.osalabs.fr',
    color: '#818cf8',
    tag: "Partage d'écran",
    desc: "Partage ton écran en un clic, sans rien installer. Le flux va directement d'un navigateur à l'autre.",
    detail: 'Capture native du navigateur et flux pair-à-pair pour une latence minimale.',
    stack: ['WebRTC', 'getDisplayMedia', 'Next.js'],
    visual: 'cast',
  },
  {
    name: 'OsaBoard',
    page: '/projets/osaboard/',
    url: 'https://osaboard.osalabs.fr',
    color: '#2dd4bf',
    tag: 'Canvas collaboratif',
    desc: "Un canvas collaboratif en temps réel : 18 types de blocs à poser et relier, avec les curseurs des autres en direct.",
    detail: 'Un maillage WebRTC entre tous les participants : aucune base de données au milieu.',
    stack: ['React Flow', 'WebRTC', 'Socket.io'],
    visual: 'board',
  },
]

export const stack = [
  { name: 'TypeScript', c: '#93c5fd' },
  { name: 'Swift', c: '#fcc48b' },
  { name: 'SwiftUI', c: '#fcc48b' },
  { name: 'React', c: '#a5f3fc' },
  { name: 'Next.js', c: '#e5e7eb' },
  { name: 'WebRTC', c: '#c4b5fd' },
  { name: 'Socket.io', c: '#e5e7eb' },
  { name: 'Electron', c: '#a5f3fc' },
  { name: 'Tailwind', c: '#99f6e4' },
  { name: 'Framer Motion', c: '#f3a6cf' },
  { name: 'Web MIDI', c: '#a7e8bd' },
  { name: 'Node.js', c: '#a7e8bd' },
  { name: 'Python', c: '#fde68a' },
  { name: 'Bash', c: '#d1d5db' },
  { name: 'Linux', c: '#fde68a' },
  { name: 'Proxmox', c: '#fcc48b' },
  { name: 'Nginx + PM2', c: '#a7e8bd' },
  { name: 'Vercel', c: '#e5e7eb' },
]

export const timeline = [
  { year: '2021', title: 'Premier compte GitHub', text: "Les débuts : un bot Discord et un serveur Minecraft avec les copains. C'est là que j'ai attrapé le virus." },
  { year: '2023', title: 'LectricMC', text: "J'adapte le launcher officiel de notre serveur Minecraft. Première fois que des gens utilisent un truc que je maintiens." },
  { year: '2024', title: 'Lycée & NSI', text: "Projets Python en NSI (labyrinthe, exos de listes), puis mes premiers sites web faits pour quelqu'un d'autre que moi." },
  { year: '2025', title: 'BTS & sysadmin', text: "Automatisation Proxmox en Bash, serveur d'impression CUPS avec quotas, deux versions de portfolio en React." },
  { year: '2026', title: "OsaLabs prend forme", text: "Quatre apps WebRTC en ligne, OsaNotch en Swift natif, Clavio pour apprendre le piano et OpenPod qui démarre." },
]

export const method = [
  { key: '⌘', name: 'Le déclic', text: "Presque tous mes projets partent d'un truc qui m'agace au quotidien. Si je m'en sers pas, je le construis pas." },
  { key: '⇧', name: 'Proto rapide', text: "Une version qui marche en quelques jours, avec l'IA comme copilote. Je la teste sur mon propre Mac, avec mes potes." },
  { key: '⌥', name: 'Le détail', text: "Ensuite seulement j'ajoute les animations à ressort, les petites mascottes et tout ce qui rend l'outil agréable." },
  { key: '⏎', name: 'On ship', text: "En ligne, en .dmg ou sur un Raspberry Pi. Un projet n'existe vraiment que quand quelqu'un d'autre peut l'utiliser." },
]
