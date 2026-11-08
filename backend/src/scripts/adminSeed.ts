import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Institution } from "../models/Institution";
import { connectDatabase, disconnectDatabase } from "../config/database";

async function seedAdmin() {
  console.log("==================================================");
  console.log("Provisioning Root University Administrator");
  console.log("==================================================");

  await connectDatabase();

  try {
    let institution = await Institution.findOne({ officialEmailDomain: "decentracert.edu" });

    if (!institution) {
      institution = await Institution.create({
        name: "DecentraCert University of Technology",
        officialEmailDomain: "decentracert.edu",
        address: "742 Blockchain Way, Academic Quarter",
        website: "https://decentracert.edu",
        authorizedIssuers: ["admin@decentracert.edu", "registrar@decentracert.edu"],
      });
      console.log(`✅ Created Primary Institution: ${institution.name}`);
    } else {
      console.log(`ℹ️ Existing Institution Found: ${institution.name}`);
    }

    const adminEmail = "admin@decentracert.edu";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const password = process.env.ADMIN_SEED_PASSWORD || "Admin@DecentraCert2026!";
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const admin = await User.create({
        name: "Dr. Evelyn Vance (Chief Registrar)",
        email: adminEmail,
        passwordHash,
        role: "admin",
        institutionId: institution._id,
      });

      console.log(`✅ Administrator account created successfully:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Temporary Password: ${password}`);
    } else {
      console.log(`ℹ️ Administrator account already exists: ${existingAdmin.email}`);
    }
  } catch (error) {
    console.error("❌ Admin seeding error:", error);
  } finally {
    await disconnectDatabase();
    console.log("==================================================");
  }
}

seedAdmin().catch(console.error);
