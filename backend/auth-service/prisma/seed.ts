
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// const roles = [
//   "ADMIN",
//   "DIGITAL_MARKETING",
//   "DESIGNER",
//   "TELECALLER",
//   "BDM"
// ];

// async function main() {
//   for (const name of roles) {
//     await prisma.role.upsert({
//       where: { name },
//       update: {},
//       create: { name }
//     });
//   }

//   console.log("All five roles seeded successfully.");
// }

// main()
//   .catch(error => {
//     console.error(error);
//     process.exitCode = 1;
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
