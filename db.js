const mongoose = require("mongoose");
const mongoURI = `mongodb+srv://${process.env.DB_CONNECTION_CREDS}@cluster0.n8nd2pr.mongodb.net/?retryWrites=true&w=majority`;

mongoose.set("strictQuery", true);
const connectToMongo = async () => {
  await mongoose
    .connect(mongoURI, {
      autoIndex: false,
    })
    .then((con) => console.log("DB connection successful"));
};

module.exports = connectToMongo;
