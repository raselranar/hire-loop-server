import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
// module
import express from "express";
import cors from "cors";
const client = new MongoClient(process.env.MONGODB_DB_URI);
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(req);
  next();
});

async function run() {
  try {
    // Connect to the "sample_mflix" database and access its "movies" collection
    const database = client.db(process.env.DB_NAME);
    const jobs = database.collection("jobs");
    const company = database.collection("company");
    const users = database.collection("user");
    const jobApplication = database.collection("jobApplication");

    // get users
    app.get("/api/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });
    // job application route
    app.post("/api/jobApplication", async (req, res) => {
      const result = await jobApplication.insertOne(req.body);
      console.log(result);
      res.send(result);
    });

    // get all applications of applicant
    app.get("/api/jobApplication", async (req, res) => {
      const query = { applicantId: req.query.applicantId };
      console.log(query);
      const result = await jobApplication.find(query).toArray();
      res.send(result);
    });
    // get all jobs
    app.get("/api/jobs", async (req, res) => {
      const result = await jobs.find().toArray();
      res.send(result);
    });

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
    // get jobs details by id
    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobs.findOne(query);
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
    // get companies
    app.get("/api/companies", async (req, res) => {
      const result = await company.find().toArray();
      res.send(result);
    });

    // get companies by id
    app.patch("/api/companies/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedCompany = req.body;
      const updatedDoc = {
        $set: {
          status: updatedCompany.status,
        },
      };
      const result = await company.updateOne(query, updatedDoc);
      console.log("get companies by id", result);
      const response =
        result.modifiedCount > 0
          ? { message: "success", status: 200 }
          : { message: "No company found", status: 404 };
      res.send(response);
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
