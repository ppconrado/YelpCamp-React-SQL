if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");

// Usa DB_URL do .env quando disponível (Atlas/produção) ou localhost em desenvolvimento
const seedDbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";

mongoose.connect(seedDbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

// Gerador randomico de titulos de campings
const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  // Deleta tudo do DB.
  await Campground.deleteMany({});

  // Gera os campings aleatoriamente.

  for (let i = 0; i < 300; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      //USER ID no BD para gerar os campings
      author: "6271f6c3dc1ea70934e1e8e8",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(places)} ${sample(descriptors)}`,
      description:
        "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!",
      price,
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      images: [
        {
          url: "https://res.cloudinary.com/ppconrado/image/upload/v1655977367/YelpCamp/cuq1luwtdcvkvjjpjofg.jpg",
          filename: "cuq1luwtdcvkvjjpjofg",
        },
        {
          url: "https://res.cloudinary.com/ppconrado/image/upload/v1653377676/YelpCamp/uwo0jlapo4dmwpanmcwo.jpg",
          filename: "YelpCamp/uwo0jlapo4dmwpanmcwo",
        },
      ],
    });
    await camp.save();
  }
};

// Executa a operacao de popular o DB.

seedDB().then(() => {
  mongoose.connection.close();
});
