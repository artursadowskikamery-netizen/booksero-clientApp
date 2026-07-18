import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Nie znaleziono builda: ${distPath}. Uruchom najpierw "npm run build".`);
  }
  app.use(express.static(distPath));
  // SPA fallback — wszystko poza plikami idzie na index.html.
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
