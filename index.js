// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // ✅ JWT import

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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

// JWT Middleware
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization; // Expecting "Bearer <token>"

  if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden: Invalid token" });
    req.user = decoded; // attach decoded token to request
    next();
  });
}
app.post('/jwt', (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = { email };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.json({ token });
});



// -----------------------------
// MongoDB Operations
// -----------------------------
async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const testCollection = client.db("testDB").collection("testCollection");
    const bookingsCollection = client.db("testDB").collection("bookings");

    // -----------------------------
    // SERVICES ROUTES
    // -----------------------------
    // CREATE service
    app.post("/services", async (req, res) => {
      try {
        const service = req.body;
        service.type = service.projectType || service.type;
        service.name = service.name || service.title;

        if (
          !service.name ||
          !service.category ||
          !service.type ||
          !service.description ||
          !service.duration ||
          !service.budget ||
          !service.level ||
          !service.price ||
          !service.date
        ) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await testCollection.insertOne(service);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /services error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // READ ALL services (JWT protected)
    app.get("/services", async (req, res) => {
      try {
        const services = await testCollection.find({}).toArray();
        res.status(200).json(services);
      } catch (err) {
        console.error("GET /services error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // READ ONE service
    app.get("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch {
          return res.status(400).json({ message: "Invalid service ID" });
        }

        const doc = await testCollection.findOne({ _id: objectId });
        if (!doc) return res.status(404).json({ message: "Service not found" });

        res.status(200).json(doc);
      } catch (err) {
        console.error("GET /services/:id error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // UPDATE service
    app.patch("/services/:id", async (req, res) => {
      const { id } = req.params;
      let objectId;
      try {
        objectId = new ObjectId(id);  // এখানে যদি id invalid হয়, 400 error আসবে
      } catch {
        return res.status(400).json({ message: "Invalid service ID" });
      }

      const payload = { ...req.body };
      delete payload._id;

      const result = await testCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: payload },
        { returnDocument: "after" }
      );

      if (!result.value) return res.status(404).json({ message: "Service not found" });

      res.status(200).json(result.value);
    });

    // DELETE service
    app.delete("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch {
          return res.status(400).json({ message: "Invalid service ID" });
        }

        const result = await testCollection.deleteOne({ _id: objectId });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Service not found" });

        res.status(200).json({ message: "Service deleted" });
      } catch (err) {
        console.error("DELETE /services/:id error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // -----------------------------
    // BOOKINGS ROUTES
    // -----------------------------
    // CREATE booking
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        if (!booking.serviceId || !booking.userName || !booking.userEmail) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const result = await bookingsCollection.insertOne({
          serviceId: booking.serviceId,
          userName: booking.userName,
          userEmail: booking.userEmail,
          message: booking.message || "",
          createdAt: new Date().toISOString()
        });

        res.status(201).json({ insertedId: result.insertedId });
      } catch (err) {
        console.error("POST /bookings error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // READ ALL bookings (JWT protected)
    app.get("/bookings", async (req, res) => {
      try {
        const bookings = await bookingsCollection.find({}).toArray();
        res.status(200).json(bookings);
      } catch (err) {
        console.error("GET /bookings error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // READ ONE booking
    app.get("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch {
          return res.status(400).json({ message: "Invalid booking ID" });
        }

        const doc = await bookingsCollection.findOne({ _id: objectId });
        if (!doc) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json(doc);
      } catch (err) {
        console.error("GET /bookings/:id error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // DELETE booking
    app.delete("/bookings/:id", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid booking ID" });

        const objectId = new ObjectId(id);
        const result = await bookingsCollection.deleteOne({ _id: objectId });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ message: "Booking deleted", deletedCount: result.deletedCount });
      } catch (err) {
        console.error("DELETE /bookings/:id error:", err);
        res.status(500).json({ message: "Server Error" });
      }
    });

    // UPDATE booking status
    app.put("/bookings/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: "Status is required" });

        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch {
          return res.status(400).json({ message: "Invalid booking ID" });
        }

        const result = await bookingsCollection.updateOne(
          { _id: objectId },
          { $set: { status } }
        );

        if (result.matchedCount === 0) return res.status(404).json({ message: "Booking not found" });

        res.status(200).json({ message: "Status updated successfully" });
      } catch (err) {
        console.error("PUT /bookings/:id error:", err);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
