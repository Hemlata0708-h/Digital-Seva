import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";

// Helper for generating deterministic fake wallet addresses
const generateMockWallet = (id) => "0x" + id.toString().padStart(40, '0');

mongoose.connect("mongodb://127.0.0.1:27017/Temple-Fund-Management")
  .then(async () => {
    console.log("Connected to DB, clearing old dummy temples...");
    // Only delete mock accounts from old seeding if any to keep it clean
    await User.deleteMany({ email: /@mock.com/ });

    console.log("Seeding 30 Famous Temples...");
    
    const templeNamesPuneMH = [
      { name: "Dagdusheth Halwai Ganpati Temple", location: "Pune" },
      { name: "Chaturshringi Temple", location: "Pune" },
      { name: "Kasba Ganpati", location: "Pune" },
      { name: "Bhimashankar Temple", location: "Near Pune" },
      { name: "Jejuri Khandoba Temple", location: "Near Pune" },
      { name: "Sarasbaug Ganpati", location: "Pune" },
      { name: "Shree Siddhivinayak Temple", location: "Mumbai" },
      { name: "Trimbakeshwar Shiva Temple", location: "Nashik" },
      { name: "Grishneshwar Temple", location: "Chhatrapati Sambhajinagar" },
      { name: "Shirdi Sai Baba Temple", location: "Shirdi" },
      { name: "Tulja Bhavani Temple", location: "Tuljapur" },
      { name: "Vithoba Temple", location: "Pandharpur" },
      { name: "Mahalaxmi Temple", location: "Kolhapur" },
      { name: "Mumbadevi Temple", location: "Mumbai" },
      { name: "Saptashrungi Devi Temple", location: "Vani, Nashik" }
    ];

    const templeNamesOtherIndia = [
      { name: "Kashi Vishwanath Temple", location: "Varanasi, UP" },
      { name: "Tirupati Balaji Temple", location: "Tirumala, AP" },
      { name: "Kedarnath Temple", location: "Uttarakhand" },
      { name: "Badrinath Temple", location: "Uttarakhand" },
      { name: "Vaishno Devi Temple", location: "Katra, J&K" },
      { name: "Golden Temple", location: "Amritsar, Punjab" },
      { name: "Meenakshi Amman Temple", location: "Madurai, TN" },
      { name: "Jagannath Temple", location: "Puri, Odisha" },
      { name: "Somnath Temple", location: "Prabhas Patan, Gujarat" },
      { name: "Dwarkadhish Temple", location: "Dwarka, Gujarat" },
      { name: "Ramanathaswamy Temple", location: "Rameswaram, TN" },
      { name: "Brihadeeswarar Temple", location: "Thanjavur, TN" },
      { name: "Lingaraj Temple", location: "Bhubaneswar, Odisha" },
      { name: "Kamakhya Temple", location: "Guwahati, Assam" },
      { name: "Padmanabhaswamy Temple", location: "Thiruvananthapuram, Kerala" }
    ];

    const top30Temples = [...templeNamesPuneMH, ...templeNamesOtherIndia];
    const temples = top30Temples.map((temple, index) => {
        let phoneStr = (1000000000 + index).toString(); // creating a dummy 10-digit phone
        return {
          name: `Admin of ${temple.name}`,
          email: `temple${index+1}@mock.com`,
          password: "password123",
          phone: phoneStr,
          role: "templeAdmin",
          status: "active",
          loginType: "email",
          walletAddress: generateMockWallet(index + 1),
          templeName: temple.name,
          templeLocation: temple.location
        }
    });

    for (let t of temples) {
      await User.findOneAndUpdate({ email: t.email }, t, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    
    console.log("Successfully seeded 30 famous temples, prioritized for Pune and Maharashtra!");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
