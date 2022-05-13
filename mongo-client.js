const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://ShopifyChallengeUser:7XpXX8ydGDC9QJDg@shopifybackendchallenge.zpoxy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Export the mongo client
module.exports = client;