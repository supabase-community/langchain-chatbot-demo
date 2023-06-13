import { supabaseClient } from "utils/supabase";

class ConversationLog {
  constructor(public userId: string) {
    this.userId = userId;
  }

  public async addEntry({
    entry,
    speaker,
  }: {
    entry: string;
    speaker: "user" | "ai";
  }) {
    try {
      await supabaseClient
        .from("conversations")
        .insert({ user_id: this.userId, entry, speaker })
        .throwOnError();
    } catch (e) {
      console.log(`Error adding entry: ${e}`);
    }
  }

  public async getConversation({
    limit,
  }: {
    limit: number;
  }): Promise<string[]> {
    const { data: history } = await supabaseClient
      .from("conversations")
      .select("entry, speaker, created_at")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .throwOnError();

    const response = history
      ? history
          .map((entry) => {
            return `${entry.speaker.toUpperCase()}: ${entry.entry}`;
          })
          .reverse()
      : [];
    console.log(response);
    return response;
  }

  public async clearConversation() {
    await supabaseClient
      .from("conversations")
      .delete()
      .eq("user_id", this.userId)
      .throwOnError();
  }
}

export { ConversationLog };
