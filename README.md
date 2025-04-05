# Weekly Planner

Une application de planification hebdomadaire avec suivi du temps et statistiques.

## Fonctionnalités

- Planification d'activités par catégorie
- Suivi du temps de sommeil (réveil, coucher, sieste)
- Statistiques détaillées par catégorie
- Visualisation du temps consacré aux activités
- Mode sombre/clair

## Utilisation en local

1. Cloner le projet :
```bash
git clone https://github.com/votre-repo/weekly-planner.git
cd weekly-planner
```

2. Installer les dépendances :
```bash
npm install
```

3. Construire l'application :
```bash
npm run build
```

4. Démarrer l'application :
```bash
npm run start
```

L'application sera accessible à l'adresse : http://localhost:3000

## Mode développement

Pour lancer l'application en mode développement avec rechargement automatique :
```bash
npm run dev
```

## Déploiement sur Internet

Pour rendre l'application accessible depuis Internet, suivez ces étapes :

1. Créer un compte sur [GitHub](https://github.com) si ce n'est pas déjà fait

2. Créer un nouveau dépôt sur GitHub pour le projet

3. Pousser le code vers GitHub :
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-username/weekly-planner.git
git push -u origin main
```

4. Aller sur [Vercel](https://vercel.com) et créer un compte (vous pouvez utiliser votre compte GitHub)

5. Sur Vercel, cliquer sur "New Project" et sélectionner le dépôt weekly-planner

6. Dans les paramètres du projet sur Vercel :
   - Framework Preset : Next.js
   - Build Command : `next build`
   - Output Directory : `.next`

7. Cliquer sur "Deploy"

Votre application sera alors accessible à l'adresse : https://votre-projet.vercel.app

## Technologies utilisées

- Next.js
- React
- TypeScript
- Tailwind CSS
- Chart.js
- SQLite (via better-sqlite3)
- date-fns

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
