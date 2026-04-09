import React, { useState, useEffect } from "react";
import API from "../services/api";
import { logEvent } from "../services/logger";

const ProductForm = ({ fetchProducts, editingProduct, setEditingProduct }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price);
      setImage(editingProduct.image || "");
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, { name, price, image });

        logEvent({
          alert_type: "product_update",
          message: "Product updated",
        });
      } else {
        await API.post("/products", { name, price, image });

        logEvent({
          alert_type: "product_create",
          message: "Product created",
        });
      }

      setName("");
      setPrice("");
      setImage("");
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      logEvent({
        alert_type: "api_failure",
        severity: "critical",
        message: err.message,
      });
    }
  };

  return (
    <div className="form-container">
      <h2 className="section-title">{editingProduct ? "Update Artifact" : "Add to Collection"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Artifact Name</label>
          <input
            placeholder="e.g. Crystalline Vessel"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Artifact Image URL</label>
          <input
            placeholder="e.g. https://images.unsplash.com/..."
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Valuation (INR)</label>
          <input
            placeholder="e.g. 12500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <button type="submit" className="ghost-button">
          {editingProduct ? "Update Entry" : "Document Artifact"}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;