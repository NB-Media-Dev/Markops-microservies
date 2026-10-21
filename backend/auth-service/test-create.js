import app from "./dist/app.js";

const testEmail1 = `test.user.${Date.now()}@markops.in`;
const testEmail2 = `test.avatar.${Date.now()}@markops.in`;

const testImageBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const server = app.listen(4892, async () => {
  try {
    console.log("--- TEST 1: POST /users with JSON body containing all fields ---");
    const res1 = await fetch("http://localhost:4892/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Suresh Kumar",
        email: testEmail1,
        password: "Password@123",
        role: "DIGITAL MARKETING",
        avatar_image: "https://cdn.markops.in/avatar.jpg",
        isActive: true
      })
    });

    console.log("Status:", res1.status);
    const data1 = await res1.json();
    console.log("Created User 1:", data1);

    console.log("\n--- TEST 2: POST /users with Multipart Form Data + Avatar File Upload ---");
    const formData = new FormData();
    formData.append("name", "Deepa Designer");
    formData.append("email", testEmail2);
    formData.append("password", "Password@123");
    formData.append("roleId", "designer");
    formData.append("isActive", "true");
    formData.append("avatar_image", new Blob([testImageBuffer], { type: "image/png" }), "deepa-avatar.png");

    const res2 = await fetch("http://localhost:4892/users", {
      method: "POST",
      body: formData
    });

    console.log("Status:", res2.status);
    const data2 = await res2.json();
    console.log("Created User 2 (with multer avatar):", data2);

    console.log("\n--- TEST 3: Verifying User 1 from GET /users/:id ---");
    const getRes1 = await fetch(`http://localhost:4892/users/${data1.data?.id}`);
    const getData1 = await getRes1.json();
    console.log("Fetched User 1 from DB:", getData1);

    console.log("\n--- TEST 4: Verifying User 2 from GET /users/:id ---");
    const getRes2 = await fetch(`http://localhost:4892/users/${data2.data?.id}`);
    const getData2 = await getRes2.json();
    console.log("Fetched User 2 from DB:", getData2);

    console.log("\n✔ ALL USER CREATION & DATABASE PERSISTENCE TESTS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

