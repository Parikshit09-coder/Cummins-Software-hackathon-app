import React from "react";
import ProductList from "./components/ProductList";
import ChaosPanel from "./components/ChaosPanel";
import "./index.css";

function App() {
  return (
    <div className="container">
      <header>
        <div className="editorial-header">
          <span className="editorial-tagline">Edition 2024 Inventory</span>
          <h1 className="section-title">The Archive</h1>
          <p>A curated repository of heritage goods and contemporary artifacts and do it all Hello Everyone my name is par.</p>
        </div>
      </header>
      <main>
        <ProductList />
        <ChaosPanel />
      </main>
      <footer>
        <p>© 2024 The Archive Digital Curatorial Suite. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;