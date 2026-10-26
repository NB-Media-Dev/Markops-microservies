import app from "./dist/app.js";

const server = app.listen(4889, async () => {
  try {
    console.log("--- TEST 1: Updating user 3 with new name, role, avatar_image, isActive ---");
    const res1 = await fetch("http://localhost:4889/users/3", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Karthik Raja Updated",
        role: "ADMINISTRATOR",
        avatar_image: "https://example.com/avatar.jpg",
        isActive: true
      })
    });
    console.log("PUT status:", res1.status);
    const data1 = await res1.json();
    console.log("Updated data:", data1);

    console.log("--- TEST 2: Fetching user 3 to verify database persistence ---");
    const res2 = await fetch("http://localhost:4889/users/3");
    const data2 = await res2.json();
    console.log("Fetched user:", data2);

    console.log("--- TEST 3: Updating role using roleId 'bdm' ---");
    const res3 = await fetch("http://localhost:4889/users/3", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleId: "bdm"
      })
    });
    const data3 = await res3.json();
    console.log("Role update with roleId result:", data3.data?.roleId);

    console.log("ALL TESTS COMPLETED!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

