require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const seedData = [
  {
    name: "Architectural Bed",
    price: 45000,
    image: "/assets/bed.jpg"
  },
  {
    name: "Heritage Lounge Chair",
    price: 18500,
    image: "/assets/chair.jpg"
  },
  {
    name: "Velvet Editorial Sofa",
    price: 85000,
    image: "/assets/sofa.jpg"
  },
  {
    name: "Minimalist Stoneware Table",
    price: 22000,
    image: "/assets/table.jpg"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");
    
    await Product.deleteMany({});
    console.log("Cleared existing collection.");
    
    await Product.insertMany(seedData);
    console.log("Successfully seeded database with provided assets!");
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
