# Image Processing System

## Overview

This project involves building a system to efficiently process image data from CSV files using an asynchronous approach. The system includes a client-side HTML and JavaScript interface for uploading CSV files and checking image processing status. The server-side uses Node.js, Express, MongoDB, and various other tools to validate CSV files, process images using Sharp, and store data in MongoDB.

### Features
- Upload CSV files containing image URLs, serial numbers, and product names.
- Asynchronously process images (e.g., compress them).
- Track the status of image processing (processing, finished, error).
- Store processed images locally and maintain their URLs in MongoDB.
- Group image processing results by serial number and product name.

## Tech Stack

- **Node.js**: For server-side logic.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: Database to store image processing statuses and metadata.
- **Mongoose**: ODM for MongoDB.
- **Multer**: Middleware for handling file uploads.
- **Sharp**: Image processing library.
- **Axios**: For making HTTP requests to fetch images.
- **HTML, JavaScript**: For the front-end interface.

## Low-Level Design (LLD)

### **1. Image Schema (Mongoose Model)**

- **Fields**:
	- `requestId`: A unique identifier for each request.
	- `serialNumber`: Serial number for grouping images.
	- `productName`: Name of the product associated with the image.
	- `imageUrl`: URL of the original image.
	- `status`: The current status of image processing (e.g., 'processing', 'finished', 'error').
	- `processedImageUrl`: URL of the processed image.
	- `errorMessage`: Stores any error messages encountered during processing.

### **2. CSV Validation Logic**

- **Purpose**: Validate the structure and content of the uploaded CSV file.
- **Expected Headers**:
	- 'Serial Number'
	- 'Product Name'
	- 'Input Image Urls'
- **Validation**:
	- Ensure all required headers are present and correctly ordered.
	- Check that each row contains valid data for all required fields.

### **3. Image Processing Logic**

- **Fetching Images**:
	- Use `axios` to download images from the provided URLs.
- **Processing**:
	- Resize images to 50% of their original dimensions.
	- Convert images to JPEG format with a quality setting of 80%.
	- Save the processed images locally and update the corresponding MongoDB document with the processed image URL.

### **4. Status Tracking**

- **Status Management**:
	- Each image's processing status is tracked in MongoDB.
	- Possible statuses include:
		- `processing`: When the image processing has started.
		- `finished`: When the image processing is completed successfully.
		- `error`: If an error occurs during processing.
- **Error Handling**:
	- Errors during processing are captured and stored in the `errorMessage` field of the image document.

### **5. User Interface (UI)**

- **File Upload**:
	- HTML form to upload CSV files.
- **Status Check**:
	- A separate form where users can input a `requestId` to check the status of their image processing.
- **Output**:
	- Display grouped images by `serialNumber` and `productName`.
	- Input and output image URLs are listed together under each product name in a table-like format.

### **6. API Endpoints**

- **Upload CSV**:
	- **Endpoint**: `/upload`
	- **Method**: `POST`
	- **Functionality**: Accepts a CSV file, validates it, generates a `requestId`, and starts the image processing.

- **Check Status**:
	- **Endpoint**: `/status/:requestId`
	- **Method**: `GET`
	- **Functionality**: Returns the current status of image processing for the given `requestId`, including the processed image URLs and any errors.

---


