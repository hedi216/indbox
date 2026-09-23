import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
export async function api(path: string, options: RequestInit = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Le serveur est indisponible.");
  }
  if (!response.ok) {
    const details = result.error?.fields?.fieldErrors;
    throw new Error(
      (result.error?.message || "La requête a échoué.") +
        (result.error?.fields?.formErrors?.length
          ? " " + result.error.fields.formErrors.join(" · ")
          : "") +
        (details
          ? " " +
            Object.entries(details)
              .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
              .join(" · ")
          : ""),
    );
  }
  return result;
}
export const send = (
  path: string,
  body: unknown,
  method = "POST",
  headers = {},
) => api(path, { method, body: JSON.stringify(body), headers });
export function useApi(path: string) {
  const [data, setData] = useState<any>(null),
    [meta, setMeta] = useState<any>({}),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    api(path)
      .then((r) => {
        if (live) {
          setData(r.data);
          setMeta(r.meta || {});
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, version]);
  return { data, meta, error, loading, reload: () => setVersion((v) => v + 1) };
}
export const money = (n: any) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(n || 0)) + " TND";
export const date = (v: string) =>
  new Date(v).toLocaleString("fr-TN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export const labels: Record<string, string> = {
  NEW: "Nouveau",
  CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation",
  READY: "Prête",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REVIEWING: "En étude",
  CONTACTED: "Contacté",
  QUOTED: "Devis proposé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CLOSED: "Clôturé",
  READ: "Lu",
  ARCHIVED: "Archivé",
  PENDING: "En attente",
  SENT: "Envoyé",
  FAILED: "Échec",
  RETRY: "Nouvel essai",
  SENDING: "En cours",
};
const Context = createContext<any>(null);
export function Store({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null),
    [ready, setReady] = useState(false),
    [cart, setCart] = useState<any>({ items: [] }),
    [toast, setToast] = useState("");
  const settings = useApi("/settings");
  const refreshCart = async (email?: string) => {
    const r = await api(
      "/cart" + (email ? "?email=" + encodeURIComponent(email) : ""),
    );
    setCart(r.data);
    return r.data;
  };
  useEffect(() => {
    api("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => {})
      .finally(() => setReady(true));
    refreshCart().catch(() => {});
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  async function updateCart(
    items: any[],
    couponCode = cart.couponCode || "",
    email?: string,
  ) {
    const r = await send(
      "/cart",
      {
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        couponCode,
        email,
      },
      "PUT",
    );
    setCart(r.data);
    return r.data;
  }
  async function add(product: any, variant: any, quantity: number) {
    const current = await refreshCart();
    const items = [...current.items];
    const found = items.find(
      (i: any) =>
        i.productId === product.id && i.variantId === (variant?.id ?? null),
    );
    if (found) found.quantity += quantity;
    else
      items.push({
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity,
      });
    await updateCart(items, "");
    setToast("Produit ajouté au panier");
  }
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        ready,
        cart,
        refreshCart,
        updateCart,
        add,
        settings: settings.data,
        settingsState: settings,
        notify: setToast,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
