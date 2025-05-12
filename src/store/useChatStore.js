import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  aiMessages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isAITyping: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (userId === 'ai') {
      set({ messages: get().aiMessages });
      return;
    }
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, aiMessages } = get();
    if (selectedUser._id === 'ai') {
      const userMsg = {
        _id: Date.now().toString(),
        senderId: 'me',
        receiverId: 'ai',
        text: messageData.text,
        image: messageData.image,
        createdAt: new Date().toISOString(),
      };
      set({ aiMessages: [...aiMessages, userMsg], messages: [...aiMessages, userMsg], isAITyping: true });

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "featherless/qwerky-72b:free",
            messages: [
              { role: "user", content: messageData.text }
            ]
          })
        });
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "[No response]";
        const aiMsg = {
          _id: (Date.now() + 1).toString(),
          senderId: 'ai',
          receiverId: 'me',
          text: aiText,
          createdAt: new Date().toISOString(),
        };
        set((prev) => ({
          aiMessages: [...prev.aiMessages, aiMsg],
          messages: [...prev.aiMessages, aiMsg],
          isAITyping: false
        }));
      } catch (err) {
        const errorMsg = {
          _id: (Date.now() + 2).toString(),
          senderId: 'ai',
          receiverId: 'me',
          text: '[AI error: Could not fetch response]',
          createdAt: new Date().toISOString(),
        };
        set((prev) => ({
          aiMessages: [...prev.aiMessages, errorMsg],
          messages: [...prev.aiMessages, errorMsg],
          isAITyping: false
        }));
      }
      return;
    }
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
