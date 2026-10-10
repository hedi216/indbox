import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { send, useStore, api } from "./api";
import { Field, ErrorBox } from "./ui";
import { passwordRules, validPassword } from "../../server/src/password-policy";

export function PasswordInput({
  name = "password",
  label = "Nouveau mot de passe",
}: {
  name?: string;
  label?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <>
      <Field label={label}>
        <input
          name={name}
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.setCustomValidity(
              validPassword(e.target.value)
                ? ""
                : "Respectez toutes les exigences du mot de passe.",
            );
          }}
          required
          minLength={12}
          maxLength={72}
        />
      </Field>
      <ul className="password-rules" aria-label="Exigences du mot de passe">
        {passwordRules.map((rule) => (
          <li key={rule.label} data-valid={rule.test(value)}>
            {rule.test(value) ? "✓" : "○"} {rule.label}
          </li>
        ))}
      </ul>
    </>
  );
}

export function SecurityPage({ change = false }: { change?: boolean }) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [token, setToken] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("token") || "",
  );
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const kind = change ? "change-password" : pathname.slice(1);
  const title =
    kind === "verify-email"
      ? "Vérifier mon email"
      : kind === "forgot-password"
        ? "Mot de passe oublié"
        : kind === "resend-verification"
          ? "Renvoyer la vérification"
          : "Changer mon mot de passe";
  useEffect(() => {
    if (hash) {
      setToken(new URLSearchParams(hash.slice(1)).get("token") || "");
      setMessage("");
      setError("");
      navigate(pathname, { replace: true });
    }
  }, [hash, pathname, navigate]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      if (values.password && values.password !== values.confirmPassword)
        throw new Error("Les mots de passe ne correspondent pas.");
      const r = await send("/auth/" + kind, { ...values, token });
      setMessage(r.data.message);
      if (["change-password", "reset-password"].includes(kind)) setUser(null);
      if (kind === "verify-email" && user)
        setUser((await api("/auth/me")).data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section auth-page">
      <div className="panel">
        <h1>{title}</h1>
        {change && user?.mustChangePassword && (
          <p>
            Pour sécuriser votre accès, choisissez un nouveau mot de passe avant
            de continuer. Vos identifiants temporaires expirent après 24 heures.
          </p>
        )}
        {message ? (
          <>
            <p role="status">{message}</p>
            <Link className="button" to="/account">
              Se connecter à mon compte
            </Link>
            <p>
              <Link to="/admin">Connexion équipe</Link>
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            {["forgot-password", "resend-verification"].includes(kind) && (
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={user?.email || ""}
                />
              </Field>
            )}
            {change && (
              <Field label="Mot de passe actuel">
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
            )}
            {["change-password", "reset-password"].includes(kind) && (
              <>
                <PasswordInput />
                <Field label="Confirmer le nouveau mot de passe">
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </Field>
              </>
            )}
            {kind === "verify-email" && (
              <p>
                Confirmez votre adresse en cliquant ci-dessous. Ce lien ne peut
                être utilisé qu’une seule fois.
              </p>
            )}
            <ErrorBox error={error} />
            <button className="button dark" disabled={busy}>
              {kind === "verify-email" ? "Confirmer mon email" : "Envoyer"}
            </button>
          </form>
        )}
        {!message && (
          <p>
            <Link to="/forgot-password">
              Demander un nouveau lien de réinitialisation
            </Link>{" "}
            · <Link to="/resend-verification">Renvoyer la vérification</Link>
          </p>
        )}
        {change && user && (
          <button
            className="link-button"
            onClick={async () => {
              await send("/auth/logout", {});
              setUser(null);
            }}
          >
            Se déconnecter
          </button>
        )}
      </div>
    </section>
  );
}
