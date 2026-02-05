import { db } from "./db";
import { products, leads, analytics, type Product, type Lead, type InsertProduct, type InsertLead, type InsertAnalytics, type User, type InsertUser, users } from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(data: InsertLead): Promise<Lead>;
  updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;
  
  trackEvent(data: InsertAnalytics): Promise<void>;
  getAnalyticsSummary(): Promise<{
    totalVisits: number;
    totalLeads: number;
    totalProducts: number;
    conversionRate: number;
    recentLeads: Lead[];
    leadsByStatus: { status: string; count: number }[];
    leadsBySource: { source: string; count: number }[];
  }>;
}

export const storage: IStorage = {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  },

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  },

  async getProducts() {
    return db.select().from(products).orderBy(desc(products.createdAt));
  },

  async getProduct(id: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  },

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  },

  async updateProduct(id: number, data: Partial<InsertProduct>) {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  },

  async deleteProduct(id: number) {
    await db.delete(products).where(eq(products.id, id));
  },

  async getLeads() {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  },

  async getLead(id: number) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  },

  async createLead(data: InsertLead) {
    const [lead] = await db.insert(leads).values(data).returning();
    await this.trackEvent({ eventType: "lead_created", productId: data.productId || undefined });
    return lead;
  },

  async updateLead(id: number, data: Partial<InsertLead>) {
    const [lead] = await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  },

  async deleteLead(id: number) {
    await db.delete(leads).where(eq(leads.id, id));
  },

  async trackEvent(data: InsertAnalytics) {
    await db.insert(analytics).values(data);
  },

  async getAnalyticsSummary() {
    const [visitResult] = await db
      .select({ count: count() })
      .from(analytics)
      .where(eq(analytics.eventType, "page_view"));
    
    const [leadResult] = await db.select({ count: count() }).from(leads);
    const [productResult] = await db.select({ count: count() }).from(products);
    
    const totalVisits = visitResult?.count || 0;
    const totalLeads = leadResult?.count || 0;
    const totalProducts = productResult?.count || 0;
    
    const conversionRate = totalVisits > 0 ? (totalLeads / totalVisits) * 100 : 0;
    
    const recentLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5);
    
    const leadsByStatusResult = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.status);
    
    const leadsBySourceResult = await db
      .select({
        source: leads.source,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.source);
    
    return {
      totalVisits,
      totalLeads,
      totalProducts,
      conversionRate: Math.round(conversionRate * 10) / 10,
      recentLeads,
      leadsByStatus: leadsByStatusResult.map(r => ({ status: r.status, count: r.count })),
      leadsBySource: leadsBySourceResult.map(r => ({ source: r.source, count: r.count })),
    };
  },
};
