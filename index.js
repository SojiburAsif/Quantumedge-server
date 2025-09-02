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


    app.post("/services", async (req, res) => {
      try {
        const service = req.body;

        if (
          !service.name ||
          !service.category ||
          !service.type ||
          !service.description ||
          !service.duration ||
          !service.budget ||
          !service.level
        ) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await testCollection.insertOne(service);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // GET /services - Get all projects/services
    app.get("/services", async (req, res) => {
      try {
        const services = await testCollection.find({}).toArray();
        res.status(200).json(services);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
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
