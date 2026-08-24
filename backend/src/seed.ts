import crypto from "node:crypto";
import { db } from "./db";

const products = [
  { name: "Pikachu", type: "Electric", price: 2999, description: "The iconic Electric Mouse Pokémon. Cheerful, loyal, and always ready with a Thunderbolt.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { name: "Charmander", type: "Fire", price: 2499, description: "A Fire-type starter with a flame on its tail that shows its mood.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { name: "Bulbasaur", type: "Grass/Poison", price: 2499, description: "A Grass/Poison starter that carries a plant bulb on its back.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { name: "Squirtle", type: "Water", price: 2499, description: "A Water-type starter known for retreating into its shell.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { name: "Jigglypuff", type: "Normal/Fairy", price: 1999, description: "Sings a soothing melody that lulls listeners to sleep.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png" },
  { name: "Snorlax", type: "Normal", price: 4999, description: "Eats 400kg of food a day and then falls asleep.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png" },
  { name: "Gengar", type: "Ghost/Poison", price: 3499, description: "Hides in shadows and loves to play tricks on people.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png" },
  { name: "Eevee", type: "Normal", price: 2799, description: "An Evolution Pokémon with an unstable genetic makeup.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
  { name: "Machop", type: "Fighting", price: 2199, description: "Trains constantly to build its already impressive muscles.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/66.png" },
  { name: "Psyduck", type: "Water", price: 2199, description: "Constantly suffers from a headache that hides psychic powers.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },
  { name: "Mewtwo", type: "Psychic", price: 9999, description: "A Legendary Pokémon created through genetic manipulation.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png" },
  { name: "Dragonite", type: "Dragon/Flying", price: 7999, description: "Said to make its home somewhere in the sea and guide lost ships.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png" },
  { name: "Vulpix", type: "Fire", price: 2299, description: "As it grows, it grows more of its beautiful six tails.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/37.png" },
  { name: "Onix", type: "Rock/Ground", price: 2999, description: "As it grows, its body comes to resemble a series of huge rocks.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/95.png" },
  { name: "Lapras", type: "Water/Ice", price: 4499, description: "A gentle Pokémon that ferries people across bodies of water.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png" },
  { name: "Gyarados", type: "Water/Flying", price: 5499, description: "Rarely seen in a docile state; famed for its rage and power.", image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png" },
];

const count = db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number };

if (count.c === 0) {
  const insert = db.prepare(
    "INSERT INTO products (name, type, price, description, image) VALUES (@name, @type, @price, @description, @image)"
  );
  const insertMany = db.transaction((rows: typeof products) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(products);
  console.log(`Seeded ${products.length} products.`);
} else {
  console.log("Products already seeded, skipping.");
}

const gradedCardSeed = [
  {
    card_name: "Charizard",
    set_name: "Base Set (1999)",
    grading_company: "PSA",
    grade: "PSA 9",
    cert_number: "PSA10293847",
    price: 189900,
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
  },
  {
    card_name: "Blastoise",
    set_name: "Base Set (1999)",
    grading_company: "PSA",
    grade: "PSA 10",
    cert_number: "PSA55811203",
    price: 249900,
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
  },
  {
    card_name: "Umbreon",
    set_name: "Neo Discovery (2001)",
    grading_company: "CGC",
    grade: "CGC 9.5",
    cert_number: "CGC30498215",
    price: 64900,
    image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/197.png",
  },
];

const sellerCount = db.prepare("SELECT COUNT(*) as c FROM sellers").get() as { c: number };

if (sellerCount.c === 0) {
  // Demo storefront seller so the marketplace has listings out of the box.
  // Credentials are intentionally simple/public - this is a seeded demo
  // account for a training fixture, not a real store.
  const passwordHash = crypto.createHash("md5").update("demo1234").digest("hex");
  const seller = db
    .prepare("INSERT INTO sellers (username, password_hash) VALUES (?, ?)")
    .run("demo_seller", passwordHash);

  const insertCard = db.prepare(
    `INSERT INTO graded_cards (seller_id, card_name, set_name, grading_company, grade, cert_number, price, image)
     VALUES (@seller_id, @card_name, @set_name, @grading_company, @grade, @cert_number, @price, @image)`
  );
  const insertCards = db.transaction((rows: typeof gradedCardSeed) => {
    for (const row of rows) insertCard.run({ ...row, seller_id: seller.lastInsertRowid });
  });
  insertCards(gradedCardSeed);
  console.log(`Seeded demo seller "demo_seller" (password: demo1234) with ${gradedCardSeed.length} graded card listings.`);
} else {
  console.log("Sellers already seeded, skipping.");
}
