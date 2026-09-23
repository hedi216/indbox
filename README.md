# IN-D-BOX

Application e-commerce complète : boutique React, administration, API Express et PostgreSQL. `assets/` conserve le logo et le fond officiels ; `exemple/` reste intact et sert de référence visuelle. Les produits, catégories, prix, variantes, promotions, commandes, clients et contenus administrables proviennent d’une **seule base PostgreSQL**.

## Démarrage rapide

Prérequis : **Node.js 22.12+**, npm 10+, **PostgreSQL 16+**. Aucun service payant ni accès SMTP n’est nécessaire pour développer.

```sh
npm ci
cp server/.env.example server/.env
```

Modifiez `server/.env` : connexion PostgreSQL et secret JWT aléatoire. Générer un secret :

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

### PostgreSQL avec Docker

```sh
export POSTGRES_PASSWORD='choisissez-un-mot-de-passe-local'
docker compose up -d
```

Dans `server/.env`, renseignez `DATABASE_URL=postgresql://indbox:VOTRE_MOT_DE_PASSE@localhost:5432/indbox?schema=public` (encoder les caractères spéciaux du mot de passe dans l’URL).

### PostgreSQL déjà installé

Créez un rôle propriétaire et une base `indbox`, puis renseignez leur URL dans `server/.env`. Exemple depuis une session PostgreSQL administrateur :

```sql
CREATE ROLE indbox LOGIN PASSWORD 'remplacer-ce-mot-de-passe';
CREATE DATABASE indbox OWNER indbox;
```

Sur macOS, `brew install postgresql@16` puis `brew services start postgresql@16` permet d’installer et démarrer PostgreSQL. Sur cette machine de développement, PostgreSQL a été installé par Homebrew et lancé avec `pg_ctl`; il ne redémarre pas automatiquement à la connexion. Le journal local est `.pglog` (ignoré par Git).

### Migration, données et application

```sh
npm run db:setup
npm run dev
```

- Boutique : **http://localhost:5175**
- Administration : **http://localhost:5175/admin**
- API : **http://127.0.0.1:4000/api**
- Santé API + base : **http://127.0.0.1:4000/api/health**

Le port 5175 est utilisé pour éviter un conflit avec une application existante sur 5173. Le proxy Vite transmet `/api`, `/assets`, `/uploads` et `/sitemap.xml` à Express. `localhost` et `127.0.0.1` sont autorisés, mais gardez le même hôte pendant votre session : les cookies appartiennent à un hôte.

Démarrage séparé :

```sh
npm run dev -w server
npm run dev -w client
```

Commandes base individuelles :

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
```

Le seed est relançable sans effacer les modifications existantes. Il crée 7 catégories, 14 produits, 29 variantes, 7 images de présentation, 6 services, 3 coupons, une promotion active, 4 clients et commandes (NEW, CONFIRMED, IN_PREPARATION, DELIVERED), 2 devis, un message et les paramètres du site. Il ne réinitialise pas le mot de passe d’un administrateur existant et ne déclenche pas d’emails pour les données de démonstration.

## Compte administrateur de développement

- Email : `admin@indbox.local`
- Mot de passe : `Indbox-Dev-2026!`

Ces identifiants sont **uniquement destinés au développement**. Définissez `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` avant un premier seed de production et changez le mot de passe dans Utilisateurs. La connexion utilise bcrypt (coût 12), JWT signé HS256 de 8 heures, cookie HTTP-only, SameSite=Lax, Secure en production. La déconnexion et les modifications d’accès révoquent les sessions via `tokenVersion`. Aucun JWT n’est conservé dans localStorage.

### Droits

| Section                                                                 | ADMIN | MANAGER |
| ----------------------------------------------------------------------- | ----- | ------- |
| Dashboard, produits, commandes, devis, clients, promotions, coupons     | Oui   | Oui     |
| Catégories, services, messages, paramètres, utilisateurs, notifications | Oui   | Non     |

Les contrôles sont effectués par le serveur. Un client peut créer un compte, se connecter, modifier son profil et consulter uniquement ses propres commandes. La commande invitée reste disponible. Une adresse email déjà utilisée pour une commande invitée ne peut pas être automatiquement revendiquée par un nouveau compte : une procédure de vérification serait nécessaire pour fusionner les historiques en sécurité.

## Fonctionnement commercial

- Produits et catégories activables, slugs uniques, SEO, ordre, images et sous-catégories. Une catégorie contenant des produits ou des sous-catégories ne peut pas être supprimée silencieusement.
- Produit avec galerie (première image = image principale), tags, caractéristiques libres, produits associés et variantes indépendantes. Le prix, SKU, stock, minimum et nombre de pièces du lot dépendent de la variante sélectionnée.
- Les quantités et stocks sont exprimés en **unités de vente** : pour un lot de 50 pièces, quantité 2 = 100 pièces et prix du lot × 2. Les variantes peuvent avoir un nombre de pièces différent.
- Le panier est stocké dans PostgreSQL, identifié par un cookie opaque HTTP-only. Prix et promotions sont recalculés lors de sa consultation/modification et lors du checkout. Aucun prix du navigateur n’est accepté.
- La meilleure promotion automatique applicable est retenue, sans cumul entre promotions. Produits, catégories et promotion globale sont pris en charge. Les dates sont vérifiées à chaque calcul, sans besoin de cron pour démarrer/arrêter une promotion.
- Le coupon s’applique après les promotions. Les limites globales et par email, le montant minimum, les dates et l’activation sont contrôlés côté serveur. Les clients invités utilisent leur email comme identifiant de limite ; cela ne constitue pas une vérification d’identité.
- Les calculs se font en millimes (1 TND = 1 000 millimes), puis les montants sont stockés en `Decimal(12,3)`.
- Checkout sérialisable avec nouvelle tentative sur conflit : commande + lignes + historique + stock + compteur coupon + emails sont enregistrés ensemble. Une clé UUID d’idempotence évite les doublons lors d’une nouvelle tentative de checkout.
- La commande conserve un instantané du produit, de la variante, du SKU, des caractéristiques, de l’image, de l’unité de vente et des prix. Les modifications ultérieures du catalogue ne modifient pas cet instantané.
- Statuts : NEW → CONFIRMED → IN_PREPARATION → READY → SHIPPED → DELIVERED. READY peut passer directement à DELIVERED pour une remise en main propre. Annulation possible avant expédition ; elle restitue le stock et l’utilisation du coupon une seule fois. DELIVERED et CANCELLED sont terminaux. Aucun remboursement automatique puisqu’aucun paiement carte n’est intégré.
- Devis interne avec références `DEV-AAAA-00001`, fichiers privés, suivi de statut et notes internes. Formulaire de contact enregistré en base, sans redirection WhatsApp.
- Les frais de livraison et le règlement sont convenus par l’équipe avant confirmation. Aucun frais invisible ni paiement en ligne n’est ajouté. Le montant affiché correspond au total des articles après remises ; il ne constitue pas une facture fiscale.

## Notifications email — configuration différée

Le système est déjà intégré. Sans SMTP, les messages restent en base avec le statut `PENDING`. Les erreurs d’envoi ne font jamais perdre une commande.

### Événements

| Événement                                                | Client                            | Équipe si `ADMIN_NOTIFICATION_EMAIL` défini |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| Nouvelle commande                                        | Confirmation détaillée            | Nouvelle commande                           |
| Chaque changement de statut de commande, dont annulation | État + détail complet de commande | Mise à jour                                 |
| Nouveau devis                                            | Accusé de réception et projet     | Nouveau devis                               |
| Changement de statut du devis                            | Nouvel état du dossier            | Mise à jour                                 |
| Nouveau message de contact                               | Accusé de réception               | Message reçu                                |

Les confirmations de commande comprennent référence, client, articles, variantes, SKU, caractéristiques, quantités/conditionnement, prix unitaires, sous-total, promotions, coupon, total et adresse de livraison. Les modèles sont en français, HTML et texte, avec identité noir/or. Les données saisies par les utilisateurs sont échappées. Les notes administratives de devis/commande ne sont pas incluses dans les emails clients.

### Variables à remplir plus tard dans `server/.env`

```dotenv
SMTP_HOST=smtp.votre-fournisseur.tld
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-identifiant
SMTP_PASS=votre-secret
MAIL_FROM="IN-D-BOX <commandes@votre-domaine.tld>"
ADMIN_NOTIFICATION_EMAIL=equipe@votre-domaine.tld
```

- Port 587 : STARTTLS ; port 465 : `SMTP_SECURE=true`.
- Redémarrez le serveur après configuration. Le worker traite automatiquement les emails en attente toutes les 15 secondes, 20 messages maximum par passage.
- L’administration **Notifications email** montre destinataire, sujet, état, tentatives et dernière erreur, avec recherche, filtres et aperçu HTML/texte. « Relancer » remet un message en file ; un email déjà envoyé nécessite confirmation avant renvoi.
- 5 tentatives maximum avec délai exponentiel, puis `FAILED`. Réessayez depuis l’admin après correction.
- Verrouillage PostgreSQL `FOR UPDATE SKIP LOCKED` : plusieurs processus peuvent fonctionner sans prendre simultanément le même message. Les envois bloqués sont repris après 5 minutes.
- Déduplication des événements en base et `Message-ID` stable. Comme tout envoi SMTP, un arrêt entre acceptation par le fournisseur et confirmation en base peut exceptionnellement provoquer un renvoi : ce système garantit la reprise, pas une livraison exactement une fois.
- SPF/DKIM/DMARC, adresse d’expéditeur validée, domaine et délivrabilité restent à configurer auprès de votre fournisseur. Aucun accès SMTP réel n’est fourni dans le dépôt.
- Avant d’activer le SMTP sur une base de développement, retirez les notifications de test que vous ne souhaitez pas envoyer. Les tests utilisent des adresses `example.com`.

## Architecture

```text
client/src/
  main.tsx          Routes publiques et administration
  api.tsx           Client REST, authentification, panier, états de requêtes
  storefront.tsx    Accueil, catalogue, produit, checkout, devis, compte
  admin.tsx         Dashboard réel, listes, éditeurs et gestion
  ui.tsx            Composants communs et métadonnées SEO
  style.css         Identité IN-D-BOX et interface admin responsive
server/src/
  index.ts          Express, sécurité, fichiers, sitemap et production SPA
  auth.ts           Authentification, sessions, rôles, cookie panier
  public.ts         API publique
  admin.ts          API d’administration et validation des transitions
  commerce.ts       Prix, promotions, coupons, transaction de commande
  catalog.ts        Recherche, prix effectifs et pagination SQL
  validation.ts     Schémas Zod
  uploads.ts        Validation et réencodage des fichiers
  mail.ts           Modèles email, outbox et worker SMTP
  db.ts             Prisma et transactions sérialisables
  config.ts         Configuration validée
  http.ts           Erreurs et réponses API
server/prisma/
  schema.prisma
  migrations/       SQL versionné
  seed.ts           Jeu de données réaliste
server/test/        Tests d’intégration API/PostgreSQL
tests/              Parcours navigateur Playwright
assets/             Assets officiels + catalogue de démonstration
exemple/            Prototype original préservé
uploads/            Fichiers locaux ignorés par Git
```

Réponses REST : `{ data, meta? }`, erreurs `{ error: { message, fields? } }`. Pagination : `page`, `limit` (100 maximum), `meta.total`, `meta.pages`.

Routes principales :

| Groupe    | Routes                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Auth      | `POST /api/auth/login`, `/register`, `/logout` ; `GET/PATCH /api/auth/me`                                                  |
| Catalogue | `GET /api/categories`, `/products`, `/products/:slug`, `/services`, `/settings`                                            |
| Panier    | `GET/PUT /api/cart`                                                                                                        |
| Commandes | `POST /api/orders` (en-tête `Idempotency-Key`) ; `GET /api/orders`, `/orders/:id` pour le compte connecté                  |
| Demandes  | `POST /api/quotes`, `POST /api/contact`                                                                                    |
| Fichiers  | `POST /api/uploads/:folder` multipart, champ `files`                                                                       |
| Admin     | `GET /api/admin/dashboard`, CRUD `/products`, `/categories`, `/promotions`, `/coupons`, `/services`                        |
| Suivi     | `GET /api/admin/orders`, `/quotes`, `/customers`, `/messages` ; `PATCH /orders/:id/status`, `/quotes/:id`, `/messages/:id` |
| Site      | `GET/PUT /api/admin/settings` ; `GET/POST/PUT /api/admin/users[/id]`                                                       |
| Emails    | `GET /api/admin/notifications`, `POST /api/admin/notifications/:id/retry`                                                  |

### Fichiers

`uploads/products`, `uploads/categories`, `uploads/quotes`, `uploads/site` sont créés à la demande. Noms UUID, maximum 8 Mo par fichier, 5 par requête. Images JPEG/PNG/WebP décodées puis réencodées en WebP (métadonnées retirées, taille limitée). Les PDF sont autorisés uniquement pour les devis, avec signature `%PDF-` vérifiée. Les fichiers de devis sont servis comme pièces jointes uniquement aux ADMIN/MANAGER authentifiés. Sauvegarder le dossier uploads en même temps que PostgreSQL. La validation de format n’est pas un antivirus ; un scanner de fichiers peut être ajouté selon l’environnement de déploiement.

Les images du catalogue sont des **visuels de présentation générés**, partagés entre certains produits de démonstration. Elles ne remplacent ni le logo officiel ni le fond fourni. Avant une publication commerciale, remplacez-les par les photos des références effectivement vendues et validez les données techniques/prix. Les coordonnées du seed sont des valeurs de démonstration à modifier dans Paramètres du site.

## Vérification

Avec PostgreSQL initialisé et les deux serveurs démarrés :

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm audit
```

Les tests d’intégration utilisent de vrais appels HTTP et PostgreSQL : CRUD, permissions, transactions, concurrence sur la dernière unité, prix falsifiés, coupons expirés/désactivés, promotions, snapshots, idempotence, annulation/restock, devis, contact et notifications. Un serveur SMTP local de test vérifie aussi le message MIME, la non-répétition d’un envoi réussi et les reprises après erreur, sans contacter de boîte mail réelle. Ils suppriment leurs propres enregistrements préfixés `qa-`. Les parcours navigateur créent aussi des commandes de vérification, puis les annulent pour rétablir le stock. Utilisez une base de test/développement, jamais une base contenant des commandes réelles.

Rapport navigateur : `playwright-report/index.html`. Captures et traces : `test-results/`. Ces dossiers sont ignorés par Git.

## Production

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run build
# Depuis server/.env : NODE_ENV=production, origines et PUBLIC_URL=https://votre-domaine
npm run start -w server
```

Express sert aussi `client/dist` en production. Placez-le derrière un proxy HTTPS sur la même origine ; il écoute sur `127.0.0.1:4000`. Réglez `TRUST_PROXY` au nombre réel de proxies de confiance (par exemple `1` avec un proxy local), `PUBLIC_URL` et `CLIENT_ORIGIN`. PostgreSQL ne doit pas être accessible publiquement. Utilisez un gestionnaire de processus, des sauvegardes PostgreSQL/uploads, la rotation des logs, un environnement de staging et une surveillance de `/api/health`/de la file email.

Le catalogue filtre, recherche, trie et pagine dans PostgreSQL, y compris les prix promotionnels. Les horodatages utilisent `timestamptz` pour rester cohérents quel que soit le fuseau du serveur. Les polices sont hébergées localement.

La configuration Helmet/CORS, la validation Zod, les requêtes Prisma paramétrées, le contrôle d’origine des mutations et la limitation des endpoints sensibles sont actifs. Le catalogue public n’expose que les produits/catégories activés. Les pages mettent à jour titre, description, Open Graph et canonical ; le sitemap est généré depuis PostgreSQL sur `/sitemap.xml`, avec `robots.txt` dans le client. Il s’agit d’une SPA : pour un besoin SEO nécessitant un HTML produit complet avant JavaScript, ajouter un rendu serveur ou un prérendu branché sur l’API.

Aucun secret réel ne doit être ajouté à Git. `.env`, données PostgreSQL locales, uploads, builds et rapports de tests sont exclus. Les dépendances sont verrouillées dans `package-lock.json`; deux overrides ciblés corrigent les dépendances transitives de la CLI Prisma 6 sans changer la version de son moteur.

Les prompts et la provenance des visuels générés sont documentés dans [assets/catalog/PROVENANCE.md](assets/catalog/PROVENANCE.md).
