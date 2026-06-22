import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

const dbConnection = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error("MONGO_URI is not defined");
    process.exit(1);
  }

  // Mask URI for logs
  const maskedURI = mongoURI.replace(
    /^(mongodb[^\/]+:\/\/)([^:]+:)[^@]+@/,
    `$1***:***@`
  );

  console.log("Attempting connection to (masked):", maskedURI);

  let attempts = 0;

  const connect = async () => {
    try {
      attempts++;

      console.log(`Connecting to MongoDB (${attempts}/${MAX_RETRIES})...`);

      await mongoose.connect(mongoURI, {
        dbName: "Hope4AllDB",
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: "majority",
      });

      console.log("MongoDB connected successfully");
      console.log("Database:", mongoose.connection.name);

    } catch (error) {
      console.error("MongoDB connection failed:", error.message);

      if (attempts >= MAX_RETRIES) {
        console.error("Max retries reached. Exiting app.");
        process.exit(1);
      }

      console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(connect, RETRY_DELAY);
    }
  };

  // Optional logs only (NO recursive reconnect here ❌)
  mongoose.connection.on("connected", () => {
    console.log("Mongoose connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("Mongoose error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected (no auto-reconnect loop)");
  });

  await connect();
};

export default dbConnection;