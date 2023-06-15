"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import * as timeago from "timeago.js";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationHeader,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { supabaseBrowserClient } from "utils/supabaseBrowser";
import { Auth } from "@supabase/auth-ui-react";
import {
  // Import predefined theme
  ThemeSupa,
} from "@supabase/auth-ui-shared";

import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

type ConversationEntry = {
  message: string;
  speaker: "bot" | "user";
  date: Date;
  id?: string;
};

const updateChatbotMessage = (
  conversation: ConversationEntry[],
  message: { interactionId: string; token: string; event: "response" }
): ConversationEntry[] => {
  const interactionId = message.interactionId;

  const updatedConversation = conversation.reduce(
    (acc: ConversationEntry[], e: ConversationEntry) => [
      ...acc,
      e.id === interactionId ? { ...e, message: e.message + message.token } : e,
    ],
    []
  );

  return conversation.some((e) => e.id === interactionId)
    ? updatedConversation
    : [
        ...updatedConversation,
        {
          id: interactionId,
          message: message.token,
          speaker: "bot",
          date: new Date(),
        },
      ];
};

export default function Home() {
  const [text, setText] = useState("");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [botIsTyping, setBotIsTyping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Waiting for query...");
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabaseBrowserClient.auth
      .getSession()
      .then(({ data: { session } }) => setUserId(session?.user?.id));
  }, []);

  if (!userId)
    return (
      <Auth
        supabaseClient={supabaseBrowserClient}
        appearance={{ theme: ThemeSupa }}
      />
    );

  const channel = supabaseBrowserClient.channel(userId);

  channel
    .on("broadcast", { event: "chat" }, ({ payload }) => {
      switch (payload.event) {
        case "response":
          setConversation((state) => updateChatbotMessage(state, payload));
          break;
        case "status":
          setStatusMessage(payload.message);
          break;
        case "responseEnd":
        default:
          setBotIsTyping(false);
          setStatusMessage("Waiting for query...");
      }
    })
    .subscribe();

  const submit = async () => {
    setConversation((state) => [
      ...state,
      {
        message: text,
        speaker: "user",
        date: new Date(),
      },
    ]);
    try {
      setBotIsTyping(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: text }),
      });

      await response.json();
    } catch (error) {
      console.error("Error submitting message:", error);
    }
    setText("");
  };

  return (
    <>
      <Head>
        <title>Langchain Supa GPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div
          style={{ position: "relative", height: "98vh", overflow: "hidden" }}
        >
          <MainContainer>
            <ChatContainer>
              <ConversationHeader>
                <ConversationHeader.Actions></ConversationHeader.Actions>
                <ConversationHeader.Content
                  userName="Langchain Supa GPT"
                  info={statusMessage}
                />
              </ConversationHeader>

              <MessageList
                typingIndicator={
                  botIsTyping ? (
                    <TypingIndicator content="AI is typing" />
                  ) : null
                }
              >
                {conversation.map((entry, index) => {
                  return (
                    <Message
                      key={index}
                      style={{ width: "90%" }}
                      model={{
                        type: "custom",
                        sender: entry.speaker,
                        position: "single",
                        direction:
                          entry.speaker === "bot" ? "incoming" : "outgoing",
                      }}
                    >
                      <Message.CustomContent>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, rehypeKatex]}
                        >
                          {entry.message}
                        </ReactMarkdown>
                      </Message.CustomContent>
                      <Message.Footer
                        sentTime={timeago.format(entry.date)}
                        sender={entry.speaker === "bot" ? "AI" : "You"}
                      />
                    </Message>
                  );
                })}
              </MessageList>
              <MessageInput
                placeholder="Type message here"
                onSend={submit}
                onChange={(e, text) => {
                  setText(text);
                }}
                sendButton={true}
                autoFocus
              />
            </ChatContainer>
          </MainContainer>
        </div>
      </main>
    </>
  );
}
