import { pgTable, serial, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courtsTable = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  currentPlayers: integer("current_players").notNull().default(0),
  playersNeeded: integer("players_needed").notNull().default(10),
  maxPlayers: integer("max_players").notNull().default(10),
  courtType: text("court_type").notNull().default("outdoor"),
  hasLights: boolean("has_lights").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCourtSchema = createInsertSchema(courtsTable).omit({ id: true, updatedAt: true });
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courtsTable.$inferSelect;
