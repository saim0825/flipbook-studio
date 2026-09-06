import {integer,sqliteTable,text} from "drizzle-orm/sqlite-core";

export const clients=sqliteTable("clients",{
  id:integer("id").primaryKey({autoIncrement:true}),
  name:text("name").notNull(),
  email:text("email").notNull().unique(),
  passwordHash:text("password_hash").notNull(),
  status:text("status").notNull().default("active"),
  createdAt:text("created_at").notNull().default(""),
});
