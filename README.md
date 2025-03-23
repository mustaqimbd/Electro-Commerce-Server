# Electro Commerce Server (APIs)

## 📝 Project Overview

The **ElectroCommerce Server** is a **scalable and secure** backend solution for an **advanced e-commerce platform**. It is responsible for:

- **Product Management**: Handling product data, categories, attributes, brands, images and reviews.
- **Order Management**: Processing customer orders, updating order statuses, and generating invoices.
- **User Authentication & Security**: Implementing **JWT-based authentication** and **role-based access control (RBAC)**.
- **Business Logic Execution**: Enforcing pricing rules, inventory management, and automated order processing.

Built with **robust RESTful APIs**, the **ElectroCommerce Server** ensures **efficient data flows** and an **optimized e-commerce experience**.

### **Key Functionalities:**

- 🔹 **Product Management:** Develop APIs for creating, reading, updating, and deleting product information, including categories, images, brands, attributes, tags, and reviews.
- 🔹 **Order Management:** Supports order creation, views, editing, filtering, and status updates.
- 🔹 **Security & Authentication:** Implements **JWT-based authentication** for user and admin login, with role-based access control to secure critical endpoints.
- 🔹 **Customer Management:** Handles customer data, order histories, and authentication for a personalized user experience.
- 🔹 **Data Validation & Optimization:** Enforces input validation to improve system performance and prevent data errors.

## 🚀 Features (Developed by Me)

### **Product Management Requirements Documentation**

#### **Overview**

As part of the **ElectroCommerce Server**, I developed the **Product Management** module, which is crucial for handling products and their related entities like categories, subcategories, attributes, brands, tags, reviews, and images. The goal was to create a system that enables both admins and customers to manage and interact with product data efficiently, with specific privileges based on the user's role.

#### **Backend Requirements**

### **Core API Endpoints**

#### **Product Endpoints**

- **POST** `/api/products` - Allows creation of new products with comprehensive data management.
- **GET** `/api/products/customer` - Retrieves a list of products for customers with optional filters such as search terms, categories, brands, and price range.
  - **Query Parameters**: `search`, `category`, `subCategory`, `brand`, `minPrice`, `maxPrice`, `tags`, `sort`, `page`, `limit`.
- **GET** `/api/products/admin` - Admin-specific endpoint to retrieve all products with management options.
- **GET** `/api/products/customer/:id` - Fetches detailed product information for customers.
- **GET** `/api/products/admin/:id` - Provides detailed product info for admins, including management tools.
- **GET** `/api/products/featured` - Displays featured products based on certain criteria.
- **GET** `/api/products/best-selling` - Shows best-selling products based on order data.
- **PATCH** `/api/products/:id` - Updates existing product details.
- **DELETE** `/api/products/delete` - Deletes multiple products in bulk.

#### **Category Management**

- **POST** `/api/categories` - Allows creation of product categories.
- **PATCH** `/api/categories/:id` - Enables updates to category details.
- **DELETE** `/api/categories` - Supports bulk category deletions.
- **GET** `/api/categories` - Retrieves all available categories.

#### **Subcategory Management**

- **POST** `/api/sub-categories` - Adds new subcategories under existing categories.
- **PATCH** `/api/sub-categories/:id` - Allows updates to subcategory details.
- **DELETE** `/api/sub-categories` - Deletes selected subcategories.
- **GET** `/api/sub-categories` - Fetches all subcategories.
- **GET** `/api/sub-categories/by-category/:categoryId` - Retrieves subcategories based on a given category ID.

#### **Attribute Management**

- **POST** `/api/attributes` - Creates attributes (such as color, size) for products.
- **PATCH** `/api/attributes/:id` - Updates existing product attributes.
- **DELETE** `/api/attributes` - Deletes attributes from the system.
- **GET** `/api/attributes` - Lists all available attributes.

#### **Brand Management**

- **POST** `/api/brands` - Creates new product brands.
- **PATCH** `/api/brands/:id` - Updates brand details.
- **DELETE** `/api/brands` - Allows bulk deletion of brands.
- **GET** `/api/brands` - Retrieves a list of all brands.

#### **Tag Management**

- **POST** `/api/tags` - Adds tags to products for better categorization.
- **PATCH** `/api/tags/:id` - Updates tags based on product categories or attributes.
- **DELETE** `/api/tags/:id` - Deletes tags.
- **GET** `/api/tags` - Fetches all available tags.

#### **Review Management**

- **POST** `/api/reviews/:productId` - Allows customers to post reviews on products.
- **PATCH** `/api/reviews/:id` - Edits existing reviews.
- **DELETE** `/api/reviews/:id` - Deletes reviews.
- **GET** `/api/reviews/:productId` - Retrieves all reviews for a product.

#### **Image Management**

- **POST** `/api/images` - Uploads images associated with products.
- **DELETE** `/api/images` - Deletes multiple images at once.
- **GET** `/api/images` - Fetches all images available in the system.
- **GET** `/api/images/:id` - Retrieves a specific image by its ID.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js, MongoDB, Mongoose ODM
- **Authentication:** JWT
- **Validation:** Zod
- **Deployment & Tools:** Postman, Amazon EC2

## 🔐 Security & Authorization

- Secure API endpoints with **JWT-based authentication** for both admins and users.
- **Role-based access control** ensures only authorized users can access critical API endpoints (e.g., only specific privileges can delete or update products, orders).
- Data validation through **Zod** reduces errors and ensures data integrity.
- Comprehensive error handling with standardized API responses to prevent security issues and improve UX.

## 🛢️ Database Design

The **ElectroCommerce Server** utilizes **MongoDB** with a well-structured schema for:

- **Products** (e.g., product details, price, availability)
- **Categories** and **Subcategories** (to organize products)
- **Orders** (tracking customer orders and shipping information)
- **Tags, Brands, and Attributes** (for product classification and advanced filtering)
- **Images** (storing product images and media content)

The database is designed for high performance, optimizing queries for large datasets to handle high traffic and scalability.

## 📦 Installation

Follow these steps to set up the project:

```bash
# Clone the repository
git clone https://github.com/mustaqimbd/Electro-Commerce-Server.git
cd Electro-Commerce-Server

# Copy .env.example to .env and configure the environment variables
cp .env.example .env

# Install dependencies
npm install

# Start the server
npm run dev
```

### Environment Variables

Make sure to configure the `.env` file with appropriate values for:

- **Database connection URL**
- **JWT secret key** and others.

## 📜 API Documentation

The API documentation is available via [Postman](https://galactic-crescent-552501.postman.co/workspace/Flex-softr~643586c4-ba28-4480-8ecc-a65d88817037/collection/28520171-f71522fe-463b-4519-825f-706fbdfc2412?action=share&creator=28520171) for easy exploration and testing.

## 👥 Team

Developed by **Md. Mustaqim Khan** and **Md. Abir Mahmud**.

## 📧 Contact

For inquiries, reach out via [mustaqimkhanbd@gmail.com](mailto:mustaqimkhanbd@gmail.com) or visit [LinkedIn](https://www.linkedin.com/in/mustaqimbd/).
