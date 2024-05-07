const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// custom middleweres
const logger = async (req, res, next) => {
  console.log('Called', req.host, req.originalUrl)
  next();
}
//middlewere's
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());




// manage detabase
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oh0s98i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();  //comment this line before deploy in varcel






    //collections
    const userCollection = client.db("carDoctorDB").collection("users");
    const servicesCollection = client.db("carDoctorDB").collection("services");
    const bookingsCollection = client.db("carDoctorDB").collection("bookings");

    //operations

    //AUTH related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

        })
        .send({ success: true })
    })

    //post a user
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      console.log(newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result)
    })

    //get users 
    app.get('/users', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // get a specific user 
    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result)
    })

    //get services 
    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    // get a specific service 
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };
      const result = await servicesCollection.findOne(query, options);
      res.send(result)
    })

    //post a booking
    app.post('/bookings', async (req, res) => {
      const newOrder = req.body;
      console.log(newOrder);
      const result = await bookingsCollection.insertOne(newOrder);
      res.send(result)
    })

    //get bookings 
    app.get('/bookings', logger, async (req, res) => {
      console.log(req.query.email);
      console.log('tok tok token', req.cookies.token)
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    })

    // update a specific booking
    app.patch('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateBooking = req.body;
      console.log(updateBooking);
      const updateDoc = {
        $set: {
          status: updateBooking.status
        }
      }
      res.send(await bookingsCollection.updateOne(filter, updateDoc))
    })

    // delete a specific booking
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result)
    })








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });  //comment this line before deploy in varcel
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
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
