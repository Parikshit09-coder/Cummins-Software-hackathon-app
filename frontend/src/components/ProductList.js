import React, { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "./ProductCard";
import ProductForm from "./ProductForm";
import { logEvent } from "../services/logger";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);

      logEvent({
        alert_type: "fetch_products",
        message: "Products fetched",
      });
    } catch (err) {
      logEvent({
        alert_type: "api_failure",
        severity: "critical",
        message: err.message,
      });
    }
  };

  const deleteProduct = async (id) => {
    try {
      await API.delete(`/products/${id}`);

      logEvent({
        alert_type: "product_delete",
        message: "Product deleted",
      });

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
    <div>
      <h2 className="section-title">Current Collection</h2>
      <ProductForm
        fetchProducts={fetchProducts}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
      />
      <div className="product-grid">
        {products.map((p) => (
          <div key={p._id}>
            <ProductCard product={p} />
            <div className="card-actions">
              <button onClick={() => setEditingProduct(p)} className="ghost-button secondary">Edit</button>
              <button onClick={() => deleteProduct(p._id)} className="ghost-button secondary">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;