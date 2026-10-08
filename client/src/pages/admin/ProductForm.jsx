import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { useDialog } from "../../context/DialogContext";
import { capitalize } from "../../utils/format";

const categories = ["rings", "necklaces", "earrings", "bracelets", "bangles", "sets"];
const materials = ["gold", "silver", "diamond", "platinum", "artificial"];

const empty = {
  name: "", description: "", category: "rings", material: "gold",
  purity: "", weightGrams: "", price: "", stock: "", featured: false, images: [],
};

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useDialog();
  const fileRef = useRef(null);

  const [form, setForm] = useState(empty);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) =>
        setForm({
          name: data.name || "",
          description: data.description || "",
          category: data.category,
          material: data.material || "gold",
          purity: data.purity || "",
          weightGrams: data.weightGrams ?? "",
          price: data.price,
          stock: data.stock,
          featured: Boolean(data.featured),
          images: data.images || [],
        })
      )
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const uploadFiles = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const { data } = await api.post("/admin/upload", fd);
      setForm((f) => ({ ...f, images: [...f.images, ...data.urls] }));
      toast.success(`${data.urls.length} photo${data.urls.length === 1 ? "" : "s"} uploaded`);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError("An image link must start with http:// or https://");
      return;
    }
    setError("");
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setLink("");
  };

  const removeImage = (i) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Product name is required");
    if (form.price === "" || Number(form.price) < 0) return setError("Enter a valid price");
    if (form.stock !== "" && Number(form.stock) < 0) return setError("Stock cannot be negative");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      material: form.material,
      purity: form.purity.trim(),
      weightGrams: Number(form.weightGrams) || 0,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      featured: form.featured,
      images: form.images,
    };

    setSaving(true);
    try {
      if (editing) await api.put(`/products/${id}`, payload);
      else await api.post("/products", payload);
      toast.success(editing ? "Product updated" : "Product added to the store");
      navigate("/admin/products");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the product");
      setSaving(false);
    }
  };

  if (loading) return <p className="ad-muted">Loading...</p>;

  return (
    <>
      <Link to="/admin/products" className="ad-back">← Back to products</Link>
      <h1 className="ad-title">{editing ? "Edit product" : "Add new product"}</h1>

      <form className="ad-card ad-form" onSubmit={handleSubmit} noValidate>
        <label>Product name</label>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Royal Solitaire Ring" />

        <label>Description</label>
        <textarea name="description" rows="4" value={form.description} onChange={handleChange}
          placeholder="Describe the piece" />

        <div className="ad-grid2">
          <div>
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {categories.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
            </select>
          </div>
          <div>
            <label>Material</label>
            <select name="material" value={form.material} onChange={handleChange}>
              {materials.map((m) => <option key={m} value={m}>{capitalize(m)}</option>)}
            </select>
          </div>
          <div>
            <label>Purity (optional)</label>
            <input name="purity" value={form.purity} onChange={handleChange} placeholder="22K, 24K, 925..." />
          </div>
          <div>
            <label>Weight in grams (optional)</label>
            <input name="weightGrams" type="number" min="0" step="0.01" value={form.weightGrams} onChange={handleChange} />
          </div>
          <div>
            <label>Price (Rs)</label>
            <input name="price" type="number" min="0" value={form.price} onChange={handleChange} />
          </div>
          <div>
            <label>Stock quantity</label>
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />
          </div>
        </div>

        <label className="ad-check">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
          Featured product
        </label>

        {/* images */}
        <label>Photos</label>
        <div className="ad-images">
          {form.images.map((src, i) => (
            <div key={src + i} className="ad-img">
              <img src={src} alt="" />
              {i === 0 && <span className="cover">Cover</span>}
              <button type="button" onClick={() => removeImage(i)} title="Remove">×</button>
            </div>
          ))}
          <button type="button" className="ad-add-img" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "+ Upload"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
          hidden onChange={uploadFiles} />
        <p className="ad-hint">JPG, PNG or WEBP, up to 3 MB each. The first photo is the cover.</p>

        <div className="ad-linkrow">
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="...or paste an image link" />
          <button type="button" className="ad-btn ghost" onClick={addLink}>Add link</button>
        </div>

        {error && <p className="ad-error">{error}</p>}

        <div className="ad-actions">
          <button className="ad-btn" disabled={saving || uploading}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
          </button>
          <Link to="/admin/products" className="ad-btn ghost">Cancel</Link>
        </div>
      </form>
    </>
  );
}