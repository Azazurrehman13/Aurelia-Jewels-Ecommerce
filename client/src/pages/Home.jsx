import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";
import logo from "../assets/Goldlogo.png";

/* ---------- Gold line-art for each category ---------- */
const art = {
  rings: (
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="68" r="22" />
      <path d="M40 22 L60 22 L66 30 L50 46 L34 30 Z" className="fill" />
      <path d="M34 30 H66 M44 22 L41 30 L50 46 M56 22 L59 30 L50 46" />
    </svg>
  ),
  necklaces: (
    <svg viewBox="0 0 100 100">
      <path d="M16 18 C16 72, 84 72, 84 18" />
      <path d="M50 60 L59 70 L50 86 L41 70 Z" className="fill" />
      <circle cx="16" cy="18" r="3" />
      <circle cx="84" cy="18" r="3" />
    </svg>
  ),
  earrings: (
    <svg viewBox="0 0 100 100">
      <circle cx="30" cy="20" r="4" />
      <path d="M30 24 V42" />
      <path d="M30 42 L40 56 L30 76 L20 56 Z" className="fill" />
      <circle cx="70" cy="20" r="4" />
      <path d="M70 24 V42" />
      <path d="M70 42 L80 56 L70 76 L60 56 Z" className="fill" />
    </svg>
  ),
  bracelets: (
    <svg viewBox="0 0 100 100">
      <ellipse cx="50" cy="48" rx="36" ry="20" />
      <ellipse cx="50" cy="48" rx="36" ry="20" className="beads" />
      <path d="M50 70 L57 79 L50 90 L43 79 Z" className="fill" />
    </svg>
  ),
  bangles: (
    <svg viewBox="0 0 100 100">
      <circle cx="34" cy="52" r="26" />
      <circle cx="50" cy="52" r="26" />
      <circle cx="66" cy="52" r="26" />
    </svg>
  ),
  sets: (
    <svg viewBox="0 0 100 100">
      <path d="M40 10 L60 10 L67 18 L50 34 L33 18 Z" className="fill" />
      <rect x="14" y="36" width="72" height="14" rx="4" />
      <rect x="20" y="50" width="60" height="34" rx="4" />
      <path d="M50 50 V84" />
    </svg>
  ),
};

const categories = [
  { name: "Rings", slug: "rings", tag: "Engagement & everyday" },
  { name: "Necklaces", slug: "necklaces", tag: "Chains & pendants" },
  { name: "Earrings", slug: "earrings", tag: "Studs & drops" },
  { name: "Bracelets", slug: "bracelets", tag: "Charms & cuffs" },
  { name: "Bangles", slug: "bangles", tag: "Classic & bridal" },
  { name: "Sets", slug: "sets", tag: "Complete looks" },
  // To use a real photo, add:  photo: "/images/rings.jpg"
];

const features = [
  { icon: "◆", title: "Certified purity", text: "22K and 24K gold, with the purity and weight shown on every piece." },
  { icon: "◆", title: "Secure account", text: "Your details are protected with encrypted passwords and secure login." },
  { icon: "◆", title: "Delivery across Pakistan", text: "Cash on delivery available, with order tracking in your account." },
  { icon: "◆", title: "Made for occasions", text: "Weddings, gifts and everyday wear, all in one collection." },
];

const steps = [
  { n: "1", title: "Browse", text: "Explore collections by category, material and price." },
  { n: "2", title: "Choose", text: "Check purity, weight and photos, then add to your cart." },
  { n: "3", title: "Receive", text: "Place your order and we deliver it to your door." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-ring ring-1" />
        <div className="hero-ring ring-2" />

        <div className="hero-content">
          <p className="hero-eyebrow">
            {user ? `Welcome back, ${user.name.split(" ")[0]}` : "Fine jewellery · Gold · Silver · Diamond"}
          </p>
          <h1>
            Jewellery that tells
            <br />
            <span className="gold-text">your story</span>
          </h1>
          <p className="hero-sub">
            Handpicked rings, necklaces, earrings and bangles for weddings,
            gifts and every day you want to shine.
          </p>

          <div className="hero-actions">
            <Link to="/shop" className="btn-gold">Shop the collection</Link>
            {user ? (
              <a href="#categories" className="btn-outline">Browse categories</a>
            ) : (
              <Link to="/auth" className="btn-outline">Create free account</Link>
            )}
          </div>

          <div className="hero-trust">
            <span>22K &amp; 24K gold</span>
            <span>Cash on delivery</span>
            <span>Secure checkout</span>
          </div>
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="section" id="categories">
        <p className="section-eyebrow">Collections</p>
        <h2 className="section-title">Shop by category</h2>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.slug} to={`/shop?category=${c.slug}`} className="cat-card">
              <div className="cat-art">
                {c.photo ? <img src={c.photo} alt={c.name} /> : art[c.slug]}
              </div>
              <div className="cat-info">
                <h3>{c.name}</h3>
                <p>{c.tag}</p>
                <span className="cat-link">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Why us ---------- */}
      <section className="section">
        <p className="section-eyebrow">Why Aurelia</p>
        <h2 className="section-title">Quality you can trust</h2>
        <div className="feat-grid">
          {features.map((f) => (
            <div key={f.title} className="feat">
              <span className="feat-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section">
        <p className="section-eyebrow">Simple &amp; easy</p>
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          {steps.map((s) => (
            <div key={s.n} className="step">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Final call to action ---------- */}
      <section className="cta">
        <h2>Ready to find your perfect piece?</h2>
        <p>
          {user
            ? "Explore the full collection and add your favourites to the cart."
            : "Create a free account to save your favourites, track orders and checkout faster."}
        </p>
        <Link to={user ? "/shop" : "/auth"} className="btn-gold">
          {user ? "Start shopping" : "Sign up now"}
        </Link>
      </section>

             {/* ---------- Footer ---------- */}
      <footer className="footer">
        <div className="footer-brand">
          <span className="footer-badge">
            <img src={logo} alt="Aurelia Jewels logo" />
          </span>
          <span>Aurelia Jewels</span>
        </div>
        <p>© {new Date().getFullYear()} Aurelia Jewels. All rights reserved.</p>
      </footer>
    </>
  );
}