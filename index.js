// Express setup
const express = require("express");
const app = express();
const port = 3000;

// Mongo dependencies
const mongoClient = require("./mongo-client");
const ObjectId = require("mongodb").ObjectId;

app.get('/find-product', (req, res) => {
    mongoClient.connect(async err => {
        try {
            if (err !== undefined) {
                // Throw error if database connection fails
                throw new Error("Error connecting to the database.");
            }

            // Get products collection
            const products = await mongoClient.db("ShopifyBackendChallengeDb").collection("products");
            
            // Search for requested product ID
            let productSearch = await products.find({
                _id: ObjectId(req.query.productID)
            });
            let productSearchArr = await productSearch.toArray();

            if (productSearchArr.length == 0) {
                // If product not found, throw error
                throw new Error("The requested product ID " + req.query.productID + " was not found.");
            }

            // Send success message if no errors
            res.send({
                status: "SUCCESS",
                data: productSearchArr[0]
            });
        } catch (error) {
            // Send error message in case of an error
            res.send({
                status: "ERROR",
                data: {
                    message: error.toString()
                }
            });
        }
        
        mongoClient.close();
    });
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});