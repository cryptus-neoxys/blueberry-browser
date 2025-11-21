import {
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxJsonSchema,
} from "rxdb";

export const MEMORY_SCHEMA_LITERAL = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100, // <- the primary key must have a maxLength
    },
    content: {
      type: "string",
    },
    embedding: {
      type: "array",
      items: {
        type: "number",
      },
    },
    type: {
      type: "string",
      enum: ["chat", "page"],
    },
    metadata: {
      type: "object",
    },
    timestamp: {
      type: "number",
    },
  },
  required: ["id", "content", "type", "timestamp"],
} as const;

export type MemoryDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  ReturnType<typeof toTypedRxJsonSchema<typeof MEMORY_SCHEMA_LITERAL>>
>;

export const memorySchema: RxJsonSchema<MemoryDocType> = MEMORY_SCHEMA_LITERAL;
