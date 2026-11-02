
require("dotenv").config();
const mongoose = require("mongoose");

async function dropOldIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected!");

    const collection = mongoose.connection.collection("documents");

    await collection.dropIndex("storedName_1");

    console.log("Old storedName index removed successfully!");
  } catch (error) {
    if (error.code === 27 || error.codeName === "IndexNotFound") {
      console.log("Old index does not exist. Nothing to remove.");
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    await mongoose.disconnect();
  }
}

dropOldIndex();
