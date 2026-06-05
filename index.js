import { MongoClient } from "mongodb";
import "dotenv/config";
// module
import express from "express";
import cors from "cors";
const client = new MongoClient(process.env.MONGODB_DB_URI);
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

async function run() {
  try {
    // Connect to the "sample_mflix" database and access its "movies" collection
    const database = client.db(process.env.DB_NAME);
    const jobs = database.collection("jobs");
    const company = database.collection("company");

    // Create a document to insert

    // insert job document route
    app.post("/api/jobs", async (req, res) => {
      const job = req.body;
      const newJob = { ...job, createdAt: new Date() };
      const result = await jobs.insertOne(newJob);
      res.send(result);
    });
    // get company jobs by id route
    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const result = await jobs.find(query).toArray();
      console.log("company jobs", result);
      res.send(result);
    });
    // add company
    app.post("/api/company", async (req, res) => {
      console.log(req.body);
      const result = await company.insertOne(req.body);
      res.send(result);
    });
    // get company profile
    app.get("/api/company", async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }

      const result = await company.findOne(query);
      console.log("company profile", result);
      res.send(result || { message: "No company found", status: 404 });
    });
  } finally {
    // Close the MongoDB client connection
    // await client.close();
  }
}
// Run the function and handle any errors
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port: http://localhost:${port}`);
});
