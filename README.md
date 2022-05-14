# Shopify Backend Internship Application Challenge - Fall 2022

This CRUD app represents a logistics systems that can track inventories of certain products. Through this API, users can create new products, search for products by ID or by name, edit products, and delete products. The API also enables order tracking, which would automatically update inventories of the products involved in the orders. Orders can be submitted for both incoming and outgoing orders, and the app will fulfill the orders appropriately. For example, if Product A only has 20 units left in inventory and the order requests 30 units, the app will partially fulfill the order and send 20 units out.

## 1. Using the App

### 1.1 Starting it locally

1. The app uses Node.js, so verify that it is installed on your computer with `npm --version` in a terminal. If it isn't installed, install the latest version [here](https://nodejs.org/en/download/).
2. Clone the project to your local machine with `git clone https://github.com/forrest-fan/ShopifyBackendChallengeFall2022.git`.
3. Navigate to the root directory of the project, and install all dependencies using `npm install`.
4. In the same directory, use `npm start` to start the app. The app will run on your localhost at http://localhost:3000/.

### 1.2 Access live demo

... type out live demo at Replit here ...

### 1.3 Making API requests

#### 1.3.1 How to make API requests

[Postman](https://www.postman.com/) can be used to make API requests to this app, but other API testing services can be used as well. The API can also be called from within your application through traditional HTTP requests.

#### 1.3.2 Create Product

The API endpoint to create a new product is `/add-product`. Create a POST request and provide the following information in the request body:

| Property | Data Type | Description | Mandatory |
|-----------|-----------|-----------|-----------|
| `name` | String | This property specifies the name of the new product being created. | Yes |
| `description` | String | This property provides a description for the product being created. | No |
| `price` | Number | This property provides a price point for the new product. | Yes |
| `inventory` | Number | This property specifies the quantity of units of this product in the system. | No |

The response will have a `status` property indicating whether the product was successfully created or not. The possible values are `SUCCESS` and `ERROR`.

A succesful response will include the following information in the `data` property.

| Property | Data Type | Description |
|-----------|-----------|-----------|
| `productID` | String | The auto-generated product ID of the newly created product. This should be saved as it will be used to perform operations on this product at other API endpoints. |

An unsuccessful response will include an error message in the `data` property.

#### 1.3.3 Find Product

The API endpoint to search for a product is `/find-product`. Create a GET request with the following parameters in the URL. While neither property is mandatory, the request must have at least 1 of the 2. If both are provided, the API will search for a product that matches both the ID and the name.

| Property | Data Type | Description | Mandatory |
|-----------|-----------|-----------|-----------|
| `name` | String | This property specifies the name of the product being searched for. | No |
| `productID` | String | This property specifies the ID of the product being searched for. | No |

A successful response will have product details in the `data` property. This object matches the format that is stored in the `products` collection in the database. See section 2.1 for the document formatting.

An unsuccessful response will have an error message in the `data` property.

#### 1.3.4 Edit Product

The API endpoint to edit products is `/edit-product`. Create a POST rqequest with the following properties in the request body.

| Property | Data Type | Description | Mandatory |
|-----------|-----------|-----------|-----------|
| `productID` | String | The ID of the product being edited. | Yes |
| `name` | String | The new name of the product being edited. | No |
| `description` | String | The new description of the product being edited. | No |
| `price` | Number | The new price of the product being edited. | No |

A successful response will not send any data back, except for confirmation that the product was successfully edited. The `data` property will be an empty object.

An unsuccessful response will have an error message in the `data` property.

#### 1.3.5 Delete Product

The API endpoint to delete a product is `/remove-product`. Create a POST rqequest with the following properties in the request body.

| Property | Data Type | Description | Mandatory |
|-----------|-----------|-----------|-----------|
| `productID` | String | This property specifies the ID of the product being deleted. | Yes |

A successful response will not send any data back, except for confirmation that the product was successfully edited. The `data` property will be an empty object.

An unsuccessful response will have an error message in the `data` property.

#### 1.3.6 Submit Order

The API endpoint to submit an order is `/submit-order`. Create a POST request with the follow order details in the request body.

| Property | Data Type | Description | Mandatory |
|-----------|-----------|-----------|-----------|
| `isOutgoing` | boolean | This property will be true if the order is outgoing (inventory decreasing) and will be false if the order is incoming (inventory increasing). | Yes |
| `orderDetails` | Object (see 1.3.6.1) | This property includes all products involved in the shipment and their quantities. | Yes |

The API wlil apply logic on the order details to update the inventory within the database accordingly. The inventory will never be negative, so if the order is outgoing and a particular product in order details contains a quantity greaer than the inventory, the product will be considered to be partially fulfilled and inventory will be set to 0.

A successful response will include the following properties in the `data` object.

| Property | Data Type | Description |
|-----------|-----------|-----------|
| `orderID` | String | The ID of the order. |
| `orderDetails` | Object (see 1.3.6.2) | The final details of the order. Since not all items may be fully fulfilled, this object will have details on the actual fulfillment quantities of each product. |
| `fulfilled` | Array of product IDs | A list of the products that were fully fulfilled as requested in the order. |
| `partial` |  Array of product IDs | A list of the products that were partially fulfilled due to low inventory. |
| `unfulfilled` |  Array of product IDs | A list of products that were not fulfilled at all because it was out of stock or it could not be found in the system. |

##### 1.3.6.1 Request Order Details Object Formatting

The `orderDetails` property should be a key-value mapping, with the key being the product ID of the product being ordered and the value being the quantity of the order. For example,
```json
{
    "productID123": 100,
    "productID456": 25
}
```

##### 1.3.6.2 Response Order Details Object Formatting

The `orderDetails` property in the response is the document that gets stored in the `orders` collection in the database. See section 2.2 for the document formatting in the database.

## 2. Database Design

There are 2 collections in the database. `products` stores the products in the inventory system and `orders` keeps a history of all orders fulfilled.

### 2.1 `products` Collection

A document in the `products` collection has the following fields.

| Property | Data Type | Description |
|-----------|-----------|-----------|
| `_id` | String | The ID of the product. |
| `name` | String | The name of the product. |
| `description` | String | The description of the product. |
| `price` | Number | The price of the product. |
| `inventory` | Number | The quantity of units in inventory of the product. |

### 2.2 `orders` Collection

A document in the `orders` collection has the following fields.

| Property | Data Type | Description |
|-----------|-----------|-----------|
| `_id` | String | The ID of the order. |
| `isOutgoing` | boolean | Determines whether the order increased or decreased inventory. True for an outgoing order which decreases inventory, and false for an incoming order which increases inventory. |
| `orderDetails` | Object (see 1.3.6.1) | The products involved in the order and their quantities. |
| `datetime` | Date | The date and time the order was processed. |