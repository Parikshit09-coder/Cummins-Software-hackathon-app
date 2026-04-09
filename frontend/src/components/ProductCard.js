import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      {product.image && (
        <div className="product-card-image">
          <img src={product.image} alt={product.name} />
        </div>
      )}
      <h4 className="product-card-title">{product.name}</h4>
      <p className="product-card-price">₹{product.price}</p>
    </div>
  );
};

export default ProductCard;