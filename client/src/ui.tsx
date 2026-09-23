import {
  useEffect,
  useId,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package, ShoppingBag } from "lucide-react";
import { money, labels } from "./api";
export function SEO({
  title,
  description,
  image,
}: {
  title: string;
  description?: string;
  image?: string;
}) {
  useEffect(() => {
    document.title = title + " | IN-D-BOX";
    for (const [name, value] of [
      [
        "description",
        description || "Packaging personnalisé et coffrets premium en Tunisie.",
      ],
      ["og:title", title],
      ["og:description", description || "Découvrez IN-D-BOX."],
      [
        "og:image",
        image
          ? new URL(image, location.origin).href
          : location.origin + "/assets/bckgimg.png",
      ],
      ["og:url", location.href],
    ]) {
      let el = document.querySelector(
        `meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", location.origin + location.pathname);
  }, [title, description, image]);
  return null;
}
export function State({
  loading,
  error,
  empty,
  children,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  children?: ReactNode;
}) {
  if (loading)
    return (
      <div className="skeletons" aria-label="Chargement">
        {[0, 1, 2, 3].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="notice error" role="alert">
        {error}
        <button onClick={() => location.reload()}>Réessayer</button>
      </div>
    );
  if (empty)
    return (
      <div className="empty">
        <Package size={36} />
        <h3>Aucun résultat pour le moment</h3>
        <p>Essayez une autre recherche ou revenez bientôt.</p>
      </div>
    );
  return <>{children}</>;
}
export function Status({ status }: { status: string }) {
  return (
    <span className={"badge status-" + status}>{labels[status] || status}</span>
  );
}
export function ProductCard({ p }: { p: any }) {
  return (
    <Link className="product-card" to={"/product/" + p.slug}>
      <div className="product-photo">
        <img
          loading="lazy"
          src={p.images[0]?.url || "/assets/bckgimg.png"}
          alt={p.images[0]?.alt || p.name}
        />
        <div className="badges">
          {p.promotionName ? (
            <span className="badge gold">Offre spéciale</span>
          ) : p.isNew ? (
            <span className="badge">Nouveau</span>
          ) : p.featured ? (
            <span className="badge">Sélection signature</span>
          ) : null}
        </div>
        <span className="card-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="product-info">
        <small>{p.category.name}</small>
        <h3>{p.name}</h3>
        <div className="row">
          <div>
            {p.currentPrice < p.regularPrice && (
              <del>{money(p.regularPrice)}</del>
            )}{" "}
            <strong>{money(p.currentPrice)}</strong>
            <small> / {p.orderUnit === "LOT" ? "lot" : "unité"}</small>
          </div>
          <ShoppingBag size={17} />
        </div>
      </div>
    </Link>
  );
}
export function SectionHead({
  eyebrow,
  title,
  to,
  label = "Tout découvrir",
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {label}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<any>, {
            "aria-labelledby": id,
            ...(hint ? { "aria-describedby": id + "-hint" } : {}),
          })
        : children}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </label>
  );
}
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <p className="notice error" role="alert">
      {error}
    </p>
  ) : null;
}
