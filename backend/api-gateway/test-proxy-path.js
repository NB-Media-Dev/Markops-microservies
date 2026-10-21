import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const target = express();
target.use((req, res) => {
  console.log("DOWNSTREAM RECEIVED req.url:", req.url);
  res.json({ receivedUrl: req.url });
});

const targetServer = target.listen(5999, () => {
  const gw = express();
  gw.use(
    "/auth",
    createProxyMiddleware({
      target: "http://localhost:5999",
      changeOrigin: true,
      pathRewrite: (path) => "/auth" + path
    })
  );

  const gwServer = gw.listen(5998, async () => {
    const res1 = await fetch("http://localhost:5998/auth/login");
    const data1 = await res1.json();
    console.log("For /auth/login ->", data1);

    const res2 = await fetch("http://localhost:5998/auth");
    const data2 = await res2.json();
    console.log("For /auth ->", data2);

    gwServer.close();
    targetServer.close();
    process.exit(0);
  });
});

