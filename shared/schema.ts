import { z } from "zod";

export const jsonFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.record(z.any()),
  size: z.number(),
  lastModified: z.string(),
  cards: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    path: z.string(),
    content: z.any(),
    type: z.enum(['object', 'array', 'primitive']),
    isValid: z.boolean(),
    warnings: z.array(z.string()).optional()
  }))
});

export const insertJsonFileSchema = jsonFileSchema.omit({ id: true });

export type JsonFile = z.infer<typeof jsonFileSchema>;
export type InsertJsonFile = z.infer<typeof insertJsonFileSchema>;

export const cardExportSchema = z.object({
  cardId: z.string(),
  content: z.any()
});

export type CardExport = z.infer<typeof cardExportSchema>;
