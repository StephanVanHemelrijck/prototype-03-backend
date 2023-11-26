const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { bucket } = require("./lib/firebase");
const fileUpload = require("express-fileupload");
const fs = require("fs");

// Express
const app = express();
const port = 1337;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads/",
    debug: false,
    uploadTimeout: 60000,
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/upload", async (req, res) => {
  try {
    const files = Object.values(req.files).flat();
    // The flat method is used to flatten the array by one level, combining the inner arrays into a single array.

    if (!files) {
      return res.status(400).json({ error: "No files provided" });
    }

    const uploadPromises = files.map(async (file) => {
      const destinationPath = `files/${file.name}`;
      await bucket.upload(file.tempFilePath, {
        destination: destinationPath,
      });
    });

    await Promise.all(uploadPromises);

    // Delete the temporary files
    files.forEach((file) => {
      fs.unlink(file.tempFilePath, (err) => {
        if (err) {
          console.error("Error deleting temporary file:", err);
        }
      });
    });

    res
      .status(200)
      .json({ message: "Files uploaded to Firebase Storage successfully" });
  } catch (error) {
    console.error("Error uploading files to Firebase Storage:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const file = bucket.file(`files/${filename}`);

    const [fileBuffer] = await file.download();

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`File upload backend listening on port ${port}`);
});
