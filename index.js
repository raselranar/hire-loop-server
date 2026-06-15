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

// verify jwt token

const verifySeeker = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "seeker") return res.status(403).send("forbidden access");
  next();
};
// admin verify
const verifyAdmin = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "admin") return res.status(403).send("forbidden access");
  next();
};
// recruiter verify
const verifyRecruiter = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "recruiter") return res.status(403).send("forbidden access");
  next();
};

async function run() {
  try {
    // Connect to the "sample_mflix" database and access its "movies" collection
    const database = client.db(process.env.DB_NAME);
    const jobs = database.collection("jobs");
    const company = database.collection("company");
    const users = database.collection("user");
    const jobApplication = database.collection("jobApplication");
    const ses = database.collection("session");

    const verifyToken = async (req, res, next) => {
      console.log(req.headers);
      const authorization = req?.headers?.authorization;
      if (!authorization) return res.status(401).send("Unauthorized");

      const token = authorization.split(" ")[1];
      if (token === "null") return res.status(401).send("Unauthorized");
      const query = { token };
      const session = await ses.findOne(query);
      if (!session) return res.status(401).send("Unauthorized");

      const userId = session.userId;
      const userQuery = { _id: userId };
      const user = users.findOne(userQuery);
      if (!user) return res.status(401).send("Unauthorized");
      req.user = user;

      next();
    };

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
    app.get(
      "/api/jobApplication",
      verifyToken,
      verifySeeker,
      async (req, res) => {
        const applicantId = req.query.applicantId;
        if (req.user._id.toString() !== applicantId)
          return res.status(403).send("forbidden access");

        const query = { applicantId };
        console.log(query);
        const result = await jobApplication.find(query).toArray();
        res.send(result);
      },
    );
    // get all jobs
    app.get("/api/jobs", async (req, res) => {
      const query = {};

      console.log("query", req.query);
      if (req.query.search) {
        query.$or = [
          { jobTitle: { $regex: req.query.search, $options: "i" } },
          { company: { $regex: req.query.search, $options: "i" } },
        ];
      }
      if (req.query.department) {
        query.department = req.query.department;
      }
      if (req.query.experience) {
        query.experience = req.query.experience;
      }

      const result = await jobs.find(query).toArray();
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
    app.get("/api/companies", verifyToken, verifyAdmin, async (req, res) => {
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
