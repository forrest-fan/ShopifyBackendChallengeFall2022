// Express setup
const express = require("express");
const app = express();
const port = 3000;

const bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

// Mongo dependencies
const mongoClient = require("./mongo-client");
const ObjectId = require("mongodb").ObjectId;

/*
 * Read operation
 * Accessed with /find-product?productID={requested product ID}&name={requested product name}
 * If successful, returns an object containing an array of query results
 * If unsuccesful, returns an object containing an error message
 */
app.get('/find-product', (req, res) => {
    mongoClient.connect(async err => {
        try {
            if (err !== undefined) {
                // Throw error if database connection fails
                throw new Error("Error connecting to the database.");
            }

            // Get products collection
            const products = await mongoClient.db("ShopifyBackendChallengeDb").collection("products");
            
            // Generate query object
            let searchObj = {};
            if ("productID" in req.query) {
                searchObj._id = ObjectId(req.query.productID);
            }
            if ("name" in req.query) {
                searchObj.name = req.query.name;
            }
            
            if (Object.keys(searchObj).length === 0) {
                // If no query filters inputted, throw error
                throw new Error("Please specify a product ID or a name to search for.");
            }

            // Search for requested product ID
            let productSearch = await products.find(searchObj);
            let productSearchArr = await productSearch.toArray();

            if (productSearchArr.length == 0) {
                // If product not found, throw error
                throw new Error("The requested product was not found.");
            }

            // Send success message if no errors
            res.send({
                status: "SUCCESS",
                data: productSearchArr
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

/**
 * Create operation
 * Accessed with /add-products
 * Takes a JSON body and reads name, description, price, and inventory properties. Name and price are mandatory.
 * Returns a JSON object with the product ID of the newly added product.
 */
app.post("/add-product", jsonParser, (req, res) => {
    mongoClient.connect(async err => {
        try {
            if (err !== undefined) {
                // Throw error if database connection fails
                throw new Error("Error connecting to the database.");
            }

            // Get products collection
            const products = await mongoClient.db("ShopifyBackendChallengeDb").collection("products");
            // Error handling: check mandatory params and check request data types
            if (!("name" in req.body)) {
                // Throw error if missing name property in request
                throw new Error("Please specify a name for the new product to add.");
            } else if (typeof(req.body.name) !== "string") {
                // Throw error if name property in request is not a string value
                throw new Error("The product's name must be a string.");
            } else if (!("price" in req.body)) {
                // Throw error if missing price property in request
                throw new Error("Please specify a price for the new product to add.");
            } else if (typeof(req.body.price) !== "number") {
                // Throw error if price property in request is not a number value
                throw new Error("The product's price must be a number.");
            } else if ("description" in req.body && typeof(req.body.description) !== "string") {
                // Throw error if description property in request is not a string value
                throw new Error("The product's description must be a string.");
            } else if ("inventory" in req.body && typeof(req.body.inventory) !== "number") {
                // Throw error if inventory property in request is not a number value
                throw new Error("The product's inventory must be a number.");
            }

            // Create product object
            let newProduct = {
                name: req.body.name,
                description: "description" in req.body ? req.body.description : "",
                price: req.body.price,
                inventory: "inventory" in req.body ? req.body.inventory : 0
            };

            // Add the product to mongoDB
            let createResponse = await products.insertOne(newProduct);

            // Send success response including the auto-generated ID of the new product
            res.send({
                status: "SUCCESS",
                data: {
                    productID: createResponse.insertedId
                }
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
    });
});

const editParamTypes = {
    name: "string",
    description: "string",
    price: "number",
}

/**
 * Update operation
 * Accessed with /edit-products
 * Request body must contain the product ID of the product to update, and can include name, description, and price updates. Inventory updates should be done through the order request.
 * A successful response will only contain a status of SUCCESS, with no additional data.
 */
app.post("/edit-product", jsonParser, (req, res) => {
    mongoClient.connect(async err => {
        try {
            if (err !== undefined) {
                // Throw error if database connection fails
                throw new Error("Error connecting to the database.");
            }

            // Get products collection
            const products = await mongoClient.db("ShopifyBackendChallengeDb").collection("products");
            // Error handling: check mandatory params and check request data types
            if (!("productID" in req.body)) {
                // Throw error if missing productID property in request
                throw new Error("Please specify the product ID of the product you want to edit.");
            }
            Object.keys(editParamTypes).forEach(param => {
                if (param in req.body && typeof(req.body[param]) !== editParamTypes[param]) {
                    // Throw error if property in request is not expected data type
                    throw new Error("The product's " + param + " must be a " + editParamTypes[param] + ".");
                }
            });

            // Create objects for updating document
            let updateFilter = {
                _id: ObjectId(req.body.productID)
            };
            let updateObj = {
                $set: {}
            }
            Object.keys(editParamTypes).forEach(param => {
                if (param in req.body) {
                    updateObj.$set[param] = req.body[param];
                }
            });

            let updateResponse = await products.updateOne(updateFilter, updateObj);
            if (updateResponse.modifiedCount > 0) {
                // Return success response if modified product
                res.send({
                    status: "SUCCESS",
                    data: {}
                });
            } else {
                // Return error response if product could not be found
                throw new Error("Could not find product with product ID " + req.body.productID);
            }
        } catch (error) {
            // Send error message in case of an error
            res.send({
                status: "ERROR",
                data: {
                    message: error.toString()
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});