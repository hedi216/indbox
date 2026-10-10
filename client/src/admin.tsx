import { useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Package,
  Layers,
  Tag,
  Ticket,
  Users,
  Wrench,
  Mail,
  Settings,
  Shield,
  LogOut,
  Plus,
  Search,
  ArrowUpRight,
  Menu,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  Save,
  ImagePlus,
  Bell,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { api, send, useApi, useStore, money, date, labels } from "./api";
import { State, Status, Field, ErrorBox, SEO } from "./ui";
import { Pagination, OrderDetail } from "./storefront";
const sections = [
  ["dashboard", "Vue d’ensemble", LayoutDashboard],
  ["orders", "Commandes", ShoppingBag],
  ["quotes", "Demandes de devis", FileText],
  ["products", "Produits", Package],
  ["categories", "Catégories", Layers],
  ["promotions", "Promotions", Tag],
  ["coupons", "Coupons", Ticket],
  ["customers", "Clients", Users],
  ["services", "Services", Wrench],
  ["messages", "Messages", Mail],
  ["notifications", "Notifications email", Bell],
  ["settings", "Paramètres du site", Settings],
  ["users", "Utilisateurs", Shield],
] as const;
const manager = [
  "dashboard",
  "orders",
  "quotes",
  "products",
  "promotions",
  "coupons",
  "customers",
];
export function Admin() {
  const { user, setUser, ready } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  const section = loc.pathname.split("/")[2] || "dashboard";
  const title = sections.find((x) => x[0] === section)?.[1] || "Administration";
  if (!ready) return <State loading />;
  if (!user || user.role === "CUSTOMER") return <AdminLogin />;
  return (
    <div className="admin-app">
      <SEO title={title + " · Administration"} />
      <aside className={"admin-sidebar " + (open ? "open" : "")}>
        <Link className="admin-brand" to="/admin">
          <img src="/assets/logo.png" alt="IN-D-BOX" />
          <span>ESPACE ADMINISTRATION</span>
        </Link>
        <Link to="/change-password">Changer mon mot de passe</Link>
        <p className="sidebar-label">VOTRE BOUTIQUE</p>
        <nav>
          {sections
            .filter(([key]) => user.role === "ADMIN" || manager.includes(key))
            .map(([key, label, Icon]) => (
              <NavLink
                key={key}
                to={"/admin/" + key}
                className={section === key ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/" target="_blank">
            Voir la boutique <ArrowUpRight size={16} />
          </Link>
          <button
            onClick={async () => {
              await send("/auth/logout", {});
              setUser(null);
              navigate("/admin");
            }}
          >
            <LogOut size={17} /> Déconnexion
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label="Menu administration"
          >
            {open ? <X /> : <Menu />}
          </button>
          <span>
            Administration <span className="muted">/ {title}</span>
          </span>
          <div className="admin-user">
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {user.role === "ADMIN" ? "Administrateur" : "Responsable"}
              </small>
            </div>
          </div>
        </header>
        <div className="admin-content" key={section}>
          {section === "dashboard" ? (
            <Dashboard />
          ) : section === "settings" ? (
            <SiteSettings />
          ) : sections.some((x) => x[0] === section) ? (
            <Manager section={section} title={title} />
          ) : (
            <div className="empty">Section introuvable.</div>
          )}
        </div>
      </div>
    </div>
  );
}
function AdminLogin() {
  const { setUser } = useStore();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await send(
        "/auth/login",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      if (r.data.role === "CUSTOMER")
        throw new Error("Un compte administrateur est requis.");
      setUser(r.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <SEO title="Connexion administration" />
      <div className="admin-login-brand">
        <img src="/assets/logo.png" alt="IN-D-BOX" />
        <h1>
          Chaque détail
          <br />
          fait la différence.
        </h1>
        <p>Votre boutique. Vos créations. Votre espace.</p>
      </div>
      <form className="panel" onSubmit={submit}>
        <p className="eyebrow">ADMINISTRATION</p>
        <h2>Bienvenue dans votre espace.</h2>
        <p className="muted">Connectez-vous pour gérer votre boutique.</p>
        <Field label="Email">
          <input type="email" name="email" required autoComplete="username" />
        </Field>
        <Field label="Mot de passe">
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </Field>
        <ErrorBox error={error} />
        <button className="button dark wide" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"} <ArrowUpRight size={18} />
        </button>
        <Link className="text-link" to="/forgot-password">
          Mot de passe oublié ?
        </Link>
        <Link className="text-link" to="/">
          ← Revenir à la boutique
        </Link>
      </form>
    </div>
  );
}
function Dashboard() {
  const r = useApi("/admin/dashboard");
  const d = r.data;
  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">LE POULS DE VOTRE ACTIVITÉ</p>
          <h1>Vue d’ensemble</h1>
          <p className="muted">
            Vos commandes, vos clients et vos prochaines opportunités.
          </p>
        </div>
        <Link className="button dark" to="/admin/products">
          <Plus size={17} /> Gérer mes produits
        </Link>
      </div>
      <State {...r}>
        {d && (
          <>
            <div className="stats-grid">
              {[
                ["Total des commandes", d.orders, ShoppingBag],
                ["Nouvelles commandes", d.statuses.NEW || 0, Clock],
                ["En préparation", d.statuses.IN_PREPARATION || 0, Package],
                ["Commandes livrées", d.statuses.DELIVERED || 0, TrendingUp],
                [
                  "Total des commandes hors annulations",
                  money(d.revenue),
                  TrendingUp,
                ],
                ["Clients", d.customers, Users],
                ["Produits", d.products, Package],
                ["Catégories", d.categories, Layers],
                ["Promotions actives", d.promotions, Tag],
                ["Demandes de devis", d.quotes, FileText],
              ].map(([label, value, Icon]: any) => (
                <div className="stat" key={label}>
                  <span>
                    {label}
                    <Icon size={18} />
                  </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="dashboard-grid">
              <div className="panel">
                <div className="section-head">
                  <h2>Dernières commandes</h2>
                  <Link to="/admin/orders" className="text-link">
                    Tout voir ↗
                  </Link>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Commande</th>
                        <th>Client</th>
                        <th>Statut</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.recentOrders.map((o: any) => (
                        <tr key={o.id}>
                          <td>
                            <Link to={"/admin/orders?q=" + o.number}>
                              <strong>{o.number}</strong>
                            </Link>
                            <small>{date(o.createdAt)}</small>
                          </td>
                          <td>
                            {o.firstName} {o.lastName}
                          </td>
                          <td>
                            <Status status={o.status} />
                          </td>
                          <td>{money(o.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="panel">
                <div className="section-head">
                  <h2>Demandes de devis</h2>
                  <Link className="text-link" to="/admin/quotes">
                    Voir ↗
                  </Link>
                </div>
                {d.recentQuotes.map((q: any) => (
                  <div className="mini-line" key={q.id}>
                    <span>
                      <strong>{q.name}</strong>
                      <small>{q.number}</small>
                    </span>
                    <Status status={q.status} />
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <h2>
                <AlertTriangle size={19} /> Stocks à surveiller
              </h2>
              {!d.lowStock.length && !d.lowVariants.length ? (
                <p className="muted">Aucune alerte de stock.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Variante</th>
                        <th>Stock disponible</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {[...d.lowStock, ...d.lowVariants].map((v: any) => (
                        <tr key={v.id}>
                          <td>{v.product?.name || v.name}</td>
                          <td>{v.product ? v.name : "—"}</td>
                          <td>
                            <span className="badge warning">{v.stock}</span>
                          </td>
                          <td>
                            <Link
                              to={
                                "/admin/products?q=" +
                                encodeURIComponent(v.product?.name || v.name)
                              }
                            >
                              Gérer ↗
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </State>
    </>
  );
}
const editable = [
  "products",
  "categories",
  "promotions",
  "coupons",
  "services",
  "users",
];
function Manager({ section, title }: { section: string; title: string }) {
  const loc = useLocation();
  const { notify } = useStore();
  const [q, setQ] = useState(new URLSearchParams(loc.search).get("q") || ""),
    [search, setSearch] = useState(q),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [filters, setFilters] = useState<any>({}),
    [edit, setEdit] = useState<any>(null),
    [detail, setDetail] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const query = new URLSearchParams({
    q,
    page: String(page),
    limit: "12",
    ...(status ? { status } : {}),
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  });
  const r = useApi("/admin/" + section + "?" + query);
  const options =
    section === "orders"
      ? [
          "NEW",
          "CONFIRMED",
          "IN_PREPARATION",
          "READY",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]
      : section === "quotes"
        ? [
            "NEW",
            "REVIEWING",
            "CONTACTED",
            "QUOTED",
            "ACCEPTED",
            "REJECTED",
            "CLOSED",
          ]
        : section === "messages"
          ? ["NEW", "READ", "ARCHIVED"]
          : section === "notifications"
            ? ["PENDING", "SENDING", "RETRY", "SENT", "FAILED", "CANCELLED"]
            : [];
  async function remove(row: any) {
    if (
      !window.confirm(
        `Supprimer « ${row.name || row.title || row.code} » ? Cette action est définitive.`,
      )
    )
      return;
    try {
      await api("/admin/" + section + "/" + row.id, { method: "DELETE" });
      notify("Élément supprimé");
      r.reload();
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function change(body: any, path = "", method = "PATCH") {
    setBusy(true);
    setError("");
    try {
      const result = await send(
        "/admin/" + section + "/" + detail.id + path,
        body,
        method,
      );
      setDetail({ ...detail, ...result.data });
      r.reload();
      notify("Modification enregistrée");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (edit)
    return (
      <Editor
        section={section}
        initial={edit}
        onCancel={() => setEdit(null)}
        onSaved={() => {
          setEdit(null);
          r.reload();
          notify("Modifications enregistrées");
        }}
      />
    );
  return (
    <>
      <div className="section-head">
        <div>
          <p className="eyebrow">GESTION DE LA BOUTIQUE</p>
          <h1>{title}</h1>
          <p className="muted">{r.meta.total || 0} élément(s)</p>
        </div>
        {editable.includes(section) && (
          <button className="button dark" onClick={() => setEdit({})}>
            <Plus size={17} />{" "}
            {section === "products"
              ? "Ajouter un produit"
              : section === "categories"
                ? "Ajouter une catégorie"
                : "Ajouter"}
          </button>
        )}
      </div>
      {section === "notifications" && (
        <p className="notice">
          {r.meta.smtpConfigured
            ? "Envoi activé : les emails créés à partir du seuil configuré sont traités toutes les 15 secondes."
            : "Envoi désactivé ou configuration incomplète : les emails restent en attente. L’activation nécessite une configuration SMTP validée et un seuil de date ; les anciens emails restent bloqués."}
        </p>
      )}
      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(search);
          setPage(1);
        }}
      >
        <div className="search-field">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher"
          />
        </div>
        {options.length > 0 && (
          <select
            aria-label="Filtrer par statut"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            {options.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        )}
        {section === "orders" && (
          <>
            {[
              ["from", "Date de début", "date"],
              ["to", "Date de fin", "date"],
              ["min", "Montant min.", "number"],
              ["max", "Montant max.", "number"],
            ].map(([k, l, t]) => (
              <Field key={k} label={l}>
                <input
                  type={t}
                  value={filters[k] || ""}
                  onChange={(e) => {
                    setFilters({ ...filters, [k]: e.target.value });
                    setPage(1);
                  }}
                />
              </Field>
            ))}
          </>
        )}
        <button className="button outline">Rechercher</button>
      </form>
      <ErrorBox error={error} />
      <State {...r} empty={!r.data?.length}>
        <div className="panel table-panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns(section).map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {r.data?.map((row: any) => (
                  <tr key={row.id}>
                    <Cells section={section} row={row} />
                    <td>
                      <div className="table-actions">
                        {editable.includes(section) ? (
                          <>
                            <button
                              title="Modifier"
                              aria-label={
                                "Modifier " +
                                (row.name || row.title || row.code)
                              }
                              className="icon-button"
                              onClick={() => setEdit(row)}
                            >
                              <Pencil size={16} />
                            </button>
                            {section !== "users" && (
                              <button
                                title="Supprimer"
                                aria-label="Supprimer"
                                className="icon-button danger"
                                onClick={() => remove(row)}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        ) : section === "notifications" ? (
                          <>
                            <button
                              type="button"
                              className="button small outline"
                              onClick={async () => {
                                try {
                                  const result = await api(
                                    "/admin/notifications/" + row.id,
                                  );
                                  setDetail(result.data);
                                } catch (e: any) {
                                  setError(e.message);
                                }
                              }}
                            >
                              Aperçu
                            </button>
                            <button
                              className="button small outline"
                              disabled={row.status === "SENDING"}
                              onClick={async () => {
                                if (
                                  row.status === "SENT" &&
                                  !confirm("Renvoyer cet email déjà envoyé ?")
                                )
                                  return;
                                try {
                                  await send(
                                    "/admin/notifications/" + row.id + "/retry",
                                    {},
                                  );
                                  r.reload();
                                  notify("Email remis en attente");
                                } catch (e: any) {
                                  setError(e.message);
                                }
                              }}
                            >
                              Relancer
                            </button>
                          </>
                        ) : (
                          <button
                            className="button small outline"
                            onClick={() => setDetail(row)}
                          >
                            Voir le détail
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </State>
      <Pagination meta={r.meta} onPage={setPage} />
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Détails"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Fermer"
              onClick={() => setDetail(null)}
            >
              <X />
            </button>
            <ErrorBox error={error} />
            {section === "notifications" ? (
              <>
                <h2>{detail.subject}</h2>
                <p>Destinataire : {detail.to}</p>
                <Status status={detail.status} />
                <p className="muted">
                  {detail.attempts} tentative(s)
                  {detail.sentAt ? " · Envoyé le " + date(detail.sentAt) : ""}
                </p>
                {detail.lastError && (
                  <p className="notice error">{detail.lastError}</p>
                )}
                <iframe
                  title="Aperçu de l’email"
                  sandbox=""
                  srcDoc={detail.html}
                  style={{
                    width: "100%",
                    height: 600,
                    border: "1px solid #ddd",
                  }}
                />
                <details>
                  <summary>Version texte</summary>
                  <p className="preline">{detail.text}</p>
                </details>
              </>
            ) : section === "orders" ? (
              <>
                <OrderDetail order={detail} />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    change(
                      Object.fromEntries(new FormData(e.currentTarget)),
                      "/status",
                    );
                  }}
                >
                  <h3>Mettre à jour le statut</h3>
                  <Field label="Nouveau statut">
                    <select name="status" required defaultValue="">
                      <option value="" disabled>
                        Choisir une étape
                      </option>
                      {(
                        {
                          NEW: ["CONFIRMED", "CANCELLED"],
                          CONFIRMED: ["IN_PREPARATION", "CANCELLED"],
                          IN_PREPARATION: ["READY", "CANCELLED"],
                          READY: ["SHIPPED", "DELIVERED", "CANCELLED"],
                          SHIPPED: ["DELIVERED"],
                          DELIVERED: [],
                          CANCELLED: [],
                        } as Record<string, string[]>
                      )[detail.status].map((s) => (
                        <option key={s} value={s}>
                          {labels[s]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Note interne">
                    <textarea name="note" />
                  </Field>
                  <button className="button dark" disabled={busy}>
                    Enregistrer et notifier le client
                  </button>
                </form>
              </>
            ) : section === "quotes" ? (
              <>
                <p className="eyebrow">{detail.number}</p>
                <h2>{detail.name}</h2>
                <p>
                  {detail.company} · {detail.phone} · {detail.email}
                </p>
                <Status status={detail.status} />
                {detail.items.map((i: any) => (
                  <div className="panel" key={i.id}>
                    <h3>
                      {i.packagingType} · {i.quantity} pièces
                    </h3>
                    <p>
                      {i.dimensions} · {i.material}
                    </p>
                    <p>
                      {i.printing} · {i.colors}
                    </p>
                  </div>
                ))}
                <p>
                  Livraison souhaitée :{" "}
                  {detail.desiredDeliveryDate
                    ? date(detail.desiredDeliveryDate)
                    : "À définir"}
                </p>
                <p className="preline">{detail.notes}</p>
                <div className="file-links">
                  {detail.files.map((f: string, i: number) => (
                    <a
                      key={f}
                      href={f}
                      target="_blank"
                      rel="noreferrer"
                      className="button outline"
                    >
                      Pièce jointe {i + 1} ↗
                    </a>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    change(Object.fromEntries(new FormData(e.currentTarget)));
                  }}
                >
                  <Field label="Statut">
                    <select name="status" defaultValue={detail.status}>
                      {options.map((s) => (
                        <option key={s} value={s}>
                          {labels[s]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Notes internes (non envoyées au client)">
                    <textarea
                      name="adminNotes"
                      rows={4}
                      defaultValue={detail.adminNotes}
                    />
                  </Field>
                  <button className="button dark" disabled={busy}>
                    Enregistrer et notifier le client
                  </button>
                </form>
              </>
            ) : section === "messages" ? (
              <>
                <h2>{detail.subject}</h2>
                <p>
                  {detail.name} · {detail.email} · {detail.phone}
                </p>
                <p className="preline">{detail.message}</p>
                <Field label="État">
                  <select
                    value={detail.status}
                    onChange={(e) => change({ status: e.target.value })}
                  >
                    {options.map((s) => (
                      <option key={s} value={s}>
                        {labels[s]}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : (
              <>
                <h2>
                  {detail.firstName} {detail.lastName}
                </h2>
                <p>{detail.company}</p>
                <p>
                  {detail.email} · {detail.phone}
                </p>
                <p>{detail._count?.orders} commande(s)</p>
                {detail.addresses?.map((a: any) => (
                  <p key={a.id}>
                    {a.street}, {a.city}
                  </p>
                ))}
                <Link
                  className="button dark"
                  to={"/admin/orders?q=" + encodeURIComponent(detail.email)}
                >
                  Voir ses commandes
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
function columns(section: string) {
  switch (section) {
    case "products":
      return ["Produit", "Catégorie", "Prix", "Stock / variantes", "État"];
    case "categories":
      return ["Catégorie", "Slug", "Produits", "Ordre", "État"];
    case "orders":
      return ["Commande", "Client", "Contact", "Statut", "Total"];
    case "quotes":
      return ["Référence", "Client", "Projet", "Statut", "Date"];
    case "customers":
      return ["Client", "Email", "Téléphone", "Commandes"];
    case "promotions":
      return ["Promotion", "Remise", "Cibles", "Validité", "État"];
    case "coupons":
      return ["Code", "Remise", "Minimum", "Utilisations", "Validité"];
    case "services":
      return ["Service", "Description", "Ordre", "État"];
    case "messages":
      return ["Expéditeur", "Sujet", "Date", "État"];
    case "notifications":
      return ["Email", "Destinataire", "État", "Essais", "Dernière erreur"];
    default:
      return ["Nom", "Email", "Rôle", "État"];
  }
}
function Cells({ section: s, row: r }: { section: string; row: any }) {
  if (s === "products")
    return (
      <>
        <td>
          <div className="table-product">
            {r.images[0] && <img src={r.images[0].url} alt="" />}
            <div>
              <strong>{r.name}</strong>
              <small>{r.sku}</small>
            </div>
          </div>
        </td>
        <td>{r.category.name}</td>
        <td>{money(r.price)}</td>
        <td>
          {r.variants.length ? `${r.variants.length} variantes` : r.stock}
        </td>
        <td>
          <Active value={r.active} />
        </td>
      </>
    );
  if (s === "categories")
    return (
      <>
        <td>
          <strong>{r.name}</strong>
        </td>
        <td>{r.slug}</td>
        <td>{r._count.products}</td>
        <td>{r.displayOrder}</td>
        <td>
          <Active value={r.active} />
        </td>
      </>
    );
  if (s === "orders")
    return (
      <>
        <td>
          <strong>{r.number}</strong>
          <small>{date(r.createdAt)}</small>
        </td>
        <td>
          {r.firstName} {r.lastName}
        </td>
        <td>
          {r.phone}
          <small>{r.email}</small>
        </td>
        <td>
          <Status status={r.status} />
        </td>
        <td>
          <strong>{money(r.total)}</strong>
        </td>
      </>
    );
  if (s === "quotes")
    return (
      <>
        <td>
          <strong>{r.number}</strong>
        </td>
        <td>
          {r.name}
          <small>{r.email}</small>
        </td>
        <td>
          {r.items[0]?.packagingType}
          <small>{r.items[0]?.quantity} pièces</small>
        </td>
        <td>
          <Status status={r.status} />
        </td>
        <td>{date(r.createdAt)}</td>
      </>
    );
  if (s === "customers")
    return (
      <>
        <td>
          {r.firstName} {r.lastName}
          <small>{r.company}</small>
        </td>
        <td>{r.email}</td>
        <td>{r.phone}</td>
        <td>{r._count.orders}</td>
      </>
    );
  if (s === "promotions")
    return (
      <>
        <td>
          <strong>{r.name}</strong>
        </td>
        <td>
          {r.type === "PERCENTAGE" ? Number(r.value) + " %" : money(r.value)}
        </td>
        <td>
          {r.global
            ? "Toute la boutique"
            : [...r.products, ...r.categories]
                .map((x: any) => x.name)
                .join(", ")}
        </td>
        <td>
          {date(r.startsAt)}
          <small>au {date(r.endsAt)}</small>
        </td>
        <td>
          <Active value={r.active} />
        </td>
      </>
    );
  if (s === "coupons")
    return (
      <>
        <td>
          <strong>{r.code}</strong>
          <small>{r.active ? "Activé" : "Désactivé"}</small>
        </td>
        <td>
          {r.type === "PERCENTAGE" ? Number(r.value) + " %" : money(r.value)}
        </td>
        <td>{money(r.minimumOrder)}</td>
        <td>
          {r.usageCount} / {r.usageLimit || "∞"}
        </td>
        <td>
          {date(r.startsAt)}
          <small>au {date(r.endsAt)}</small>
        </td>
      </>
    );
  if (s === "services")
    return (
      <>
        <td>
          <strong>{r.title}</strong>
        </td>
        <td>{r.description}</td>
        <td>{r.displayOrder}</td>
        <td>
          <Active value={r.active} />
        </td>
      </>
    );
  if (s === "messages")
    return (
      <>
        <td>
          {r.name}
          <small>{r.email}</small>
        </td>
        <td>{r.subject}</td>
        <td>{date(r.createdAt)}</td>
        <td>
          <Status status={r.status} />
        </td>
      </>
    );
  if (s === "notifications")
    return (
      <>
        <td>
          {r.subject}
          <small>{date(r.createdAt)}</small>
        </td>
        <td>{r.to}</td>
        <td>
          <Status status={r.status} />
        </td>
        <td>{r.attempts}</td>
        <td>{r.lastError || "—"}</td>
      </>
    );
  return (
    <>
      <td>{r.name}</td>
      <td>{r.email}</td>
      <td>{r.role}</td>
      <td>
        <Active value={r.active} />
      </td>
    </>
  );
}
function Active({ value }: { value: boolean }) {
  return (
    <span
      className={"badge " + (value ? "status-DELIVERED" : "status-CANCELLED")}
    >
      {value ? "Actif" : "Inactif"}
    </span>
  );
}
const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const baseProduct = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  price: 0,
  active: true,
  featured: false,
  isNew: false,
  trackStock: true,
  stock: 0,
  minimumQuantity: 1,
  orderUnit: "UNIT",
  quantityPerLot: 1,
  seoTitle: "",
  seoDescription: "",
  specifications: {},
  tags: [],
  images: [],
  variants: [],
  relatedIds: [],
};
const baseVariant = {
  name: "",
  sku: "",
  price: 0,
  compareAtPrice: null,
  stock: 0,
  size: "",
  dimensions: "",
  color: "",
  material: "",
  minimumQuantity: 1,
  quantityPerLot: 1,
  active: true,
};
function defaultData(section: string) {
  if (section === "products") return baseProduct;
  if (section === "categories")
    return {
      name: "",
      slug: "",
      description: "",
      image: null,
      active: true,
      featured: false,
      displayOrder: 0,
      seoTitle: "",
      seoDescription: "",
      parentId: null,
    };
  if (section === "services")
    return {
      title: "",
      description: "",
      image: null,
      icon: "Package",
      displayOrder: 0,
      active: true,
    };
  if (section === "users")
    return {
      name: "",
      email: "",
      notificationPreferences: {},
      role: "MANAGER",
      active: true,
    };
  return {
    ...{
      type: "PERCENTAGE",
      value: 10,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      active: true,
    },
    ...(section === "coupons"
      ? { code: "", minimumOrder: 0, usageLimit: null, perCustomerLimit: null }
      : { name: "", global: false, productIds: [], categoryIds: [] }),
  };
}
function Editor({
  section,
  initial,
  onCancel,
  onSaved,
}: {
  section: string;
  initial: any;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { user } = useStore();
  const [d, setD] = useState<any>({
    ...defaultData(section),
    ...initial,
    ...(section === "products"
      ? { relatedIds: initial.related?.map((x: any) => x.id) || [] }
      : {}),
    ...(section === "promotions"
      ? {
          productIds: initial.products?.map((x: any) => x.id) || [],
          categoryIds: initial.categories?.map((x: any) => x.id) || [],
        }
      : {}),
    ...(section === "users" ? { password: "" } : {}),
  });
  const [tab, setTab] = useState("Général"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { notify } = useStore();
  const options = useApi("/admin/options");
  const cats = { data: options.data?.categories };
  const products = { data: options.data?.products };
  const set = (k: string, v: any) => setD((old: any) => ({ ...old, [k]: v }));
  function field(k: string, label: string, type = "text", required = false) {
    return (
      <Field label={label} key={k}>
        <input
          type={type}
          value={d[k] ?? ""}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "0.001" : undefined}
          onChange={(e) => {
            const value =
              type === "number"
                ? e.target.value === ""
                  ? null
                  : Number(e.target.value)
                : e.target.value;
            setD((old: any) => ({
              ...old,
              [k]: value,
              ...(k === "name" && !initial.id
                ? { slug: slugify(String(value)) }
                : {}),
            }));
          }}
        />
      </Field>
    );
  }
  function textarea(k: string, l: string) {
    return (
      <Field label={l}>
        <textarea
          value={d[k] || ""}
          rows={4}
          onChange={(e) => set(k, e.target.value)}
        />
      </Field>
    );
  }
  function check(k: string, l: string) {
    return (
      <label className="checkbox">
        <input
          type="checkbox"
          checked={!!d[k]}
          onChange={(e) => set(k, e.target.checked)}
        />
        {l}
      </label>
    );
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...d };
      if (section === "users" && !body.password) delete body.password;
      await send(
        "/admin/" + section + (initial.id ? "/" + initial.id : ""),
        body,
        initial.id ? "PUT" : "POST",
      );
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const tabs = [
    "Général",
    "Images",
    "Tarification",
    "Stock",
    "Variantes",
    "Spécifications",
    "SEO",
  ];
  return (
    <form onSubmit={submit}>
      <div className="editor-head">
        <div>
          <button type="button" className="link-button" onClick={onCancel}>
            <ChevronLeft size={16} /> Retour à la liste
          </button>
          <h1>
            {initial.id ? "Modifier" : "Créer"}{" "}
            {section === "products"
              ? "un produit"
              : section === "categories"
                ? "une catégorie"
                : section === "services"
                  ? "un service"
                  : section === "users"
                    ? "un utilisateur"
                    : section === "coupons"
                      ? "un coupon"
                      : "une promotion"}
          </h1>
        </div>
        <div className="row">
          <button type="button" className="button outline" onClick={onCancel}>
            Annuler
          </button>
          <button className="button dark" disabled={busy}>
            <Save size={17} />
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
      <ErrorBox error={error} />
      {section === "products" ? (
        <>
          <div className="editor-tabs">
            {tabs.map((t) => (
              <button
                className={t === tab ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="panel">
            {tab === "Général" && (
              <>
                <h2>Informations générales</h2>
                <div className="form-grid">
                  {field("name", "Nom du produit", "text", true)}
                  {field("slug", "Slug / URL", "text", true)}
                  {field("sku", "Référence SKU", "text", true)}
                  <Field label="Catégorie">
                    <select
                      value={d.categoryId}
                      required
                      onChange={(e) => set("categoryId", e.target.value)}
                    >
                      <option value="">Choisir une catégorie</option>
                      {cats.data?.map((c: any) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                {textarea("shortDescription", "Description courte")}
                {textarea("description", "Description détaillée")}
                <div className="checks">
                  {check("active", "Visible sur la boutique")}
                  {check("featured", "Produit à la une")}
                  {check("isNew", "Nouveau produit")}
                </div>
                <Field label="Tags (séparés par des virgules)">
                  <input
                    value={d.tags.join(", ")}
                    onChange={(e) =>
                      set(
                        "tags",
                        e.target.value
                          .split(",")
                          .map((v) => v.trim().toLowerCase()),
                      )
                    }
                  />
                </Field>
                <MultiSelect
                  label="Produits associés"
                  options={
                    products.data?.filter((p: any) => p.id !== initial.id) || []
                  }
                  value={d.relatedIds}
                  onChange={(v) => set("relatedIds", v)}
                />
              </>
            )}
            {tab === "Images" && (
              <>
                <h2>Galerie du produit</h2>
                <p className="muted">
                  La première image est l’image principale. Vous pouvez
                  réorganiser les images.
                </p>
                <ImageEditor
                  folder="products"
                  images={d.images}
                  onChange={(v) => set("images", v)}
                />
              </>
            )}
            {tab === "Tarification" && (
              <>
                <h2>Prix & conditionnement</h2>
                <p className="notice">
                  Si le produit a des variantes, le prix de chaque variante
                  remplace le prix de base. Le stock et la quantité sont
                  exprimés dans l’unité de vente choisie.
                </p>
                <div className="form-grid">
                  {field("price", "Prix de base (TND)", "number", true)}
                  <Field label="Unité de vente">
                    <select
                      value={d.orderUnit}
                      onChange={(e) => set("orderUnit", e.target.value)}
                    >
                      <option value="UNIT">À l’unité</option>
                      <option value="LOT">Par lot</option>
                    </select>
                  </Field>
                  {field("quantityPerLot", "Pièces par lot", "number", true)}
                  {field(
                    "minimumQuantity",
                    "Minimum de commande (unités ou lots)",
                    "number",
                    true,
                  )}
                </div>
              </>
            )}
            {tab === "Stock" && (
              <>
                <h2>Inventaire</h2>
                {check(
                  "trackStock",
                  "Suivre le stock et empêcher les surventes",
                )}
                {field(
                  "stock",
                  "Stock du produit sans variantes (unités ou lots)",
                  "number",
                  true,
                )}
                <p className="muted">
                  Le stock des variantes est géré dans l’onglet Variantes.
                </p>
              </>
            )}
            {tab === "Variantes" && (
              <>
                <div className="section-head">
                  <div>
                    <h2>Les variantes de votre produit</h2>
                    <p className="muted">
                      Un format, une matière ou une couleur : chaque variante a
                      son prix et son stock.
                    </p>
                  </div>
                  <button
                    className="button outline"
                    type="button"
                    onClick={() =>
                      set("variants", [
                        ...d.variants,
                        { ...baseVariant, quantityPerLot: d.quantityPerLot },
                      ])
                    }
                  >
                    <Plus size={17} /> Ajouter une variante
                  </button>
                </div>
                {d.variants.map((v: any, i: number) => (
                  <div className="variant-editor" key={v.id || i}>
                    <div className="row">
                      <h3>
                        Variante {i + 1} {v.name && "· " + v.name}
                      </h3>
                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label="Retirer la variante"
                        onClick={() => {
                          if (
                            confirm(
                              "Retirer cette variante ? Son historique de commande sera conservé.",
                            )
                          )
                            set(
                              "variants",
                              d.variants.filter((_: any, n: number) => n !== i),
                            );
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="form-grid three">
                      {[
                        ["name", "Nom", "text"],
                        ["sku", "SKU", "text"],
                        ["price", "Prix (TND)", "number"],
                        [
                          "compareAtPrice",
                          "Ancien prix (facultatif)",
                          "number",
                        ],
                        ["stock", "Stock", "number"],
                        ["size", "Taille", "text"],
                        ["dimensions", "Dimensions", "text"],
                        ["color", "Couleur", "text"],
                        ["material", "Matière / épaisseur", "text"],
                        ["minimumQuantity", "Quantité minimum", "number"],
                        ["quantityPerLot", "Pièces par lot", "number"],
                      ].map(([k, l, t]) => (
                        <Field key={k} label={l}>
                          <input
                            value={v[k] ?? ""}
                            type={t}
                            step={t === "number" ? "0.001" : undefined}
                            min={t === "number" ? 0 : undefined}
                            required={[
                              "name",
                              "sku",
                              "price",
                              "stock",
                              "minimumQuantity",
                              "quantityPerLot",
                            ].includes(k)}
                            onChange={(e) =>
                              set(
                                "variants",
                                d.variants.map((x: any, n: number) =>
                                  n === i
                                    ? {
                                        ...x,
                                        [k]:
                                          t === "number"
                                            ? e.target.value === ""
                                              ? null
                                              : Number(e.target.value)
                                            : e.target.value,
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </Field>
                      ))}
                    </div>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) =>
                          set(
                            "variants",
                            d.variants.map((x: any, n: number) =>
                              n === i ? { ...x, active: e.target.checked } : x,
                            ),
                          )
                        }
                      />
                      Variante disponible
                    </label>
                  </div>
                ))}
              </>
            )}
            {tab === "Spécifications" && (
              <>
                <h2>Caractéristiques sur mesure</h2>
                <Specifications
                  value={d.specifications}
                  onChange={(v) => set("specifications", v)}
                />
              </>
            )}
            {tab === "SEO" && (
              <>
                <h2>Référencement</h2>
                {field("seoTitle", "Titre SEO")}
                {textarea("seoDescription", "Description SEO")}
                <div className="seo-preview">
                  <strong>{d.seoTitle || d.name}</strong>
                  <small>
                    {location.origin}/product/{d.slug}
                  </small>
                  <p>{d.seoDescription || d.shortDescription}</p>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="panel editor-generic">
          {section === "categories" && (
            <>
              <div className="form-grid">
                {field("name", "Nom", "text", true)}
                {field("slug", "Slug", "text", true)}
                {field("displayOrder", "Ordre d’affichage", "number")}
                <Field label="Catégorie parente">
                  <select
                    value={d.parentId || ""}
                    onChange={(e) => set("parentId", e.target.value || null)}
                  >
                    <option value="">Aucune</option>
                    {cats.data
                      ?.filter((c: any) => c.id !== initial.id)
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
              {textarea("description", "Description")}
              <div className="checks">
                {check("active", "Catégorie visible")}
                {check("featured", "Afficher en page d’accueil")}
              </div>
              <h3>Image</h3>
              <ImageEditor
                folder="categories"
                images={d.image ? [{ url: d.image, alt: d.name }] : []}
                onChange={(v) => set("image", v[0]?.url || null)}
                single
              />
              {field("seoTitle", "Titre SEO")}
              {textarea("seoDescription", "Description SEO")}
            </>
          )}
          {section === "services" && (
            <>
              {field("title", "Titre", "text", true)}
              {textarea("description", "Description")}
              <div className="form-grid">
                <Field label="Icône">
                  <select
                    value={d.icon}
                    onChange={(e) => set("icon", e.target.value)}
                  >
                    {[
                      "Package",
                      "Layers",
                      "PenTool",
                      "ShoppingBag",
                      "ShieldCheck",
                      "Truck",
                    ].map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </Field>
                {field("displayOrder", "Ordre d’affichage", "number")}
              </div>
              {check("active", "Service visible")}
              <ImageEditor
                folder="site"
                images={d.image ? [{ url: d.image, alt: d.title }] : []}
                onChange={(v) => set("image", v[0]?.url || null)}
                single
              />
            </>
          )}
          {section === "users" && (
            <>
              <div className="form-grid">
                {field("name", "Nom", "text", true)}
                {field("email", "Email", "email", true)}
                <Field label="Rôle">
                  <select
                    value={d.role}
                    onChange={(e) => set("role", e.target.value)}
                  >
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </Field>
              </div>
              {check("active", "Accès activé")}
              <p>
                Un mot de passe temporaire est généré et envoyé automatiquement
                à la création. Il expire après 24 heures et doit être remplacé à
                la première connexion.
              </p>
              <fieldset>
                <legend>Notifications de cet utilisateur</legend>
                {Object.entries({
                  newOrders: "Nouvelles commandes",
                  orderStatus: "Statuts des commandes",
                  newQuotes: "Nouveaux devis",
                  quoteStatus: "Statuts des devis",
                  contacts: "Messages de contact",
                  lowStock: "Stock faible",
                }).map(([key, label]) => (
                  <label key={key} className="check">
                    <input
                      type="checkbox"
                      checked={d.notificationPreferences?.[key] === true}
                      onChange={(e) =>
                        set("notificationPreferences", {
                          ...d.notificationPreferences,
                          [key]: e.target.checked,
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              {initial.id && (
                <button
                  type="button"
                  className="button outline"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Invalider les identifiants et sessions précédents, puis envoyer de nouveaux identifiants valables 24 heures ?",
                      )
                    )
                      return;
                    try {
                      const r = await send(
                        `/admin/users/${initial.id}/credentials`,
                        {},
                      );
                      notify(r.data.message);
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  Régénérer et envoyer les identifiants
                </button>
              )}
            </>
          )}
          {["coupons", "promotions"].includes(section) && (
            <>
              <div className="form-grid">
                {section === "coupons"
                  ? field("code", "Code coupon", "text", true)
                  : field("name", "Nom de la promotion", "text", true)}
                <Field label="Type de remise">
                  <select
                    value={d.type}
                    onChange={(e) => set("type", e.target.value)}
                  >
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED">Montant fixe (TND)</option>
                  </select>
                </Field>
                {field(
                  "value",
                  d.type === "PERCENTAGE" ? "Remise (%)" : "Remise (TND)",
                  "number",
                  true,
                )}
                {["startsAt", "endsAt"].map((k) => (
                  <Field label={k === "startsAt" ? "Début" : "Fin"} key={k}>
                    <input
                      type="datetime-local"
                      required
                      value={localDate(d[k])}
                      onChange={(e) =>
                        set(
                          k,
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        )
                      }
                    />
                  </Field>
                ))}
              </div>
              {check("active", "Activé")}
              {section === "coupons" ? (
                <>
                  <div className="form-grid">
                    {field(
                      "minimumOrder",
                      "Montant minimum après promotions (TND)",
                      "number",
                    )}
                    {field(
                      "usageLimit",
                      "Limite totale (vide = illimité)",
                      "number",
                    )}
                    {field(
                      "perCustomerLimit",
                      "Limite par email (vide = illimité)",
                      "number",
                    )}
                  </div>
                  {initial.id && (
                    <p>{initial.usageCount} utilisation(s) enregistrée(s)</p>
                  )}
                </>
              ) : (
                <>
                  {check("global", "Appliquer à toute la boutique")}
                  {!d.global && (
                    <div className="form-grid">
                      <MultiSelect
                        label="Produits ciblés"
                        options={products.data || []}
                        value={d.productIds}
                        onChange={(v) => set("productIds", v)}
                      />
                      <MultiSelect
                        label="Catégories ciblées"
                        options={cats.data || []}
                        value={d.categoryIds}
                        onChange={(v) => set("categoryIds", v)}
                      />
                    </div>
                  )}
                  <p className="notice">
                    La meilleure promotion s’applique à chaque article. Les
                    promotions ne se cumulent pas entre elles ; un coupon peut
                    ensuite s’appliquer au panier.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}
function localDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: any[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="multi-select">
      <legend>{label}</legend>
      {options.map((o) => (
        <label className="checkbox" key={o.id}>
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, o.id]
                  : value.filter((v) => v !== o.id),
              )
            }
          />
          {o.name}
        </label>
      ))}
    </fieldset>
  );
}
function Specifications({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const [rows, setRows] = useState<string[][]>(() => Object.entries(value));
  function change(next: string[][]) {
    setRows(next);
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())));
  }
  return (
    <>
      <p className="muted">
        Ajoutez les caractéristiques adaptées à ce produit : matériau,
        épaisseur, fermeture, capacité…
      </p>
      {rows.map(([k, v], i) => (
        <div className="spec-row" key={i}>
          <input
            placeholder="Caractéristique"
            aria-label="Caractéristique"
            value={k}
            onChange={(e) =>
              change(rows.map((r, n) => (n === i ? [e.target.value, v] : r)))
            }
          />
          <input
            placeholder="Valeur"
            aria-label="Valeur"
            value={v}
            onChange={(e) =>
              change(rows.map((r, n) => (n === i ? [k, e.target.value] : r)))
            }
          />
          <button
            type="button"
            className="icon-button danger"
            onClick={() => change(rows.filter((_, n) => n !== i))}
            aria-label="Retirer la caractéristique"
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button outline"
        onClick={() => change([...rows, ["", ""]])}
      >
        <Plus size={16} /> Ajouter une caractéristique
      </button>
    </>
  );
}
function ImageEditor({
  folder,
  images,
  onChange,
  single = false,
}: {
  folder: string;
  images: any[];
  onChange: (v: any[]) => void;
  single?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(files: FileList | null) {
    if (!files) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, single ? 1 : 5)
        .forEach((f) => form.append("files", f));
      const r = await api("/uploads/" + folder, { method: "POST", body: form });
      onChange([
        ...(single ? [] : images),
        ...r.data.map((url: string) => ({ url, alt: "" })),
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <label className="upload-zone">
        <ImagePlus size={26} />
        <strong>
          {busy
            ? "Téléchargement en cours…"
            : "Ajouter " + (single ? "une image" : "des images")}
        </strong>
        <span>JPG, PNG, WebP · 8 Mo maximum par image</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={!single}
          disabled={busy}
          onChange={(e) => upload(e.target.files)}
        />
      </label>
      <ErrorBox error={error} />
      <div className="image-editor-grid">
        {images.map((img, i) => (
          <div key={img.url}>
            <img src={img.url} alt={img.alt} />
            <input
              aria-label="Texte alternatif"
              placeholder="Texte alternatif de l’image"
              value={img.alt || ""}
              onChange={(e) =>
                onChange(
                  images.map((x, n) =>
                    n === i ? { ...x, alt: e.target.value } : x,
                  ),
                )
              }
            />
            <div className="row">
              {i === 0 && <small>Image principale</small>}
              {i > 0 && (
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    onChange([img, ...images.filter((_, n) => n !== i)])
                  }
                >
                  En première
                </button>
              )}
              <button
                type="button"
                className="icon-button danger"
                aria-label="Retirer l’image"
                onClick={() => onChange(images.filter((_, n) => n !== i))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
function SiteSettings() {
  const r = useApi("/admin/settings");
  return <State {...r}>{r.data && <SettingsForm initial={r.data} />}</State>;
}
function SettingsForm({ initial }: { initial: any }) {
  const [d, setD] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { notify, settingsState } = useStore();
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await send("/admin/settings", d, "PUT");
      notify("Paramètres enregistrés");
      settingsState.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="section-head">
        <div>
          <p className="eyebrow">VOTRE IDENTITÉ</p>
          <h1>Paramètres du site</h1>
        </div>
        <button className="button dark" disabled={busy}>
          <Save size={17} /> Enregistrer
        </button>
      </div>
      <ErrorBox error={error} />
      <div className="panel">
        <h2>Coordonnées & réseaux</h2>
        <div className="form-grid">
          {[
            ["phone", "Téléphone"],
            ["email", "Email"],
            ["address", "Adresse"],
            ["instagram", "Instagram (URL)"],
            ["facebook", "Facebook (URL)"],
          ].map(([k, l]) => (
            <Field label={l} key={k}>
              <input
                value={d[k] || ""}
                onChange={(e) => setD({ ...d, [k]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <h2>Page d’accueil</h2>
        {[
          ["heroTitle", "Titre principal"],
          ["heroSubtitle", "Sous-titre"],
          ["heroCta", "Texte du bouton"],
          ["companyDescription", "Présentation de l’entreprise"],
          ["footerText", "Texte du pied de page"],
        ].map(([k, l]) => (
          <Field label={l} key={k}>
            <textarea
              rows={k === "companyDescription" ? 5 : 2}
              value={d[k] || ""}
              onChange={(e) => setD({ ...d, [k]: e.target.value })}
            />
          </Field>
        ))}
        <h3>Image principale</h3>
        <ImageEditor
          folder="site"
          images={[{ url: d.heroBackground, alt: "Image principale" }]}
          onChange={(v) => {
            if (v[0]) setD({ ...d, heroBackground: v[0].url });
          }}
          single
        />
      </div>
    </form>
  );
}
