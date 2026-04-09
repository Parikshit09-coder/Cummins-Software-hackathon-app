import React from "react";
import ProductList from "./components/ProductList";
import "./index.css";

function App() {
  return (
    <div className="container">
      <header>
        <div className="editorial-header">
          <span className="editorial-tagline">Edition 2024 Inventory</span>
          <h1 className="section-title">The Archive</h1>
          <p>A curated repository of heritage goods and contemporary artifacts.</p>
        </div>
      </header>
      <main>
        <ProductList />
      </main>
      <footer>
        <p>© 2024 The Archive Digital Curatorial Suite. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;