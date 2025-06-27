import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";

export type LogEntry = {
  pageName: string;
  content: string;
  date: string;
};

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
