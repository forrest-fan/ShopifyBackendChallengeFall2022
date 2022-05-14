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

/**
 * Delete operation
 * Accessed at /remove-product
 * The request body should contain the product ID of the product to delete
 * A successful deletion will return an object with status of SUCCESS.
 */
app.post("/remove-product", jsonParser, (req, res) => {
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

            let deleteResponse = await products.deleteOne({
                _id: ObjectId(req.body.productID)
            });
            if (deleteResponse.deletedCount > 0) {
                // Return success response if deleted product
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

/**
 * Request to place orders, which updates product inventory
 * Accessed at /submit-order
 * Input requires a boolean to determine whether the order is outgoing or incoming, and an object orderDetails that specifies the product IDs in the order and the quantities of each product
 * Output will consist of
 *      - The order ID
 *      - The final order details (since not all order requests may be fulfilled)
 *      - Arrays to indicate which orders were fully fulfilled, partially fulfilled, and not fulfilled
 */
app.post("/submit-order", jsonParser, (req, res) => {
    mongoClient.connect(async err => {
        try {
            if (err !== undefined) {
                // Throw error if database connection fails
                throw new Error("Error connecting to the database.");
            }

            if (!("isOutgoing" in req.body)) {
                // Throw error if no isOutgoing property
                throw new Error("Please specify whether this order is outgoing or incoming using the isOutgoing property, which takes a boolean value.");
            } else if (typeof(req.body.isOutgoing) !== "boolean") {
                // Throw error if isOutgoing property is not a boolean value
                throw new Error("The isOutgoing property takes a boolean value. True for outgoing order and false for incoming order.");
            } else if (!("orderDetails" in req.body)) {
                // Throw error if no orderDetails property
                throw new Error("Please provide the order details in the orderDetails property. The value should be an object with the productID as the key and the quantity ordered as the value.");
            }
            
            Object.keys(req.body.orderDetails).forEach(productID => {
                if (typeof(req.body.orderDetails[productID]) !== "number") {
                    // Throw error if quantity values are not numbers
                    throw new Error("The quantity provided for " + productID + " must be a number.");
                }
            });

            // Get collections
            const products = await mongoClient.db("ShopifyBackendChallengeDb").collection("products");
            const orders = await mongoClient.db("ShopifyBackendChallengeDb").collection("orders");

            // Generate order object
            let orderObj = {
                isOutgoing: req.body.isOutgoing,
                orderDetails: [],
                datetime: new Date()
            };

            let fulfilled = [];
            let partial = [];
            let unfulfilled = [];

            // Update inventories and add to orderObj if successful
            let productIDs = Object.keys(req.body.orderDetails);
            for (const productID of productIDs) {
                let productData = await products.find({
                    _id: ObjectId(productID)
                });
                let productsArr = await productData.toArray();
                if (productsArr.length === 0) {
                    // Product ID not found
                    unfulfilled.push(productID);
                    continue;
                }

                let inventoryChangeObj = {};
                let fulfillmentType = "";
                let fulfillmentInfo = {};
                if (req.body.isOutgoing) {
                    if (productsArr[0].inventory === 0) {
                        // Cannot fulfill order, product out of stock
                        unfulfilled.push(productID);
                        continue;
                    } else if (productsArr[0].inventory < req.body.orderDetails[productID]) {
                        // Partially fulfill the order, cannot have negative inventory
                        inventoryChangeObj.$set = {
                            inventory: 0
                        };
                        fulfillmentType = "PARTIAL";
                        fulfillmentInfo[productID] = productsArr[0].inventory;
                    } else {
                        // Fulfill entire order, decrement inventory
                        inventoryChangeObj.$inc = {
                            inventory: -1 * req.body.orderDetails[productID]
                        };
                        fulfillmentType = "FULFILLED";
                        fulfillmentInfo[productID] = req.body.orderDetails[productID];
                    }
                } else {
                    // Incoming order, always fulfillable
                    inventoryChangeObj.$inc = {
                        inventory: req.body.orderDetails[productID]
                    };
                    fulfillmentType = "FULFILLED";
                    fulfillmentInfo[productID] = req.body.orderDetails[productID];
                }
                let updateResponse = await products.updateOne({
                    _id: ObjectId(productID)
                }, inventoryChangeObj);
                if (updateResponse.modifiedCount > 0) {
                    // If updated inventory, add to status logger and update order object with final order details
                    switch (fulfillmentType) {
                        case "PARTIAL":
                            partial.push(productID);
                            orderObj.orderDetails.push(fulfillmentInfo);
                            break;
                        case "FULFILLED":
                            fulfilled.push(productID);
                            orderObj.orderDetails.push(fulfillmentInfo);
                            break;
                        default:
                            unfulfilled.push(productID);
                    }
                } else {
                    unfulfilled.push(productID);
                }
            };

            if (unfulfilled.length === productIDs.length) {
                // If all orders were unfulfilled, throw an error.
                throw new Error("No orders were fulfilled. Either the products could not be found or they were out of stock.");
            }

            let orderResponse = await orders.insertOne(orderObj);
            let orderID = orderResponse.insertedId;

            res.send({
                status: "SUCCESS",
                data: {
                    orderID: orderID,
                    orderDetails: orderObj,
                    fulfilled: fulfilled,
                    partial: partial,
                    unfulfilled: unfulfilled
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
})

app.listen(port, () => {
    console.log("Listening on port " + port);
});