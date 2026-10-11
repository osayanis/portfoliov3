// La discothèque du bureau : les morceaux préférés de Yanis, qu'on sort de la bibliothèque
// pour les poser sur la platine. Le son vient de l'extrait officiel de 30 s fourni par Apple
// (API iTunes, identifiant `id`) : aucun fichier audio n'est hébergé.
// Pour ajouter un disque : son identifiant iTunes, le titre, l'artiste, l'album, l'année et
// quelques phrases qui flottent à côté de la platine. La couleur de la tranche vient de la pochette.
const LOVED = 'Un des morceaux préférés de Yanis'
export const RECORDS = [
  {
    id: 294358228, title: "It's a Man's Man's Man's World", artist: 'Seal', album: 'Soul', year: '2008',
    facts: ['Une chanson de James Brown, 1966', 'Reprise par Seal en 2008', "Sur l'album Soul, produit par David Foster", 'Le morceau préféré de Yanis pour coder tard'],
  },
  {
    id: 1548467215, title: 'Décisions', artist: 'Josman', album: 'MYSTR J.O.$.', year: '2021',
    facts: ['Sur l\'EP MYSTR J.O.$.', 'Sorti en 2021', 'Troisième titre sur six', LOVED],
  },
  {
    id: 1819419332, title: 'La Paire', artist: 'SACH', album: 'La Paire', year: '2025',
    facts: ['Un single sorti en 2025', 'Du R&B français', LOVED],
  },
  {
    id: 386153478, title: 'Yeah!', artist: 'Usher', album: 'Confessions', year: '2004',
    facts: ['Avec Lil Jon et Ludacris', "Sur l'album Confessions", 'Sorti en 2004', LOVED],
  },
  {
    id: 1689379342, title: 'Monde', artist: 'Luidji', album: 'Saison 00', year: '2023',
    facts: ['Avec Ryan Koffi', "Sur l'album Saison 00", 'Sorti en 2023', LOVED],
  },
  {
    id: 607146589, title: "Le droit à l'erreur", artist: 'Amel Bent', album: "Un jour d'été", year: '2004',
    facts: ["Sur son premier album, Un jour d'été", 'Sorti en 2004', LOVED],
  },
  {
    id: 1488013865, title: 'Clouded', artist: 'Brent Faiyaz', album: 'Fuck the World', year: '2020',
    facts: ["Sur l'album Fuck the World", 'Sorti en 2020', 'Deuxième titre sur dix', LOVED],
  },
  {
    id: 1390522436, title: 'Silence', artist: 'Damso', album: 'Lithopédion', year: '2018',
    facts: ['Avec Angèle', "Sur l'album Lithopédion", 'Sorti en 2018', LOVED],
  },
  {
    id: 850697800, title: 'Chicago', artist: 'Michael Jackson', album: 'Xscape', year: '2014',
    facts: ["Sur l'album Xscape", 'Sorti en 2014, après sa disparition', LOVED],
  },
  {
    id: 1240250645, title: 'Banlieusards', artist: 'Kery James', album: "À l'ombre du show business", year: '2008',
    facts: ["Sur l'album À l'ombre du show business", 'Sorti en 2008', LOVED],
  },
  {
    id: 1853015787, title: 'Quatrième Larme', artist: 'Chems', album: 'Quatrième Larme', year: '2025',
    facts: ['Un single sorti en 2025', LOVED],
  },
  {
    id: 1146195714, title: 'Pink + White', artist: 'Frank Ocean', album: 'Blonde', year: '2016',
    facts: ["Sur l'album Blonde", 'Sorti en 2016', 'Troisième titre de l\'album', LOVED],
  },
  {
    id: 1819752015, title: 'Dragons', artist: 'Hamza', album: 'MANIA', year: '2025',
    facts: ['Avec Werenoi', "Sur l'album MANIA", 'Sorti en 2025', LOVED],
  },
]
// couleurs de départ des tranches (remplacées par la couleur de la pochette dès qu'elle arrive)
const PALETTE = [['#1d1b1a', '#f2ead9'], ['#2f4f6a', '#e8f1f7'], ['#8a3b22', '#fbe7d2'], ['#3b5b3a', '#eef5e6'], ['#5a3a6b', '#f3e8fa'], ['#b4532a', '#fff1e6'], ['#121212', '#d8b46a']]
RECORDS.forEach((r, i) => { [r.spine, r.ink] = PALETTE[i % PALETTE.length] })
