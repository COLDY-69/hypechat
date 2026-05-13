import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useChannelStateContext,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { MessageSquareIcon, XIcon, SparklesIcon, WandIcon } from "lucide-react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// --- AI Summary Button (inside Channel context) ---
const AISummaryButton = () => {
  const { messages } = useChannelStateContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const recent = messages.slice(-30).map((m) => ({
        sender: m.user?.name || "User",
        content: m.text || "",
      }));

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages: recent }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      toast.error("Failed to summarize chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSummarize}
        className="btn btn-sm btn-ghost gap-1"
        title="Summarize chat"
      >
        <SparklesIcon className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline text-xs">AI Summary</span>
      </button>

      {/* Summary Modal */}
      {summary && (
        <div className="absolute top-10 right-0 z-50 bg-base-200 border border-base-300 rounded-xl shadow-xl p-4 w-72">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-primary">Chat Summary</span>
            <button onClick={() => setSummary(null)}>
              <XIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">{summary}</p>
        </div>
      )}

      {loading && (
        <div className="absolute top-10 right-0 z-50 bg-base-200 border border-base-300 rounded-xl shadow-xl p-4 w-72">
          <p className="text-sm opacity-60">Summarizing...</p>
        </div>
      )}
    </div>
  );
};

// --- AI Suggestions Bar (inside Channel context) ---
const AISuggestionsBar = () => {
  const { messages } = useChannelStateContext();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const recent = messages.slice(-10).map((m) => ({
        role: "user",
        content: m.text || "",
      }));

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationHistory: recent,
          currentInput: "",
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      toast.error("Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-1 flex flex-wrap gap-2 items-center border-t border-base-300">
      <button
        onClick={handleSuggest}
        className="btn btn-xs btn-ghost gap-1 text-primary"
        title="Get AI suggestions"
      >
        <WandIcon className="w-3 h-3" />
        <span className="text-xs">{loading ? "Thinking..." : "Suggest replies"}</span>
      </button>

      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => {
            navigator.clipboard.writeText(s);
            toast.success("Copied to clipboard!");
            setSuggestions([]);
          }}
          className="badge badge-outline badge-primary text-xs cursor-pointer hover:bg-primary hover:text-primary-content transition-colors py-3 px-2"
        >
          {s}
        </button>
      ))}
    </div>
  );
};

// --- Main ChatPage ---
const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        client.on("message.new", (event) => {
          const isOwnMessage = event.user?.id === authUser._id;
          const isActiveChannel = event.channel_id === channelId;

          if (isOwnMessage || isActiveChannel) return;

          const senderName = event.user?.name ?? "Someone";
          const messageText = event.message?.text ?? "Sent you a message";
          const senderImage = event.user?.image;

          toast(
            (t) => (
              <div className="flex items-center gap-3 min-w-[240px]">
                <div className="flex-shrink-0">
                  {senderImage ? (
                    <img
                      src={senderImage}
                      alt={senderName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-content text-sm font-bold">
                      {senderName[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{senderName}</p>
                  <p className="text-xs opacity-60 truncate mt-0.5">{messageText}</p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ),
            {
              duration: 5000,
              icon: <MessageSquareIcon className="w-4 h-4 text-primary" />,
              style: { maxWidth: "340px" },
            }
          );
        });

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <div className="flex items-center justify-between pr-3">
                <ChannelHeader />
                <AISummaryButton />
              </div>
              <MessageList />
              <AISuggestionsBar />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;