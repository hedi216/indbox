import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import { Store } from "./api";
import {
  Layout,
  Home,
  Catalog,
  Categories,
  Product,
  Cart,
  Checkout,
  Quote,
  Contact,
  Services,
  About,
  Account,
  Confirmation,
} from "./storefront";
import { Admin } from "./admin";
import "./style.css";
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Une erreur inattendue est survenue</h1>
        <button onClick={() => location.reload()}>Recharger la page</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const loc = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        <Route path="category/:slug" element={<Catalog />} />
        <Route path="categories" element={<Categories />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="confirmation" element={<Confirmation />} />
        <Route path="quote" element={<Quote />} />
        <Route path="contact" element={<Contact />} />
        <Route path="services" element={<Services />} />
        <Route path="about" element={<About />} />
        <Route path="account" element={<Account />} />
        <Route
          path="*"
          element={
            <div className="empty">
              <h1>Page introuvable</h1>
              <Link className="button" to="/">
                Retour à l’accueil
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <BrowserRouter>
        <Store>
          <App />
        </Store>
      </BrowserRouter>
    </Boundary>
  </React.StrictMode>,
);
