import express from "express";
import fs from "fs";

const router = express.Router();

router.get("/public-key", (req, res) => {
  // const publicKey = fs.readFileSync("keys/public.pem", "utf8");
  const publicKey =
    process.env.PUBLIC_KEY?.replace(/\\n/g, '\n') ||
    fs.readFileSync("keys/public.pem", "utf8");
  res.status(200).json({ publicKey });
});

export default router;