const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(express.json());

const mongoClient = new MongoClient(process.env.mongoURL);
let db;

async function connect() {
  try {
    const conn = await mongoClient.connect();
    db = conn.db("roblox");
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error("DB error:", e);
  }
}

app.post("/api/roblox-activity", async (req, res) => {
  const players = req.body.players;
  if (!Array.isArray(players)) return res.status(400).send("Invalid data");

  const ops = players.map(p => ({
    updateOne: {
      filter: { userId: p.userId },
      update: {
        $set: { userId: p.userId },
        $inc: { time: p.time }
      },
      upsert: true
    }
  }));
  await db.collection("activity").bulkWrite(ops);
  res.sendStatus(200);
});

app.get("/api/roblox-activity", async (_, res) => {
  const players = await db.collection("activity")
                         .find({})
                         .sort({ time: -1 })
                         .limit(10)
                         .toArray();
  res.json({ players });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
  connect();
});
