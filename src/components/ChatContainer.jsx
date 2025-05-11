import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Determine if this is a user or AI message
          const isUser = message.senderId === 'me' || message.senderId === authUser?._id;
          const isAI = message.senderId === 'ai';
          // Avatar logic
          let avatar = "/avatar.png";
          let isBot = false;
          if (isUser) avatar = authUser?.profilePic || "/avatar.png";
          if (isAI) { avatar = null; isBot = true; }
          // Side logic
          const chatSide = isUser ? "chat-end" : "chat-start";
          // Alignment fix for AI
          const chatAlign = isBot ? "items-end" : "";
          return (
            <div
              key={message._id}
              className={`chat ${chatSide} ${chatAlign}`}
              ref={messageEndRef}
            >
              <div className={` chat-image avatar${isBot ? ' self-end -mb-1 ml-0.5' : ''}`}>
                <div className="size-10 rounded-full flex items-center justify-center bg-orange-100 border border-orange-400">
                  {isBot ? (
                    <Bot className="size-7 text-orange-500" />
                  ) : (
                    <img src={avatar} alt="profile pic" />
                  )}
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          );
        })}
        {/* AI Typing indicator */}
        {selectedUser?._id === 'ai' && useChatStore.getState().isAITyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full flex items-center justify-center bg-orange-100 border border-orange-400">
                <Bot className="size-7 text-orange-500" />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">...</time>
            </div>
            <div className="chat-bubble flex flex-col">
              <span className="italic text-zinc-400">AI Assistant is typing...</span>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
