// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@project-server.fv9q8on.mongodb.net/?retryWrites=true&w=majority`;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB and keep connection alive
async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    //  collection
    const testCollection = client.db("testDB").collection("testCollection");

    // --- GET all items ---
    app.get("/items", async (req, res) => {
      try {
        const items = await testCollection.find().toArray();
        res.json(items);
      } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: "Failed to fetch items" });
      }
    });

    // --- POST a new item ---
    app.post("/items", async (req, res) => {
      const newItem = req.body;
      if (!newItem.name) {
        return res.status(400).json({ error: "Name is required" });
      }

      try {
        const result = await testCollection.insertOne(newItem);
        res.status(201).json({ _id: result.insertedId, ...newItem });
      } catch (err) {
        console.error("Error inserting item:", err);
        res.status(500).json({ error: "Failed to insert item" });
      }
    });

  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
run().catch(console.dir);

// Home route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
