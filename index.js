const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hrjn1tt.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const userCollection = client.db("pollingAndSurveyDB").collection("users");
    const surveyCollection = client
      .db("pollingAndSurveyDB")
      .collection("surveys");
    const voteCollection = client.db("pollingAndSurveyDB").collection("votes");
    const commentCollection = client
      .db("pollingAndSurveyDB")
      .collection("comments");
    
    const paymentCollection = client.db("pollingAndSurveyDB").collection("payments");

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: user.role,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/surveys", async (req, res) => {
      const survey = {
        ...req.body,
        timestamp: new Date(),
      };

      const result = await surveyCollection.insertOne(survey);
      res.send(result);
    });

    app.post("/comments", async (req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    });

    app.get("/comments", async (req, res) => {
      const cursor = commentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/surveys", async (req, res) => {
      const cursor = surveyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/surveys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await surveyCollection.findOne(query);
      res.send(result);
    });


    app.put("/surveys/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedSurvey = req.body
      const survey = {
        $set: {

          title: updatedSurvey.title,
          description: updatedSurvey.description,
           image: updatedSurvey.image,
           category: updatedSurvey.category,
           
      }
    }
    const result = await surveyCollection.updateOne(filter,survey, options)
    res.send(result);
    })

    app.post("/votes", async (req, res) => {
      const { surveyId, vote, email,name, responderName, date } = req.body;
      // console.log(vote);

      const newVote = {
        surveyId: new ObjectId(surveyId),
        vote,
        email,
        name,
        responderName,
        date,
      };
      const result = await voteCollection.insertOne(newVote);
      const updateField = vote === "yes" ? "yesVotes" : "noVotes";
      await surveyCollection.updateOne(
        { _id: new ObjectId(surveyId) },
        { $inc: { [updateField]: 1 } }
      );
      res.send(result);
    });

    app.get("/votes", async (req, res) => {
      const cursor = voteCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      res.send(result);
    });

    app.get("/payment", async (req, res) => {
      const cursor = paymentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Polling and survey server is running");
});

app.listen(port, (req, res) => {
  console.log(`listening on ${port}`);
});
