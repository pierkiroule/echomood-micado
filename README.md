# ÉchoMood

ÉchoMood est une application React/Vite qui aide une personne à représenter son « écho intérieur » du jour à travers des astres, des climats émotionnels, des satellites-refuges, des besoins et une résonance à explorer.

L'application est pensée comme un support de dialogue : elle ne pose pas de diagnostic, ne remplace pas un professionnel de santé et ne prétend pas dire la vérité sur l'utilisateur.

## Fonctionnalités

- Parcours guidé en 5 étapes.
- Sélection d'intensité sur les bulles émotionnelles.
- Ajout d'une bulle personnalisée par étape.
- Révélation d'une constellation du jour.
- Questions de résonance issues d'une banque dédiée.
- Collection locale des ÉchoMood précédents.
- Observatoire avec récurrences, historique local, export et effacement.
- Export JSON d'un ÉchoMood ou de la collection.

## Confidentialité

Les données sont stockées uniquement dans le navigateur via `localStorage`. Aucun serveur n'est utilisé par défaut. L'utilisateur peut effacer son historique depuis l'Observatoire.

## Cadre d'utilisation

ÉchoMood est un support d'expression et de discussion. En cas d'urgence, de danger ou de détresse importante, il faut contacter immédiatement un adulte de confiance, un professionnel ou un service d'urgence.

## Développement

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Structure principale

- `src/App.jsx` : flux applicatif, révélation, observatoire, stockage local et export.
- `src/data/steps.js` : catégories et bulles disponibles.
- `src/data/resonances.js` : banque de questions de résonance.
- `src/index.css` : styles visuels et responsive.
