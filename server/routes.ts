import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJsonFileSchema, cardExportSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all JSON files
  app.get("/api/json-files", async (req, res) => {
    try {
      const files = await storage.getAllJsonFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve JSON files" });
    }
  });

  // Get specific JSON file
  app.get("/api/json-files/:id", async (req, res) => {
    try {
      const file = await storage.getJsonFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "JSON file not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve JSON file" });
    }
  });

  // Create new JSON file
  app.post("/api/json-files", async (req, res) => {
    try {
      const validatedData = insertJsonFileSchema.parse(req.body);
      const file = await storage.createJsonFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid JSON file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create JSON file" });
    }
  });

  // Update JSON file
  app.patch("/api/json-files/:id", async (req, res) => {
    try {
      const file = await storage.updateJsonFile(req.params.id, req.body);
      if (!file) {
        return res.status(404).json({ message: "JSON file not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update JSON file" });
    }
  });

  // Export card content
  app.post("/api/json-files/:id/export-card", async (req, res) => {
    try {
      const { cardId } = cardExportSchema.parse(req.body);
      const file = await storage.getJsonFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ message: "JSON file not found" });
      }

      const card = file.cards.find(c => c.id === cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json({ content: card.content });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid export request", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to export card" });
    }
  });

  // Delete JSON file
  app.delete("/api/json-files/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteJsonFile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "JSON file not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete JSON file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
