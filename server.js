const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const sharp = require('sharp');
const Image = require('./models/image'); // Import the Image model

const app = express();
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/imageProcessing', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Serve the index.html file at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to validate the CSV file
function validateCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        const requiredHeaders = ['Serial Number', 'Product Name', 'Input Image Urls'];
        let isValid = true;

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('headers', (headers) => {
                if (headers.length !== 3 || !requiredHeaders.every((header, index) => header === headers[index])) {
                    isValid = false;
                    reject('CSV format is incorrect.');
                }
            })
            .on('data', (row) => {
                if (!row['Serial Number'] || !row['Product Name'] || !row['Input Image Urls']) {
                    isValid = false;
                }
            })
            .on('end', () => {
                if (isValid) {
                    resolve(true);
                } else {
                    reject('CSV data is invalid.');
                }
            })
            .on('error', (error) => {
                reject(`Error reading CSV file: ${error.message}`);
            });
    });
}

// Function to process images
async function processImage(imageUrl, requestId) {
    try {
        // Fetch the image
        const response = await axios({ url: imageUrl, responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data);

        // Process the image (e.g., compress)
        const processedImageBuffer = await sharp(imageBuffer)
            .resize(800) // Example resize operation
            .toBuffer();

        // Generate a unique filename and define the path to save the processed image
        const processedImageName = `${uuidv4()}.jpg`;
        const processedImagePath = path.join(__dirname, 'processed', processedImageName);

        // Ensure the 'processed' directory exists
        fs.mkdirSync(path.dirname(processedImagePath), { recursive: true });

        // Save the processed image locally
        fs.writeFileSync(processedImagePath, processedImageBuffer);

        // Update the MongoDB document with the local file path of the processed image
        await Image.updateOne(
            { requestId, imageUrl },
            { status: 'finished', processedImageUrl: processedImagePath }
        );

        console.log(`Image processed and saved locally: ${processedImagePath}`);
    } catch (error) {
        console.error(`Error processing image ${imageUrl}: ${error}`);
        await Image.updateOne(
            { requestId, imageUrl },
            { status: 'error', errorMessage: error.message }
        );
    }
}

// Endpoint to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    console.log('Received a file upload request.');

    if (!req.file) {
        console.error('No file received.');
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    console.log(`File uploaded: ${filePath}`);

    try {
        await validateCsvFile(filePath);
        const requestId = uuidv4();
        console.log(`File is valid. Generated Request ID: ${requestId}`);

        // Read the CSV file and process each image
        const csvStream = fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', async (row) => {
                const imageUrls = row['Input Image Urls'].split(',');

                for (const imageUrl of imageUrls) {
                    const imageDoc = new Image({
                        requestId,
                        imageUrl: imageUrl.trim(),
                    });

                    await imageDoc.save();

                    // Process each image asynchronously
                    processImage(imageUrl.trim(), requestId);
                }
            })
            .on('end', () => {
                console.log('CSV file processing completed.');

                // File deletion after processing is complete
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error(`Failed to delete the file: ${err}`);
                    } else {
                        console.log(`File deleted: ${filePath}`);
                    }
                });
            });

        res.json({ requestId });
    } catch (error) {
        console.error(`Validation error: ${error}`);
        res.status(400).json({ error: error });
    }
});

app.get('/status/:requestId', async (req, res) => {
    const { requestId } = req.params;
    
    try {
        // Find all images with the given requestId
        const images = await Image.find({ requestId });

        if (!images.length) {
            return res.status(404).json({ error: 'No images found for this Request ID.' });
        }

        // Return the status of each image
        res.json(images);
    } catch (error) {
        console.error(`Error fetching status for Request ID ${requestId}: ${error}`);
        res.status(500).json({ error: 'An error occurred while fetching the status.' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
