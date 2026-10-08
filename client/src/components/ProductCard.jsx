import { Link } from "react-router-dom";
import { formatPrice, capitalize } from "../utils/format";

export default function ProductCard({ product, admin = false, onDelete }) {
  const { _id, name, images, material, purity, price, stock } = product;

  return (
    <div className="p-wrap">
      <Link to={`/product/${_id}`} className="p-card">
        <div className="p-img">
          {images?.[0] ? (
            <img src={images[0]} alt={name} loading="lazy" />
          ) : (
            <span className="p-noimg">◆</span>
          )}
          {stock === 0 && <span className="p-badge out">Sold out</span>}
          {stock > 0 && stock <= 3 && <span className="p-badge low">Only {stock} left</span>}
        </div>
        <div className="p-body">
          <p className="p-meta">
            {capitalize(material)}
            {purity ? ` · ${purity}` : ""}
          </p>
          <h3>{name}</h3>
          <p className="p-price">{formatPrice(price)}</p>
          {admin && <p className="p-stockline">{stock} in stock</p>}
        </div>
      </Link>

      {/* admin only */}
      {admin && (
        <div className="p-admin">
          <Link to={`/admin/products/${_id}/edit`}>Edit</Link>
          <button type="button" onClick={() => onDelete(product)}>Delete</button>
        </div>
      )}
    </div>
  );
}