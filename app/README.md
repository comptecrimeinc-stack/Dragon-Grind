# Dragon Grind — version Svelte

Réécriture propre de `Dragon_Grind_JOUABLE.html` / `version-legere/index.html` (fichiers d'origine
inchangés, à la racine du dépôt) : Svelte 5, TypeScript, Vite, tests Vitest, build statique
déployable sur GitHub Pages.

## Commandes

Node ≥ 22.12.

```bash
npm install
npm run dev        # serveur de développement (http://localhost:5173)
npm test           # tests unitaires et de composants (Vitest + Testing Library)
npm run check      # vérification des types (svelte-check)
npm run build      # build statique dans dist/
npm run preview    # sert dist/ pour vérifier le build
```

## Organisation

```
src/
  App.svelte                 écrans de démarrage (langue, profil) puis le jeu
  lib/
    game/                    règles du jeu : fonctions pures, sans DOM, testées
      constants.ts           tables d'équilibrage et contenus (texte français source)
      state.ts               forme de la sauvegarde, validation et bornage
      economy.ts             production, coûts, multiplicateurs, renaissances
      combat.ts              titans, attaques, interruptions, compétences
      daily.ts  forge.ts  collection.ts  adventure.ts  progression.ts
      engine.ts              souffle, boucle de jeu, progression hors ligne
      leaderboard.ts  profile.ts  notifications.ts  format.ts  fx.ts
    stores/game.svelte.ts    état réactif (runes) : appelle les règles, sauvegarde, annonces
    services/                stockage navigateur, sauvegardes, classement mondial
    i18n/                    moteur de traduction + dictionnaires (10 langues)
    audio/sound.ts           sons et musique synthétisés (Web Audio)
    components/              un dossier par onglet + overlays, ui partagée
public/assets/               images (portraits, logo, 42 arts du dragon extraits du HTML)
```

Les imports internes passent par l'alias npm `#lib/*` (champ `imports` de `package.json`),
avec l'extension explicite : `import { game } from '#lib/stores/game.svelte.ts'`.

Les règles ne touchent jamais au DOM : elles reçoivent l'état et un objet `Fx`
(`toast`, `sound`) pour signaler ce qui doit être annoncé. C'est ce qui les rend testables
sans navigateur.

## Sauvegardes

Mêmes clés `localStorage` que le jeu d'origine (`dragon-grind-v2`, profil, boutique…) :
une partie existante sur le même domaine est reprise telle quelle. Un export JSON du jeu
d'origine s'importe aussi (Paramètres → Importer une sauvegarde).

## Traductions

Le français est la langue source et sert de clé (à la gettext) ; les nombres sont remplacés
par `{n}`. Les dictionnaires `src/lib/i18n/locales/*.json` reprennent ceux du jeu d'origine,
complétés pour les textes qu'il laissait en français (succès, sanctuaires, codex, etc.).

En développement, les phrases sans traduction sont relevées dans `window.__i18nMisses`.
Les noms propres (rivaux, dragons) restent volontairement non traduits.

## Classement mondial

GitHub Pages ne sert que des fichiers statiques. Le serveur de classement (fonction Netlify,
dossier `netlify-leaderboard/` à la racine) doit être hébergé ailleurs ; son adresse est
fournie au build :

```bash
VITE_LEADERBOARD_URL=https://<site>.netlify.app/api/leaderboard npm run build
```

Sans cette variable, le jeu tente les chemins relatifs d'un hébergement Netlify complet,
puis se contente du classement local (rivaux et héros de l'appareil).

## Déploiement GitHub Pages

`vite.config.ts` utilise `base: './'` : le build fonctionne sous `https://<user>.github.io/<dépôt>/`
comme à la racine d'un domaine. Le workflow `.github/workflows/deploy-pages.yml` construit
`app/` et publie `app/dist` à chaque push sur `main` (activer Pages avec la source
« GitHub Actions » dans les réglages du dépôt).

## Écarts volontaires avec l'original

Corrections de défauts constatés dans le jeu d'origine :

- les contrats quotidiens rapportaient 0 mana (propriété mal nommée dans la formule) ;
- les ensembles de reliques n'étaient jamais affichés, le journal de sécurité jamais lu ;
- plusieurs textes annonçaient un bonus différent de celui appliqué (codex 2 % → 1,2 %,
  sanctuaire 5 % → 3 %, ensemble de l'Archonte 15 % → 8 %, voie du Néant 15 % → 8 %,
  récompense de titan affichée ≠ réelle) : l'équilibrage est conservé, les textes disent vrai ;
- en arabe et en ourdou (RTL), la page débordait horizontalement ;
- une perte du contexte WebGL laissait un portrait blanc : on revient à l'image fixe.

Simplifications :

- l'aura sylvestre est une illustration animée en CSS, et non plus une déformation
  pixel par pixel sur canevas ;
- les confirmations (`confirm()`) sont remplacées par des boutons à double appui ;
- le service worker (fichier `sw.js` absent du dépôt d'origine) n'est pas repris.
