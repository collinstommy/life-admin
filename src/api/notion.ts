import { Recipe } from '@/db/schema';
import { KVNamespace } from "@cloudflare/workers-types";
import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";


type CachedPage = {
  date: string;
  content: string;
};

export class NotionApiClient {
  private client: Client;
  private databaseId: string;
  private n2m: NotionToMarkdown;
  private kv: KVNamespace;
  private CACHE_DURATION = 7 * 24 * 60 * 60; // 1 week in seconds

  constructor(notionSecret: string, databaseId: string, kv: KVNamespace) {
    this.client = new Client({ auth: notionSecret });
    this.databaseId = databaseId;
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
    this.kv = kv;
  }

  private async getPageFromCache(pageId: string): Promise<CachedPage | null> {
    const cached = await this.kv.get<CachedPage>(pageId, "json");
    return cached;
  }

  private async cachePageContent(
    pageId: string,
    date: string,
    content: string,
  ) {
    const cacheEntry: CachedPage = {
      date,
      content,
    };
    await this.kv.put(pageId, JSON.stringify(cacheEntry), {
      expirationTtl: this.CACHE_DURATION,
    });
  }

  async getAllLogs() {
    try {
      const database = await this.client.databases.query({
        database_id: this.databaseId,
      });

      const entries = database.results.map(async (result) => {
        // Try to get from cache first
        const cached = await this.getPageFromCache(result.id);
        if (cached) {
          return {
            date: cached.date,
            content: cached.content,
          };
        }

        // If not in cache, fetch from Notion
        const mdblocks = await this.n2m.pageToMarkdown(result.id);
        const page = result as PageObjectResponse;
        const properties = page.properties as Record<
          string,
          {
            date?: { start: string };
            [key: string]: unknown;
          }
        >;
        const date = properties["Date"]?.date?.start ?? "";

        const mdString = this.n2m.toMarkdownString(mdblocks);

        // Cache the result
        await this.cachePageContent(result.id, date, mdString);

        return {
          date,
          content: mdString,
        };
      });
      return Promise.all(entries);
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw error;
    }
  }

  async getPage(pageId: string) {
    try {
      // Try to get from cache first
      const cached = await this.getPageFromCache(pageId);
      if (cached) {
        return {
          date: cached.date,
          content: cached.content,
        };
      }

      // If not in cache, fetch from Notion
      const mdblocks = await this.n2m.pageToMarkdown(pageId);
      const page = (await this.client.pages.retrieve({
        page_id: pageId,
      })) as PageObjectResponse;
      const properties = page.properties as Record<
        string,
        {
          date?: { start: string };
          [key: string]: unknown;
        }
      >;
      const date = properties["Date"]?.date?.start ?? "";

      const mdString = this.n2m.toMarkdownString(mdblocks);

      // Cache the result
      await this.cachePageContent(pageId, date, mdString);

      return {
        date,
        content: mdString,
      };
    } catch (error) {
      console.error("Error fetching page:", error);
      throw error;
    }
  }
}

export class RecipeNotionClient {
  private client: Client;
  private databaseId: string;
  private n2m: NotionToMarkdown;

  constructor(notionSecret: string, databaseId: string) {
    this.client = new Client({ auth: notionSecret });
    this.databaseId = databaseId;
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
  }

  async getAllRecipes(): Promise<[]> {
    try {
      const database = await this.client.databases.query({
        database_id: this.databaseId,
        filter: {
          property: "Save to admin",
          checkbox: {
            equals: true,
          },
        },
      });

      const entries = database.results.map(async (result) => {
        const databaseItem = result as PageObjectResponse;

        // Get the actual page to extract title from page content
        const page = (await this.client.pages.retrieve({
          page_id: databaseItem.id,
        })) as PageObjectResponse;


        // Convert Notion blocks to markdown
        const mdblocks = await this.n2m.pageToMarkdown(result.id);
        const content = this.n2m.toMarkdownString(mdblocks).parent;

        return {
          id: result.id,
          content,
          notionId: result.id,
          lastEditedTime: page.last_edited_time,
        };
      });

      return Promise.all(entries);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      throw error;
    }
  }

  async getRecipe(pageId: string): Promise<Recipe> {
    try {
      const page = (await this.client.pages.retrieve({
        page_id: pageId,
      })) as PageObjectResponse;

      console.log(page)
      const properties = page.properties as Record<string, any>;


      // Convert to markdown
      const mdblocks = await this.n2m.pageToMarkdown(pageId);
      const content = this.n2m.toMarkdownString(mdblocks).parent;

      return {
        id: pageId,
        title: properties["Title"],
        markdown: content,
        notionId: pageId,
        extractedIngredients: null,
        isActive: 1,
        tags: null,
        servings: null,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      console.error("Error fetching recipe:", error);
      throw error;
    }
  }
}
