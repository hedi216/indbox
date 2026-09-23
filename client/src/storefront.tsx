import { useState, useEffect, type FormEvent } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Package,
  PenTool,
  Layers,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { api, send, useApi, useStore, money, date } from "./api";
import {
  SEO,
  State,
  ProductCard,
  SectionHead,
  Field,
  ErrorBox,
  Status,
} from "./ui";
export function Layout() {
  const { cart, settings: s } = useStore();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(false);
  const loc = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    setSearch(false);
  }, [loc.pathname]);
  return (
    <>
      <div className="topbar">
        <span>PACKAGING & PERSONNALISATION · TUNISIE</span>
        <Link to="quote">
          Votre projet, notre savoir-faire <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="IN-D-BOX accueil">
          <img src="/assets/logo.png" alt="IN-D-BOX" />
        </Link>
        <nav className={open ? "open" : ""}>
          {[
            ["/", "Accueil"],
            ["/products", "Produits"],
            ["/categories", "Catalogue"],
            ["/services", "Services"],
            ["/about", "À propos"],
            ["/contact", "Contact"],
          ].map(([url, label]) => (
            <NavLink end={url === "/"} to={url} key={url}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label="Rechercher"
            onClick={() => setSearch(!search)}
          >
            <Search size={20} />
          </button>
          <Link
            className="icon-button account-link"
            aria-label="Mon compte"
            to="/account"
          >
            <User size={20} />
          </Link>
          <Link
            className="icon-button cart-icon"
            aria-label="Panier"
            to="/cart"
          >
            <ShoppingBag size={20} />
            <sup>
              {cart.items.reduce((n: number, i: any) => n + i.quantity, 0)}
            </sup>
          </Link>
          <Link className="button small nav-quote" to="/quote">
            Demander un devis <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {search && (
        <form
          className="searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") || "");
            setSearch(false);
            navigate("/products?q=" + encodeURIComponent(q));
          }}
        >
          <Search />
          <input
            autoFocus
            name="q"
            placeholder="Rechercher un produit, une matière, une référence…"
          />
          <button>Rechercher</button>
        </form>
      )}
      <main>
        <Outlet />
      </main>
      <section className="contact-banner">
        <div>
          <p className="eyebrow">UNE IDÉE EN TÊTE ?</p>
          <h2>Donnons forme à votre projet.</h2>
        </div>
        <Link className="button" to="quote">
          Parlons de votre packaging <ArrowUpRight size={20} />
        </Link>
      </section>
      <footer>
        <div className="footer-grid">
          <div>
            <img
              className="footer-logo"
              src="/assets/logo.png"
              alt="IN-D-BOX"
            />
            <p>{s?.footerText}</p>
          </div>
          <div>
            <h4>Explorer</h4>
            <Link to="products">Nos produits</Link>
            <Link to="categories">Nos collections</Link>
            <Link to="services">Nos services</Link>
            <Link to="about">Notre histoire</Link>
          </div>
          <div>
            <h4>À votre écoute</h4>
            <Link to="quote">Demander un devis</Link>
            <Link to="contact">Nous contacter</Link>
            <Link to="account">Mon compte</Link>
            <Link to="cart">Mon panier</Link>
          </div>
          <div>
            <h4>Restons en contact</h4>
            <a href={"tel:" + s?.phone}>{s?.phone}</a>
            <a href={"mailto:" + s?.email}>{s?.email}</a>
            <p>{s?.address}</p>
            {s?.instagram && <a href={s.instagram}>Instagram ↗</a>}
            {s?.facebook && <a href={s.facebook}>Facebook ↗</a>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} IN-D-BOX. Tous droits réservés.
          </span>
          <span>BOXES THAT STAND OUT.</span>
          <Link to="/admin">Administration</Link>
        </div>
      </footer>
    </>
  );
}
export function Home() {
  const { settings: s, settingsState } = useStore();
  const cats = useApi("/categories"),
    products = useApi("/products?featured=true&limit=4"),
    fresh = useApi("/products?new=true&limit=4"),
    services = useApi("/services");
  return (
    <>
      <SEO title="Des packagings qui font la différence" />
      <State loading={settingsState.loading} error={settingsState.error}>
        {s && (
          <section
            className="hero"
            style={{
              backgroundImage: `linear-gradient(90deg,rgba(10,10,8,.70),rgba(10,10,8,.25) 49%,transparent 73%),url('${s.heroBackground}')`,
            }}
          >
            <div className="hero-copy">
              <p className="eyebrow">
                <span />
                L’ART DU PACKAGING, LA FORCE DE VOTRE MARQUE
              </p>
              <h1>
                {s.heroTitle.split("packaging")[0]}
                {s.heroTitle.includes("packaging") && (
                  <>
                    <em>packaging</em>
                    {s.heroTitle.split("packaging").slice(1).join("packaging")}
                  </>
                )}
              </h1>
              <p>{s.heroSubtitle}</p>
              <div className="hero-actions">
                <Link className="button" to="/products">
                  {s.heroCta} <ArrowRight size={18} />
                </Link>
                <Link className="hero-secondary" to="/quote">
                  Créer mon packaging <ArrowUpRight size={18} />
                </Link>
              </div>
              <p className="hero-note">
                PENSÉ POUR VOTRE MARQUE. FAIT POUR SE DÉMARQUER.
              </p>
            </div>
            <div className="hero-bottom">
              <span>01 — L’EMBALLAGE DEVIENT SIGNATURE</span>
              <a href="#collections">Découvrir notre univers ↓</a>
            </div>
          </section>
        )}
      </State>
      <div className="trust-strip">
        <span>
          <Layers />
          Personnalisation sur mesure
        </span>
        <span>
          <ShieldCheck />
          Finitions soignées
        </span>
        <span>
          <Package />
          Petites & grandes séries
        </span>
        <span>
          <Truck />
          Livraison en Tunisie
        </span>
      </div>
      <section className="section" id="collections">
        <SectionHead
          eyebrow="01 / NOS COLLECTIONS"
          title="À chaque produit, son écrin."
          to="/categories"
          label="Voir le catalogue"
        />
        <State {...cats}>
          <div className="category-grid">
            {cats.data
              ?.filter((c: any) => c.featured)
              .slice(0, 4)
              .map((c: any) => (
                <Link
                  key={c.id}
                  className="category-card"
                  to={"/category/" + c.slug}
                >
                  <img src={c.image} alt={c.name} />
                  <div>
                    <h3>{c.name}</h3>
                    <span>
                      {c._count.products} produits <ArrowUpRight size={17} />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </State>
      </section>
      <section className="section cream">
        <SectionHead
          eyebrow="02 / LA SÉLECTION IN-D-BOX"
          title="Du caractère. Jusqu’au dernier détail."
          to="/products"
        />
        <State {...products}>
          <div className="product-grid">
            {products.data?.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </State>
      </section>
      <section className="custom-section">
        <div className="custom-image" />
        <div>
          <p className="eyebrow">VOTRE MARQUE, VOTRE SIGNATURE</p>
          <h2>
            Un packaging aussi
            <br />
            <em>unique que vous.</em>
          </h2>
          <p>
            Le bon format. La bonne matière. La finition qui change tout. Créons
            ensemble un emballage qui raconte votre histoire.
          </p>
          <Link className="button" to="/quote">
            Demander un devis personnalisé <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section">
        <SectionHead
          eyebrow="03 / NOTRE SAVOIR-FAIRE"
          title="De l’idée à l’objet."
          to="/services"
          label="Tous nos services"
        />
        <State {...services}>
          <div className="services-grid">
            {services.data?.slice(0, 3).map((s: any, i: number) => (
              <Link to="/services" className="service-card" key={s.id}>
                <span className="service-num">0{i + 1}</span>
                <ServiceIcon name={s.icon} />
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </State>
      </section>
      <section className="section cream">
        <SectionHead
          eyebrow="04 / À DÉCOUVRIR"
          title="Les dernières créations."
          to="/products?new=true"
        />
        <State {...fresh}>
          <div className="product-grid">
            {fresh.data?.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </State>
      </section>
      <section className="section about-home">
        <div>
          <p className="eyebrow">PLUS QU’UN EMBALLAGE</p>
          <h2>
            La première impression
            <br />
            ne se fait qu’une fois.
          </h2>
        </div>
        <div>
          <p>{s?.companyDescription}</p>
          <Link className="text-link" to="/about">
            Rencontrer IN-D-BOX <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function Categories() {
  const r = useApi("/categories");
  return (
    <section className="section">
      <SEO title="Nos collections" />
      <div className="page-heading">
        <p className="eyebrow">LE CATALOGUE IN-D-BOX</p>
        <h1>Un univers de possibilités.</h1>
        <p>Trouvez le packaging qui correspond à votre produit.</p>
      </div>
      <State {...r} empty={!r.data?.length}>
        <div className="category-grid all">
          {r.data?.map((c: any) => (
            <Link
              className="category-card"
              key={c.id}
              to={"/category/" + c.slug}
            >
              <img src={c.image || "/assets/bckgimg.png"} alt={c.name} />
              <div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <span>
                  {c._count.products} produits <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </State>
    </section>
  );
}
export function Catalog() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const cats = useApi("/categories");
  const query = new URLSearchParams(params);
  if (slug) query.set("category", slug);
  const r = useApi("/products?" + query.toString());
  const c = cats.data?.find((c: any) => c.slug === slug);
  function filter(key: string, value: string) {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    p.delete("page");
    setParams(p);
  }
  return (
    <section className="section">
      <SEO
        title={c?.seoTitle || c?.name || "Nos produits"}
        description={c?.seoDescription || c?.description}
      />
      <div className="breadcrumb">
        <Link to="/">Accueil</Link> / <Link to="/products">Produits</Link>
        {c && <> / {c.name}</>}
      </div>
      <div className="page-heading">
        <p className="eyebrow">IMAGINÉ POUR VOUS</p>
        <h1>{c?.name || "Le packaging qui vous ressemble."}</h1>
        <p>
          {c?.description ||
            "Des essentiels bien pensés aux créations d’exception."}
        </p>
      </div>
      <form
        className="filters"
        onSubmit={(e) => {
          e.preventDefault();
          filter("q", String(new FormData(e.currentTarget).get("q") || ""));
        }}
      >
        <div className="search-field">
          <Search size={18} />
          <input
            name="q"
            defaultValue={params.get("q") || ""}
            placeholder="Rechercher dans la collection…"
            aria-label="Rechercher un produit"
          />
        </div>
        <select
          aria-label="Catégorie"
          value={slug || params.get("category") || ""}
          onChange={(e) => filter("category", e.target.value)}
          disabled={!!slug}
        >
          <option value="">Toutes les catégories</option>
          {cats.data?.map((c: any) => (
            <option value={c.slug} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          placeholder="Prix min."
          aria-label="Prix minimum"
          value={params.get("min") || ""}
          onChange={(e) => filter("min", e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="Prix max."
          aria-label="Prix maximum"
          value={params.get("max") || ""}
          onChange={(e) => filter("max", e.target.value)}
        />
        <select
          aria-label="Trier"
          value={params.get("sort") || ""}
          onChange={(e) => filter("sort", e.target.value)}
        >
          <option value="">Les plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="name">Nom A–Z</option>
        </select>
        <button type="submit" className="button dark">
          Rechercher
        </button>
      </form>
      <div className="catalog-meta">
        <span>{r.meta.total || 0} produits</span>
        {params.toString() && (
          <button className="link-button" onClick={() => setParams({})}>
            Réinitialiser les filtres
          </button>
        )}
      </div>
      <State {...r} empty={!r.data?.length}>
        <div className="product-grid">
          {r.data?.map((p: any) => (
            <ProductCard p={p} key={p.id} />
          ))}
        </div>
      </State>
      <Pagination
        meta={r.meta}
        onPage={(p) => {
          const q = new URLSearchParams(params);
          q.set("page", String(p));
          setParams(q);
        }}
      />
    </section>
  );
}
export function Pagination({
  meta,
  onPage,
}: {
  meta: any;
  onPage: (n: number) => void;
}) {
  return meta.pages > 1 ? (
    <div className="pagination">
      <button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        ← Précédent
      </button>
      <span>
        {meta.page} / {meta.pages}
      </span>
      <button
        disabled={meta.page >= meta.pages}
        onClick={() => onPage(meta.page + 1)}
      >
        Suivant →
      </button>
    </div>
  ) : null;
}
export function Product() {
  const { slug } = useParams();
  const r = useApi("/products/" + slug);
  const [pick, setPick] = useState(""),
    [qty, setQty] = useState(1),
    [image, setImage] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { add } = useStore();
  const navigate = useNavigate();
  const p = r.data;
  const v = p?.variants.find((v: any) => v.id === pick) || p?.variants[0];
  useEffect(() => {
    setPick("");
    setImage(0);
  }, [slug]);
  useEffect(() => {
    setQty(v?.minimumQuantity || p?.minimumQuantity || 1);
  }, [v?.id, p?.id]);
  async function addItem(order = false) {
    setBusy(true);
    setError("");
    try {
      await add(p, v, qty);
      if (order) navigate("/cart");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <State {...r}>
        {p && (
          <>
            <SEO
              title={p.seoTitle || p.name}
              description={p.seoDescription || p.shortDescription}
              image={p.images[0]?.url}
            />
            <div className="breadcrumb">
              <Link to="/">Accueil</Link> /{" "}
              <Link to={"/category/" + p.category.slug}>{p.category.name}</Link>{" "}
              / {p.name}
            </div>
            <div className="product-detail">
              <div>
                <div className="detail-photo">
                  <img
                    src={p.images[image]?.url || "/assets/bckgimg.png"}
                    alt={p.images[image]?.alt || p.name}
                  />
                </div>
                <div className="thumbnails">
                  {p.images.map((img: any, i: number) => (
                    <button
                      key={img.id}
                      className={i === image ? "selected" : ""}
                      onClick={() => setImage(i)}
                      aria-label={"Image " + (i + 1)}
                    >
                      <img src={img.url} alt={img.alt} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="detail-copy">
                <p className="eyebrow">{p.category.name}</p>
                <h1>{p.name}</h1>
                <p className="muted">Réf. {v?.sku || p.sku}</p>
                <p>{p.shortDescription}</p>
                <div className="detail-price">
                  {(v?.currentPrice ?? p.currentPrice) <
                    (v?.regularPrice ?? p.regularPrice) && (
                    <del>{money(v?.regularPrice ?? p.regularPrice)}</del>
                  )}
                  <strong>{money(v?.currentPrice ?? p.currentPrice)}</strong>
                  <span> / {p.orderUnit === "LOT" ? "lot" : "unité"}</span>
                </div>
                {(v?.promotionName || p.promotionName) && (
                  <span className="badge gold">
                    {v?.promotionName || p.promotionName}
                  </span>
                )}
                {v?.compareAtPrice &&
                  Number(v.compareAtPrice) > Number(v.regularPrice) && (
                    <p>
                      Prix de référence : <del>{money(v.compareAtPrice)}</del>
                    </p>
                  )}
                {p.variants.length > 0 && (
                  <fieldset>
                    <legend>Choisissez votre format</legend>
                    <div className="variant-options">
                      {p.variants.map((x: any) => (
                        <button
                          key={x.id}
                          className={x.id === v?.id ? "selected" : ""}
                          onClick={() => setPick(x.id)}
                        >
                          {x.name}
                          <small>{money(x.currentPrice)}</small>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                {v && (
                  <div className="variant-specs">
                    {[
                      ["Dimensions", v.dimensions],
                      ["Matière", v.material],
                      ["Couleur", v.color],
                      ["Taille", v.size],
                    ]
                      .filter(([, value]) => value)
                      .map(([k, value]) => (
                        <span key={k}>
                          {k} : <b>{value}</b>
                        </span>
                      ))}
                  </div>
                )}
                <p>
                  {p.orderUnit === "LOT"
                    ? `1 lot = ${v?.quantityPerLot || p.quantityPerLot} pièces`
                    : "Vendu à l’unité"}{" "}
                  · Minimum : {v?.minimumQuantity || p.minimumQuantity}{" "}
                  {p.orderUnit === "LOT" ? "lot(s)" : "pièce(s)"}
                </p>
                <p
                  className={
                    (v?.stock ?? p.stock) > 0 || !p.trackStock
                      ? "stock-ok"
                      : "error-text"
                  }
                >
                  {!p.trackStock
                    ? "Disponible sur commande"
                    : (v?.stock ?? p.stock) > 0
                      ? `En stock · ${v?.stock ?? p.stock} ${p.orderUnit === "LOT" ? "lots" : "unités"}`
                      : "Rupture de stock"}
                </p>
                <div className="purchase">
                  <div className="quantity">
                    <button
                      aria-label="Réduire la quantité"
                      onClick={() =>
                        setQty(
                          Math.max(
                            v?.minimumQuantity || p.minimumQuantity,
                            qty - 1,
                          ),
                        )
                      }
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      aria-label="Quantité"
                      type="number"
                      min={v?.minimumQuantity || p.minimumQuantity}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                    <button
                      aria-label="Augmenter la quantité"
                      onClick={() => setQty(qty + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="button dark"
                    disabled={
                      busy || (p.trackStock && (v?.stock ?? p.stock) < qty)
                    }
                    onClick={() => addItem()}
                  >
                    <ShoppingBag size={18} /> Ajouter au panier
                  </button>
                </div>
                <button
                  className="button wide"
                  disabled={
                    busy || (p.trackStock && (v?.stock ?? p.stock) < qty)
                  }
                  onClick={() => addItem(true)}
                >
                  Commander · {money((v?.currentPrice ?? p.currentPrice) * qty)}{" "}
                  <ArrowRight size={18} />
                </button>
                <ErrorBox error={error} />
                <Link
                  className="text-link quote-link"
                  to={"/quote?product=" + p.id}
                >
                  Une personnalisation ? Demander un devis{" "}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
            <div className="product-details-bottom">
              <div>
                <h2>Le souci du détail.</h2>
                <p className="preline">{p.description}</p>
              </div>
              <div>
                <h3>Caractéristiques techniques</h3>
                <dl>
                  {Object.entries(p.specifications).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            {p.related.length > 0 && (
              <>
                <SectionHead title="Dans le même univers" />
                <div className="product-grid">
                  {p.related.map((p: any) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </State>
    </section>
  );
}
export function Totals({ cart }: { cart: any }) {
  return (
    <div className="totals">
      <div>
        <span>Sous-total</span>
        <span>{money(cart.subtotal)}</span>
      </div>
      <div>
        <span>Promotions</span>
        <span>−{money(cart.promotionDiscount)}</span>
      </div>
      <div>
        <span>Coupon {cart.couponCode}</span>
        <span>−{money(cart.couponDiscount)}</span>
      </div>
      <div className="grand-total">
        <strong>Total</strong>
        <strong>{money(cart.total)}</strong>
      </div>
      <small>
        Montants en TND. Livraison et modalités de règlement confirmées par
        notre équipe avant validation.
      </small>
    </div>
  );
}
export function Cart() {
  const { cart, updateCart, refreshCart, user } = useStore();
  const [code, setCode] = useState(cart.couponCode || ""),
    [email, setEmail] = useState(user?.email || ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    refreshCart(email || undefined).catch((e: any) => setError(e.message));
  }, []);
  async function update(items: any[], coupon = code) {
    setBusy(true);
    setError("");
    try {
      await updateCart(items, coupon, email || undefined);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <SEO title="Mon panier" />
      <div className="page-heading">
        <p className="eyebrow">VOTRE SÉLECTION</p>
        <h1>Mon panier.</h1>
      </div>
      <ErrorBox error={error || cart.message || ""} />
      {!cart.items.length ? (
        <div className="empty">
          <ShoppingBag size={42} />
          <h2>Votre prochaine création commence ici.</h2>
          <Link className="button" to="/products">
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.items.map((i: any, index: number) => (
              <div className="cart-line" key={i.productId + ":" + i.variantId}>
                {i.image && <img src={i.image} alt={i.productName} />}
                <div className="cart-line-copy">
                  <h3>{i.productName || "Produit indisponible"}</h3>
                  <p>{i.variantName}</p>
                  <small>
                    {i.quantityPerLot > 1
                      ? `${i.quantityPerLot} pièces / lot`
                      : "À l’unité"}{" "}
                    · {money(i.unitPrice)}
                  </small>
                  <div className="quantity">
                    <button
                      aria-label="Réduire"
                      disabled={busy || i.quantity <= (i.minimumQuantity || 1)}
                      onClick={() =>
                        update(
                          cart.items.map((x: any, n: number) =>
                            n === index
                              ? { ...x, quantity: x.quantity - 1 }
                              : x,
                          ),
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      aria-label="Augmenter"
                      disabled={busy}
                      onClick={() =>
                        update(
                          cart.items.map((x: any, n: number) =>
                            n === index
                              ? { ...x, quantity: x.quantity + 1 }
                              : x,
                          ),
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-line-total">
                  <strong>{money(i.total)}</strong>
                  <button
                    aria-label="Retirer du panier"
                    className="icon-button"
                    disabled={busy}
                    onClick={() =>
                      update(
                        cart.items.filter((_: any, n: number) => n !== index),
                        "",
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            <Link className="text-link" to="/products">
              ← Continuer mes achats
            </Link>
          </div>
          <aside className="summary">
            <h2>Votre commande</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update(cart.items);
              }}
            >
              <Field label="Un code promo ?">
                <input
                  placeholder="Votre code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field label="Email pour vérifier votre coupon">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <button className="button outline wide" disabled={busy}>
                Appliquer le coupon
              </button>
              {cart.couponCode && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => {
                    setCode("");
                    update(cart.items, "");
                  }}
                >
                  Retirer le coupon
                </button>
              )}
            </form>
            <Totals cart={cart} />
            {!cart.invalid && (
              <Link className="button dark wide" to="/checkout">
                Passer commande <ArrowRight size={18} />
              </Link>
            )}
            <button className="link-button" onClick={() => update([], "")}>
              Vider le panier
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
const customerFields = [
  ["firstName", "Prénom", "text"],
  ["lastName", "Nom", "text"],
  ["company", "Entreprise (facultatif)", "text"],
  ["phone", "Téléphone", "tel"],
  ["email", "Email", "email"],
  ["address", "Adresse de livraison", "text"],
  ["city", "Ville", "text"],
] as const;
export function Checkout() {
  const { cart, user, refreshCart, notify } = useStore();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [key] = useState(
    () => sessionStorage.getItem("checkout-key") || crypto.randomUUID(),
  );
  useEffect(() => {
    sessionStorage.setItem("checkout-key", key);
  }, [key]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const r = await send("/orders", body, "POST", { "Idempotency-Key": key });
      sessionStorage.setItem("last-order", JSON.stringify(r.data));
      sessionStorage.removeItem("checkout-key");
      await refreshCart();
      notify("Votre commande est enregistrée");
      navigate("/confirmation", { state: r.data });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <SEO title="Finaliser ma commande" />
      <div className="page-heading">
        <p className="eyebrow">LA DERNIÈRE ÉTAPE</p>
        <h1>Votre commande, en toute simplicité.</h1>
        <p>
          Aucun paiement en ligne. Notre équipe vous contacte pour la
          confirmation.
        </p>
      </div>
      {cart.items.length ? (
        <div className="cart-layout">
          <form className="panel" onSubmit={submit}>
            <h2>Vos coordonnées</h2>
            <div className="form-grid">
              {customerFields.map(([k, l, t]) => (
                <Field label={l} key={k}>
                  <input
                    name={k}
                    type={t}
                    required={k !== "company"}
                    defaultValue={k === "email" ? user?.email : undefined}
                    maxLength={240}
                  />
                </Field>
              ))}
            </div>
            <Field label="Notes pour notre équipe">
              <textarea name="notes" rows={4} />
            </Field>
            <ErrorBox error={error} />
            <button className="button dark" disabled={busy}>
              {busy ? "Enregistrement…" : "Confirmer ma commande"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          <aside className="summary">
            <h2>Récapitulatif</h2>
            {cart.items.map((i: any) => (
              <div className="mini-line" key={i.productId + i.variantId}>
                <span>
                  {i.productName}
                  <small>
                    {i.variantName} × {i.quantity}
                  </small>
                </span>
                <strong>{money(i.total)}</strong>
              </div>
            ))}
            <Totals cart={cart} />
          </aside>
        </div>
      ) : (
        <div className="empty">
          <p>Votre panier est vide.</p>
          <Link to="/products" className="button">
            Explorer les produits
          </Link>
        </div>
      )}
    </section>
  );
}
export function Confirmation() {
  const loc = useLocation();
  let order = loc.state;
  try {
    order = order || JSON.parse(sessionStorage.getItem("last-order") || "null");
  } catch {}
  return (
    <section className="section confirmation">
      <SEO title="Commande enregistrée" />
      <CheckCircle size={56} />
      <p className="eyebrow">MERCI POUR VOTRE CONFIANCE</p>
      <h1>
        {order ? "Votre commande est enregistrée." : "Aucune commande récente."}
      </h1>
      {order && (
        <>
          <p>
            Référence <strong>{order.number}</strong>
          </p>
          <p>
            Notre équipe vous contactera pour confirmer les détails de votre
            commande.
          </p>
          <div className="panel">
            <OrderDetail order={order} />
          </div>
        </>
      )}
      <Link className="button" to="/products">
        Continuer la découverte <ArrowRight size={18} />
      </Link>
    </section>
  );
}
export function OrderDetail({ order: o }: { order: any }) {
  return (
    <>
      <div className="row">
        <h3>{o.number}</h3>
        <Status status={o.status} />
      </div>
      <p>
        {o.firstName} {o.lastName} · {o.phone} · {o.email}
        <br />
        {o.company} {o.address}, {o.city}
      </p>
      {o.notes && <p className="notice">{o.notes}</p>}
      {o.items?.map((i: any) => (
        <div className="mini-line" key={i.id}>
          <span>
            {i.productName}
            <small>
              {i.variantName} · {i.sku}
              <br />
              {i.quantity}{" "}
              {i.orderUnit === "LOT"
                ? `lot(s) de ${i.quantityPerLot}`
                : "unité(s)"}{" "}
              × {money(i.unitPrice)}
            </small>
          </span>
          <strong>{money(i.total)}</strong>
        </div>
      ))}
      <Totals cart={o} />
      <h3>Suivi de commande</h3>
      <ol className="timeline">
        {o.history?.map((h: any) => (
          <li key={h.id}>
            <Status status={h.status} />
            <small>
              {date(h.createdAt)} · {h.actor}
            </small>
            {h.note && <p>{h.note}</p>}
          </li>
        ))}
      </ol>
    </>
  );
}
export function Quote() {
  const [params] = useSearchParams();
  const cats = useApi("/categories"),
    products = useApi("/products?limit=100");
  const [files, setFiles] = useState<string[]>([]),
    [uploading, setUploading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  async function upload(list: FileList | null) {
    if (!list) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      Array.from(list).forEach((f) => form.append("files", f));
      const r = await api("/uploads/quotes", { method: "POST", body: form });
      setFiles((v) => [...v, ...r.data].slice(0, 5));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const b: any = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await send("/quotes", {
        name: b.name,
        company: b.company,
        email: b.email,
        phone: b.phone,
        notes: b.notes,
        desiredDeliveryDate: b.desiredDeliveryDate || null,
        files,
        items: [
          {
            packagingType: b.packagingType,
            productId: b.productId || null,
            categoryId: b.categoryId || null,
            quantity: Number(b.quantity),
            dimensions: b.dimensions,
            material: b.material,
            printing: b.printing,
            colors: b.colors,
          },
        ],
      });
      setDone(r.data.number);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <SEO title="Demander un devis personnalisé" />
      <div className="page-heading">
        <p className="eyebrow">CRÉONS QUELQUE CHOSE D’UNIQUE</p>
        <h1>Votre idée. Notre savoir-faire.</h1>
        <p>
          Décrivez votre projet : notre équipe vous accompagne du concept à la
          fabrication.
        </p>
      </div>
      {done ? (
        <div className="empty">
          <CheckCircle size={48} />
          <h2>Votre demande a bien été reçue.</h2>
          <p>
            Référence : <strong>{done}</strong>. Nous vous contacterons pour
            échanger sur votre projet.
          </p>
          <Link to="/products" className="button">
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <form className="panel quote-form" onSubmit={submit}>
          <h2>01 — Parlons de vous</h2>
          <div className="form-grid">
            {[
              ["name", "Nom complet", "text"],
              ["company", "Entreprise (facultatif)", "text"],
              ["phone", "Téléphone", "tel"],
              ["email", "Email", "email"],
            ].map(([k, l, t]) => (
              <Field key={k} label={l}>
                <input name={k} type={t} required={k !== "company"} />
              </Field>
            ))}
          </div>
          <h2>02 — Votre projet</h2>
          <div className="form-grid">
            <Field label="Type de packaging">
              <input
                name="packagingType"
                required
                placeholder="Ex. coffret cadeau avec dorure"
              />
            </Field>
            <Field label="Quantité souhaitée">
              <input name="quantity" required type="number" min="1" />
            </Field>
            <Field label="Catégorie (facultatif)">
              <select name="categoryId">
                <option value="">À définir ensemble</option>
                {cats.data?.map((c: any) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Produit de référence (facultatif)">
              <select
                name="productId"
                defaultValue={params.get("product") || ""}
                key={products.data?.length}
              >
                <option value="">Création sur mesure</option>
                {products.data?.map((p: any) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            {[
              ["dimensions", "Dimensions"],
              ["material", "Matière"],
              ["printing", "Impression / finition"],
              ["colors", "Couleurs"],
            ].map(([k, l]) => (
              <Field key={k} label={l}>
                <input name={k} />
              </Field>
            ))}
            <Field label="Date de livraison souhaitée">
              <input
                name="desiredDeliveryDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
              />
            </Field>
          </div>
          <Field label="Précisions sur votre projet">
            <textarea name="notes" rows={4} />
          </Field>
          <h2>03 — Vos inspirations</h2>
          <Field
            label="Logo, maquette, référence ou PDF"
            hint="JPG, PNG, WebP ou PDF · 8 Mo par fichier · 5 fichiers maximum"
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => upload(e.target.files)}
              disabled={uploading || files.length >= 5}
            />
          </Field>
          {files.map((f, i) => (
            <div className="row" key={f}>
              <span>
                Pièce jointe {i + 1} · {f.endsWith(".pdf") ? "PDF" : "Image"}
              </span>
              <button
                type="button"
                className="icon-button"
                onClick={() => setFiles(files.filter((x) => x !== f))}
                aria-label="Retirer le fichier"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <ErrorBox error={error} />
          <button className="button dark" disabled={busy || uploading}>
            {uploading
              ? "Téléchargement…"
              : busy
                ? "Envoi…"
                : "Envoyer ma demande de devis"}
            <ArrowUpRight size={18} />
          </button>
        </form>
      )}
    </section>
  );
}
export function Contact() {
  const { settings: s } = useStore();
  const [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await send("/contact", Object.fromEntries(new FormData(e.currentTarget)));
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <SEO title="Contactez IN-D-BOX" />
      <div className="page-heading">
        <p className="eyebrow">TOUJOURS À VOTRE ÉCOUTE</p>
        <h1>Et si on en parlait ?</h1>
      </div>
      <div className="contact-grid">
        <div>
          <h2>Faisons connaissance.</h2>
          <p>
            Une question, une idée ou un projet ?<br />
            Notre équipe est là pour vous accompagner.
          </p>
          <p className="contact-item">
            <Phone size={20} />
            <a href={"tel:" + s?.phone}>{s?.phone}</a>
          </p>
          <p className="contact-item">
            <Mail size={20} />
            <a href={"mailto:" + s?.email}>{s?.email}</a>
          </p>
          <p className="contact-item">
            <MapPin size={20} />
            {s?.address}
          </p>
        </div>
        <form className="panel" onSubmit={submit}>
          {done ? (
            <div className="empty">
              <CheckCircle />
              <h2>Message bien reçu.</h2>
              <p>Nous vous répondrons dès que possible.</p>
            </div>
          ) : (
            <>
              <div className="form-grid">
                {[
                  ["name", "Nom", "text"],
                  ["email", "Email", "email"],
                  ["phone", "Téléphone (facultatif)", "tel"],
                  ["subject", "Sujet", "text"],
                ].map(([k, l, t]) => (
                  <Field label={l} key={k}>
                    <input name={k} type={t} required={k !== "phone"} />
                  </Field>
                ))}
              </div>
              <Field label="Votre message">
                <textarea name="message" required minLength={10} rows={6} />
              </Field>
              <ErrorBox error={error} />
              <button className="button dark" disabled={busy}>
                {busy ? "Envoi…" : "Envoyer mon message"}
                <ArrowRight size={18} />
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
function ServiceIcon({ name }: { name: string }) {
  const Icon =
    (
      { Package, Layers, PenTool, ShoppingBag, ShieldCheck, Truck } as Record<
        string,
        typeof Package
      >
    )[name] || Package;
  return <Icon />;
}
export function Services() {
  const r = useApi("/services");
  return (
    <section className="section">
      <SEO title="Nos services" />
      <div className="page-heading">
        <p className="eyebrow">DU CONCEPT À LA RÉALISATION</p>
        <h1>Chaque détail compte.</h1>
        <p>Un accompagnement complet pour donner vie à votre packaging.</p>
      </div>
      <State {...r}>
        <div className="services-grid">
          {r.data?.map((s: any) => (
            <article className="service-card illustrated" key={s.id}>
              {s.image && <img src={s.image} alt={s.title} />}
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              <Link className="text-link" to="/quote">
                Parlons de votre projet <ArrowUpRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      </State>
    </section>
  );
}
export function About() {
  const { settings: s } = useStore();
  return (
    <section className="section">
      <SEO title="L’histoire IN-D-BOX" />
      <div className="page-heading">
        <p className="eyebrow">BOXES THAT STAND OUT</p>
        <h1>
          Une belle histoire commence
          <br />
          par un bel emballage.
        </h1>
      </div>
      <img
        className="about-photo"
        src={s?.heroBackground || "/assets/bckgimg.png"}
        alt="L’univers packaging IN-D-BOX"
      />
      <div className="about-home">
        <h2>
          L’exigence au service
          <br />
          de votre identité.
        </h2>
        <p>{s?.companyDescription}</p>
      </div>
      <div className="services-grid">
        {[
          [
            "Votre identité",
            "Des formats et finitions au service de votre marque.",
          ],
          [
            "Le juste détail",
            "Un choix attentif des matières, des textures et des couleurs.",
          ],
          [
            "Un projet partagé",
            "Un accompagnement clair, de votre idée à la validation du bon à tirer.",
          ],
        ].map(([t, p]) => (
          <article className="service-card" key={t}>
            <h3>{t}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Account() {
  const { user, setUser, ready, notify } = useStore();
  const [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await send(
        "/auth/" + (register ? "register" : "login"),
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setUser(r.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <State loading />;
  if (user)
    return (
      <AccountDetails
        user={user}
        logout={async () => {
          await send("/auth/logout", {});
          setUser(null);
          notify("Vous êtes déconnecté");
        }}
      />
    );
  return (
    <section className="section auth-page">
      <SEO title="Mon compte" />
      <div className="panel">
        <p className="eyebrow">BIENVENUE CHEZ IN-D-BOX</p>
        <h1>{register ? "Créer mon compte" : "Heureux de vous retrouver."}</h1>
        <form onSubmit={submit}>
          {register && (
            <>
              {[
                ["firstName", "Prénom"],
                ["lastName", "Nom"],
                ["phone", "Téléphone"],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input name={k} required />
                </Field>
              ))}
            </>
          )}
          <Field label="Email">
            <input type="email" name="email" required autoComplete="email" />
          </Field>
          <Field
            label="Mot de passe"
            hint={register ? "12 caractères minimum" : undefined}
          >
            <input
              name="password"
              type="password"
              minLength={register ? 12 : 1}
              maxLength={72}
              required
              autoComplete={register ? "new-password" : "current-password"}
            />
          </Field>
          <ErrorBox error={error} />
          <button className="button dark wide" disabled={busy}>
            {busy
              ? "Connexion…"
              : register
                ? "Créer mon compte"
                : "Me connecter"}
          </button>
        </form>
        <button
          className="link-button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register
            ? "Déjà un compte ? Se connecter"
            : "Nouveau ici ? Créer un compte"}
        </button>
      </div>
    </section>
  );
}
function AccountDetails({ user, logout }: { user: any; logout: () => void }) {
  const r = useApi(user.role === "CUSTOMER" ? "/orders" : "/auth/me");
  const { notify, setUser } = useStore();
  const [error, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await send(
        "/auth/me",
        Object.fromEntries(new FormData(e.currentTarget)),
        "PATCH",
      );
      const u = await api("/auth/me");
      setUser(u.data);
      notify("Profil mis à jour");
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <section className="section">
      <SEO title="Mon compte" />
      <div className="section-head">
        <h1>Bonjour {user.name}.</h1>
        <button className="button outline" onClick={logout}>
          Se déconnecter
        </button>
      </div>
      {user.role !== "CUSTOMER" ? (
        <Link className="button" to="/admin">
          Ouvrir l’administration
        </Link>
      ) : (
        <>
          <form className="panel profile" onSubmit={save}>
            <h2>Mon profil</h2>
            <div className="form-grid">
              <Field label="Nom">
                <input name="name" defaultValue={user.name} required />
              </Field>
              <Field label="Téléphone">
                <input name="phone" defaultValue={user.customer?.phone} />
              </Field>
              <Field label="Entreprise">
                <input name="company" defaultValue={user.customer?.company} />
              </Field>
            </div>
            <ErrorBox error={error} />
            <button className="button dark">Enregistrer</button>
          </form>
          <h2>Mes commandes</h2>
          <State {...r} empty={!r.data?.length}>
            {Array.isArray(r.data) &&
              r.data.map((o: any) => (
                <details className="panel order-accordion" key={o.id}>
                  <summary>
                    {o.number} · {date(o.createdAt)} · {money(o.total)}{" "}
                    <Status status={o.status} />
                  </summary>
                  <OrderDetail order={o} />
                </details>
              ))}
          </State>
        </>
      )}
    </section>
  );
}
