```bash
#!/bin/bash

# Afficher le statut
echo "📊 Statut Git..."
git status

# Ajouter tous les fichiers
echo "➕ Ajout de tous les fichiers..."
git add .

# Générer un message de commit en français basé sur les changements
echo "📝 Génération du message de commit..."
CHANGES=$(git diff --cached --name-status)

# Analyser les changements pour créer un message descriptif
MESSAGE=""
if echo "$CHANGES" | grep -q "^A"; then
    MESSAGE="${MESSAGE}Ajout de nouveaux fichiers. "
fi
if echo "$CHANGES" | grep -q "^M"; then
    MESSAGE="${MESSAGE}Modification de fichiers existants. "
fi
if echo "$CHANGES" | grep -q "^D"; then
    MESSAGE="${MESSAGE}Suppression de fichiers. "
fi
if echo "$CHANGES" | grep -q "^R"; then
    MESSAGE="${MESSAGE}Renommage de fichiers. "
fi

# Si aucun message spécifique, message générique
if [ -z "$MESSAGE" ]; then
    MESSAGE="Mise à jour du projet"
else
    MESSAGE="Mise à jour: ${MESSAGE}"
fi

# Ajouter la date et l'heure
MESSAGE="${MESSAGE} - $(date '+%d/%m/%Y %H:%M')"

# Commit avec le message (seulement s'il y a des changements)
if [ -n "$(git diff --cached --name-only)" ]; then
    echo "💾 Commit avec le message: $MESSAGE"
    git commit -m "$MESSAGE"
else
    echo "ℹ️  Aucun changement à committer"
fi

# Récupérer les changements distants avant de push
echo "📥 Récupération des changements distants..."
git pull --rebase

# Push
echo "🚀 Push vers le dépôt distant..."
git push

echo "✅ Terminé !"
```
