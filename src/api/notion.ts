import { Client } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";

export type LogEntry = {
  pageName: string;
  content: string;
};

export class NotionApiClient {
  private client: Client;
  private databaseId: string;
  private n2m: NotionToMarkdown;

  constructor(notionSecret: string, databaseId: string) {
    this.client = new Client({ auth: notionSecret });
    this.databaseId = databaseId;
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
  }

  async getAllLogs() {
    try {
      const database = await this.client.databases.query({
        database_id: this.databaseId,
      });

      const entries = database.results.map(async (result) => {
        const mdblocks = await this.n2m.pageToMarkdown(result.id);
        const page = result as PageObjectResponse;
        const properties = page.properties as Record<string, any>;
        const date = properties["Date"]?.date.start as string;

        const mdString = this.n2m.toMarkdownString(mdblocks);
        return {
          data: date,
          content: mdString,
        };
      });

      return Promise.all(entries);
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw error;
    }
  }
}
