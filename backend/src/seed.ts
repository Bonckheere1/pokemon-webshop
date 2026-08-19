import { db } from "./db";

function sprite(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

const singles = [
  { name: "Pikachu", type: "Electric", price: 2999, description: "The iconic Electric Mouse Pokémon. Cheerful, loyal, and always ready with a Thunderbolt.", image: sprite(25) },
  { name: "Charmander", type: "Fire", price: 2499, description: "A Fire-type starter with a flame on its tail that shows its mood.", image: sprite(4) },
  { name: "Bulbasaur", type: "Grass/Poison", price: 2499, description: "A Grass/Poison starter that carries a plant bulb on its back.", image: sprite(1) },
  { name: "Squirtle", type: "Water", price: 2499, description: "A Water-type starter known for retreating into its shell.", image: sprite(7) },
  { name: "Jigglypuff", type: "Normal/Fairy", price: 1999, description: "Sings a soothing melody that lulls listeners to sleep.", image: sprite(39) },
  { name: "Snorlax", type: "Normal", price: 4999, description: "Eats 400kg of food a day and then falls asleep.", image: sprite(143) },
  { name: "Gengar", type: "Ghost/Poison", price: 3499, description: "Hides in shadows and loves to play tricks on people.", image: sprite(94) },
  { name: "Eevee", type: "Normal", price: 2799, description: "An Evolution Pokémon with an unstable genetic makeup.", image: sprite(133) },
  { name: "Machop", type: "Fighting", price: 2199, description: "Trains constantly to build its already impressive muscles.", image: sprite(66) },
  { name: "Psyduck", type: "Water", price: 2199, description: "Constantly suffers from a headache that hides psychic powers.", image: sprite(54) },
  { name: "Mewtwo", type: "Psychic", price: 9999, description: "A Legendary Pokémon created through genetic manipulation.", image: sprite(150) },
  { name: "Dragonite", type: "Dragon/Flying", price: 7999, description: "Said to make its home somewhere in the sea and guide lost ships.", image: sprite(149) },
  { name: "Vulpix", type: "Fire", price: 2299, description: "As it grows, it grows more of its beautiful six tails.", image: sprite(37) },
  { name: "Onix", type: "Rock/Ground", price: 2999, description: "As it grows, its body comes to resemble a series of huge rocks.", image: sprite(95) },
  { name: "Lapras", type: "Water/Ice", price: 4499, description: "A gentle Pokémon that ferries people across bodies of water.", image: sprite(131) },
  { name: "Gyarados", type: "Water/Flying", price: 5499, description: "Rarely seen in a docile state; famed for its rage and power.", image: sprite(130) },
  { name: "Meowth", type: "Normal", price: 1899, description: "Loves shiny things and collects coins wherever it goes.", image: sprite(52) },
  { name: "Growlithe", type: "Fire", price: 2399, description: "A loyal Pokémon that will bark and bite to protect its trainer.", image: sprite(58) },
  { name: "Alakazam", type: "Psychic", price: 6499, description: "Its brain can outperform a supercomputer; its IQ is said to be 5,000.", image: sprite(65) },
  { name: "Machamp", type: "Fighting", price: 5999, description: "Using its four arms, it can throw a fierce flurry of punches and chops.", image: sprite(68) },
  { name: "Slowpoke", type: "Water/Psychic", price: 1799, description: "Extremely slow and dopey, it takes five seconds to feel pain when hurt.", image: sprite(79) },
  { name: "Magnemite", type: "Electric/Steel", price: 2099, description: "Uses anti-gravity to float, powered by a magnetic force.", image: sprite(81) },
  { name: "Gastly", type: "Ghost/Poison", price: 2099, description: "Almost invisible, this gaseous Pokémon cloaks the target and puts it to sleep.", image: sprite(92) },
  { name: "Krabby", type: "Water", price: 1899, description: "Its pincers grow back if they're torn off in battle.", image: sprite(98) },
  { name: "Scyther", type: "Bug/Flying", price: 4299, description: "Its razor-sharp scythes can slice through thick logs in one strike.", image: sprite(123) },
  { name: "Ditto", type: "Normal", price: 2999, description: "Can transform into an exact copy of whatever it sees.", image: sprite(132) },
];

const boxes = [
  {
    name: "Kanto Starters Box",
    price: 6499,
    description: "All three Kanto starter Pokémon in one bundle — Bulbasaur, Charmander and Squirtle.",
    image: sprite(1),
    contents: ["Bulbasaur", "Charmander", "Squirtle"],
  },
  {
    name: "Ghost Squad Box",
    price: 4999,
    description: "A spooky duo for trainers who love the dark side — Gastly and Gengar.",
    image: sprite(92),
    contents: ["Gastly", "Gengar"],
  },
  {
    name: "Legendary Vault Box",
    price: 15999,
    description: "Two of the rarest, most powerful Pokémon around — Mewtwo and Dragonite.",
    image: sprite(150),
    contents: ["Mewtwo", "Dragonite"],
  },
  {
    name: "Fan Favorites Box",
    price: 10999,
    description: "Community favorites bundled together — Eevee, Snorlax, Ditto and Meowth.",
    image: sprite(133),
    contents: ["Eevee", "Snorlax", "Ditto", "Meowth"],
  },
];

const count = db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number };

if (count.c === 0) {
  const insertSingle = db.prepare(
    "INSERT INTO products (name, type, price, description, image, category) VALUES (@name, @type, @price, @description, @image, 'single')"
  );
  const insertBox = db.prepare(
    "INSERT INTO products (name, type, price, description, image, category, contents) VALUES (@name, 'Box', @price, @description, @image, 'box', @contents)"
  );
  const insertAll = db.transaction(() => {
    for (const row of singles) insertSingle.run(row);
    for (const row of boxes) insertBox.run({ ...row, contents: JSON.stringify(row.contents) });
  });
  insertAll();
  console.log(`Seeded ${singles.length} Pokémon and ${boxes.length} boxes.`);
} else {
  console.log("Products already seeded, skipping.");
}
