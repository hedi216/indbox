# IN-D-BOX

Application e-commerce complète : boutique React, administration, API Express et PostgreSQL. `assets/` conserve le logo et le fond officiels ; `exemple/` reste intact et sert de référence visuelle. Les produits, catégories, prix, variantes, promotions, commandes, clients et contenus administrables proviennent d’une **seule base PostgreSQL**.

## Démarrage rapide

Prérequis : **Node.js 22.12+**, npm 10+, **PostgreSQL 16+**. Aucun service payant ni accès SMTP n’est nécessaire pour développer.

```sh
npm ci
cp server/.env.example server/.env
```

Pour le développement local uniquement, modifiez `server/.env` : connexion PostgreSQL, `CLIENT_ORIGIN=http://localhost:5175,http://127.0.0.1:5175`, `PUBLIC_URL=http://localhost:5175` et secret JWT aléatoire. Les exemples indiquent le domaine de production mais ne doivent jamais remplacer son fichier `.env`. Générer un secret :

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

Ces identifiants sont **uniquement destinés au développement**. Ne lancez jamais le seed sur la production existante. La connexion utilise bcrypt (coût 12), JWT signé HS256 de 8 heures, cookie HTTP-only, SameSite=Lax, Secure en production. La déconnexion et les modifications d’accès révoquent les sessions via `tokenVersion`. Aucun JWT n’est conservé dans localStorage.

### Droits

| Section                                                                 | ADMIN | MANAGER |
| ----------------------------------------------------------------------- | ----- | ------- |
| Dashboard, produits, commandes, devis, clients, promotions, coupons     | Oui   | Oui     |
| Catégories, services, messages, paramètres, utilisateurs, notifications | Oui   | Non     |

Les contrôles sont effectués par le serveur. Un client peut créer un compte, se connecter, modifier son profil et consulter uniquement ses propres commandes. La commande invitée reste disponible. Une adresse email déjà utilisée pour une commande invitée ne peut pas être automatiquement revendiquée par un nouveau compte : la liaison avec cet historique se fait uniquement après vérification de l’adresse email.

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
SMTP_HOST=127.0.0.1
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM="IN-D-BOX <no-reply@indbox.tn>"
MAIL_REPLY_TO=
MAIL_DELIVERY_ENABLED=false
MAIL_DELIVERY_NOT_BEFORE=
PUBLIC_URL=https://indbox.tn
CLIENT_ORIGIN=https://indbox.tn
ADMIN_NOTIFICATION_EMAIL=equipe@votre-domaine.tld
```

- Production actuelle : MailEnable Standard sur `127.0.0.1:25`, sans authentification ni TLS sur cette connexion locale uniquement. Les relais distants en production exigent toujours TLS (587 STARTTLS ou 465 avec `SMTP_SECURE=true`).
- Les identifiants SMTP seuls ne déclenchent aucun envoi. L’activation manuelle exige `MAIL_DELIVERY_ENABLED=true` et un seuil UTC ISO `MAIL_DELIVERY_NOT_BEFORE`. Seuls les messages créés à partir de ce seuil sont éligibles, y compris lors des relances et reprises. Le worker les traite toutes les 15 secondes, 20 maximum par passage. Voir [DEPLOYMENT.md](DEPLOYMENT.md).
- L’administration **Notifications email** montre destinataire, sujet, état, tentatives et dernière erreur, avec recherche, filtres et aperçu HTML/texte. « Relancer » remet un message en file ; un email déjà envoyé nécessite confirmation avant renvoi.
- 5 tentatives maximum avec délai exponentiel, puis `FAILED`. Réessayez depuis l’admin après correction.
- Verrouillage PostgreSQL `FOR UPDATE SKIP LOCKED` : plusieurs processus peuvent fonctionner sans prendre simultanément le même message. Les envois bloqués sont repris après 5 minutes.
- Déduplication des événements en base et `Message-ID` stable. Comme tout envoi SMTP, un arrêt entre acceptation par le fournisseur et confirmation en base peut exceptionnellement provoquer un renvoi : ce système garantit la reprise, pas une livraison exactement une fois.
- L’opérateur a confirmé la réception Gmail depuis MailEnable et la configuration SPF/DKIM/DMARC existante. La validation finale reste manuelle ; aucun changement DNS ou activation d’envoi n’est automatisé.
- Conservez l’historique : les anciens messages restent en base et sont bloqués par le seuil, sans suppression. Ne reculez jamais ce seuil pour libérer la file. Les tests utilisent une base isolée et un SMTP local.
- Tous les emails HTML et texte se terminent par « Email généré par BizzRes, une solution de Comeleon Studio. » puis https://www.comeleonstudio.com. La signature est centralisée dans `mail-policy.ts`, à la création et à l’envoi.
- Aucun compte mail dédié n’est requis pour `no-reply@indbox.tn`. Le domaine doit être vérifié par le fournisseur sortant. `contact@indbox.tn` reste une adresse prévue tant que sa réception ou redirection n’est pas validée.

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

La production existe déjà sur **https://indbox.tn**, sur Contabo Windows avec NSSM, Cloudflare Tunnel et MailEnable local. Suivez la [checklist manuelle de déploiement](DEPLOYMENT.md). Aucun déploiement automatique, seed, reset de base ou remplacement du `.env` de production. La migration additive **202610090001_account_security** est requise avant le démarrage de cette version.

Express sert `client/dist` en production. Conservez les ports, paramètres NSSM, `TRUST_PROXY`, proxy et redirections canoniques existants.

Le catalogue filtre, recherche, trie et pagine dans PostgreSQL, y compris les prix promotionnels. Les horodatages utilisent `timestamptz` pour rester cohérents quel que soit le fuseau du serveur. Les polices sont hébergées localement.

La configuration Helmet/CORS, la validation Zod, les requêtes Prisma paramétrées, le contrôle d’origine des mutations et la limitation des endpoints sensibles sont actifs. Le catalogue public n’expose que les produits/catégories activés. Les pages mettent à jour titre, description, Open Graph et canonical ; le sitemap est généré depuis PostgreSQL sur `/sitemap.xml`, avec `robots.txt` dans le client. Il s’agit d’une SPA : pour un besoin SEO nécessitant un HTML produit complet avant JavaScript, ajouter un rendu serveur ou un prérendu branché sur l’API.

Aucun secret réel ne doit être ajouté à Git. `.env`, données PostgreSQL locales, uploads, builds et rapports de tests sont exclus. Les dépendances sont verrouillées dans `package-lock.json`; deux overrides ciblés corrigent les dépendances transitives de la CLI Prisma 6 sans changer la version de son moteur.

Les prompts et la provenance des visuels générés sont documentés dans [assets/catalog/PROVENANCE.md](assets/catalog/PROVENANCE.md).

## Sécurité des comptes et notifications internes

Les mots de passe créés ou remplacés exigent 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (72 octets maximum). Les mots de passe existants continuent de fonctionner. La même politique alimente les indicateurs du navigateur et la validation serveur.

L’inscription envoie un email de bienvenue avec vérification (24 h), suivi d’une confirmation après vérification. Les pages `/resend-verification`, `/forgot-password`, `/reset-password` et `/change-password` couvrent les demandes et le changement de mot de passe. Les liens de réinitialisation expirent après une heure et sont à usage unique. Tout changement révoque les anciennes sessions et envoie une confirmation. La vérification ne bloque pas le checkout invité ni les comptes existants.

Dans Utilisateurs, l’administrateur crée un accès ADMIN/MANAGER sans saisir de mot de passe. Le système génère et envoie des identifiants temporaires valables 24 h. Le serveur bloque les autres opérations tant que ce mot de passe n’est pas changé. « Régénérer et envoyer les identifiants » invalide les anciens accès. Chaque employé dispose de six préférences email, désactivées par défaut, avec déduplication des destinataires.

Les alertes de stock sont émises lors du passage sous le seuil inclusif `LOW_STOCK_THRESHOLD` (5 unités de vente par défaut), avec produit/SKU et référence de commande lorsque disponible. Les emails de sécurité sont confidentiels dans l’aperçu administrateur, expirent dans l’outbox et ne peuvent pas être relancés : demandez un nouveau lien ou de nouveaux identifiants.

Validation complète isolée : `npm run test:isolated` (PostgreSQL et Chromium Playwright installés). Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour les prérequis Windows, la migration, les contrôles et le rollback.
