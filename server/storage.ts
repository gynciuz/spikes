import { type JsonFile, type InsertJsonFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getJsonFile(id: string): Promise<JsonFile | undefined>;
  createJsonFile(file: InsertJsonFile): Promise<JsonFile>;
  updateJsonFile(id: string, file: Partial<JsonFile>): Promise<JsonFile | undefined>;
  deleteJsonFile(id: string): Promise<boolean>;
  getAllJsonFiles(): Promise<JsonFile[]>;
}

export class MemStorage implements IStorage {
  private jsonFiles: Map<string, JsonFile>;

  constructor() {
    this.jsonFiles = new Map();
  }

  async getJsonFile(id: string): Promise<JsonFile | undefined> {
    return this.jsonFiles.get(id);
  }

  async createJsonFile(insertFile: InsertJsonFile): Promise<JsonFile> {
    const id = randomUUID();
    const file: JsonFile = { ...insertFile, id };
    this.jsonFiles.set(id, file);
    return file;
  }

  async updateJsonFile(id: string, updates: Partial<JsonFile>): Promise<JsonFile | undefined> {
    const existing = this.jsonFiles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.jsonFiles.set(id, updated);
    return updated;
  }

  async deleteJsonFile(id: string): Promise<boolean> {
    return this.jsonFiles.delete(id);
  }

  async getAllJsonFiles(): Promise<JsonFile[]> {
    return Array.from(this.jsonFiles.values());
  }
}

export const storage = new MemStorage();
