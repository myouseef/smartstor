import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Products API
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Leads API
  app.get("/api/leads", async (req: Request, res: Response) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const lead = await storage.createLead(req.body);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.updateLead(id, req.body);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Analytics API
  app.get("/api/analytics", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.post("/api/analytics/track", async (req: Request, res: Response) => {
    try {
      await storage.trackEvent(req.body);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // AI Tools API
  app.post("/api/ai/generate-description", async (req: Request, res: Response) => {
    try {
      const { productName, category, language = "en" } = req.body;
      
      const prompt = language === "ar" 
        ? `اكتب وصفاً تسويقياً جذاباً ومقنعاً للمنتج التالي باللغة العربية: ${productName}${category ? ` في فئة ${category}` : ""}. الوصف يجب أن يكون 2-3 جمل قصيرة ومؤثرة.`
        : `Write a compelling marketing description for the following product: ${productName}${category ? ` in the ${category} category` : ""}. Keep it 2-3 sentences, engaging and persuasive.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_completion_tokens: 256,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating description:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate description" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/ai/generate-ad-copy", async (req: Request, res: Response) => {
    try {
      const { productName, price, offer, language = "en" } = req.body;
      
      const prompt = language === "ar"
        ? `اكتب نص إعلاني قصير وجذاب للمنتج التالي باللغة العربية:
           المنتج: ${productName}
           السعر: ${price}
           ${offer ? `العرض: ${offer}` : ""}
           النص يجب أن يكون مناسباً للإعلان على وسائل التواصل الاجتماعي (2-3 جمل).`
        : `Write a short, catchy ad copy for the following product:
           Product: ${productName}
           Price: ${price}
           ${offer ? `Offer: ${offer}` : ""}
           Make it suitable for social media advertising (2-3 sentences).`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_completion_tokens: 256,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating ad copy:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate ad copy" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/ai/suggest-price", async (req: Request, res: Response) => {
    try {
      const { productName, description, category, language = "en" } = req.body;
      
      const prompt = language === "ar"
        ? `اقترح نطاق سعري مناسب للمنتج التالي مع شرح موجز:
           المنتج: ${productName}
           ${description ? `الوصف: ${description}` : ""}
           ${category ? `الفئة: ${category}` : ""}
           أعطني السعر المقترح بالدولار مع شرح مختصر (2-3 جمل).`
        : `Suggest a suitable price range for the following product with a brief explanation:
           Product: ${productName}
           ${description ? `Description: ${description}` : ""}
           ${category ? `Category: ${category}` : ""}
           Give me the suggested price in USD with a brief explanation (2-3 sentences).`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_completion_tokens: 256,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error suggesting price:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to suggest price" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate" })}\n\n`);
        res.end();
      }
    }
  });

  app.post("/api/ai/campaign-ideas", async (req: Request, res: Response) => {
    try {
      const { productName, targetAudience, language = "en" } = req.body;
      
      const prompt = language === "ar"
        ? `اقترح 3 أفكار لحملات تسويقية للمنتج التالي باللغة العربية:
           المنتج: ${productName}
           ${targetAudience ? `الجمهور المستهدف: ${targetAudience}` : ""}
           كل فكرة يجب أن تتضمن: عنوان الحملة، الفكرة الرئيسية، والقناة المقترحة (فيسبوك، إنستغرام، واتساب، إلخ).`
        : `Suggest 3 marketing campaign ideas for the following product:
           Product: ${productName}
           ${targetAudience ? `Target Audience: ${targetAudience}` : ""}
           Each idea should include: campaign title, main concept, and suggested channel (Facebook, Instagram, WhatsApp, etc.).`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_completion_tokens: 512,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Error generating campaign ideas:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate campaign ideas" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate" })}\n\n`);
        res.end();
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
