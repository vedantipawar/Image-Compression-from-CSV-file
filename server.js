const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve the index.html file at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

app.post('/upload', upload.single('file'), (req, res) => {
    console.log('Received a file upload request.');
    
    if (!req.file) {
        console.error('No file received.');
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    console.log(`File uploaded: ${filePath}`);

    validateCsvFile(filePath)
        .then(() => {
            const requestId = uuidv4();
            console.log(`File is valid. Generated Request ID: ${requestId}`);
            res.json({ requestId });
        })
        .catch((error) => {
            console.error(`Validation error: ${error}`);
            res.status(400).json({ error: error });
        })
        .finally(() => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Failed to delete the file: ${err}`);
                } else {
                    console.log(`File deleted: ${filePath}`);
                }
            });
        });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
