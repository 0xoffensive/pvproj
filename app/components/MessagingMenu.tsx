"use client";
// interfaces
import { Chat } from "../interfaces/chat";
import { Message } from "../interfaces/message";

// rest
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "../../lib/pusherClient"; // Import our singleton

// 1. DATA INTERFACES

export default function MessagingMenu() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);

  const [scrollPositions, setScrollPositions] = useState<
    Record<string, number>
  >({});

  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const saveCurrentScroll = (key: string) => {
    if (scrollRef.current) {
      const currentPos = scrollRef.current.scrollTop;
      setScrollPositions((prev) => ({ ...prev, [key]: currentPos }));
    }
  };

  const handleOpenChat = async (chat: Chat) => {
    saveCurrentScroll("list");
    setSelectedChat(chat);
    setView("chat");
  };

  const handleGoBack = () => {
    if (selectedChat) saveCurrentScroll(`chat-${selectedChat.chatId}`); // Save where we were in the chat
    setView("list");
    setSelectedChat(null);
  };

  const handleMenuButton = () => {
    const key = view === "list" ? "list" : `chat-${selectedChat?.chatId}`;
    saveCurrentScroll(key);
    setIsOpen(!isOpen);
  };

  const handleMenuCloseButton = () => {
    const key = view === "list" ? "list" : `chat-${selectedChat?.chatId}`;
    saveCurrentScroll(key);
    setIsOpen(false);
  };

  // Restore scroll whenever view changes or menu opens
  useLayoutEffect(() => {
    if (!isOpen || !scrollRef.current) return;

    const key = view === "list" ? "list" : `chat-${selectedChat?.chatId}`;
    const savedPos = scrollPositions[key];

    if (savedPos !== undefined) {
      scrollRef.current.scrollTop = savedPos;
    } else if (view === "chat") {
      // If first time opening this chat, default to bottom
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [view, isOpen, selectedChat]);

  useEffect(() => {
    // 1. Create an active flag to prevent race conditions
    let isCurrentRequest = true;

    const loadMessages = async () => {
      if (!selectedChat?.chatId) {
        // Clear messages immediately if navigating away or no chat selected
        setMessages([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/chats/messages?chatId=${selectedChat.chatId}`,
        );
        const data = await response.json();

        // 2. Only update state if the user hasn't switched chats mid-fetch
        if (isCurrentRequest) {
          // 3. Strictly validate that the payload is actually an array before saving it
          if (Array.isArray(data)) {
            setMessages(data);
          } else if (
            data &&
            typeof data === "object" &&
            Array.isArray((data as any).messages)
          ) {
            // Fallback wrapper check in case your API returns { messages: [...] }
            setMessages((data as any).messages);
          } else {
            console.error("API did not return an array:", data);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Klaida užkraunant žinutes:", error);
        if (isCurrentRequest) setMessages([]);
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    };

    loadMessages();

    // 4. Cleanup function triggers when chatId changes or component unmounts
    return () => {
      isCurrentRequest = false;
    };
  }, [selectedChat?.chatId]);

  // Handle Body Scroll Lock
  useEffect(() => {
    const isMobile = window.innerWidth <= 640;

    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchChats = async () => {
      if (status === "loading") return;

      try {
        setIsLoading(true);

        const endpoint =
          session?.user.role === "atstovas"
            ? `/api/chats?announcerId=${userId}`
            : `/api/chats?userId=${userId}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        setChats(data as Chat[]);
      } catch (error) {
        console.error("Klaida užkraunant pokalbius:", error);
        setChats([]); // Clear chats on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [status, userId]);

  useEffect(() => {
    // 1. Guard check: Ensure we have a valid chat selection
    const chatId = selectedChat?.chatId;
    if (!chatId || chatId === -1) return;

    const pusher = getPusherClient();
    const channelName = `chat-${chatId}`;
    const channel = pusher.subscribe(channelName);

    // Bind to the event
    channel.bind("upcoming-message", (incoming: Message) => {
      setMessages((prev) => {
        // 2. Strict ID verification
        if (prev.some((m) => m.messageId === incoming.messageId)) {
          return prev;
        }

        // 3. Find the exact optimistic message index
        // Checking for the FIRST matching text from the same sender that is still sending.
        const optimisticIndex = prev.findIndex(
          (m) =>
            m.status === "siunciama" &&
            m.text === incoming.text &&
            m.sender === "thisUser",
        );

        // 4. Update the optimistic message if found
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = {
            ...updated[optimisticIndex],
            messageId: incoming.messageId,
            status: incoming.status || "issiusta", // Fallback to safe status value
          };
          return updated;
        }

        // 5. If it's a completely fresh message (from another user), append it
        return [...prev, incoming];
      });
    });

    // 6. Complete cleanup handling
    return () => {
      channel.unbind("upcoming-message");
      pusher.unsubscribe(channelName);
    };
  }, [selectedChat?.chatId]);

  useEffect(() => {
    const handleGlobalOpenChat = (event: CustomEvent<{ data: Chat }>) => {
      const chatData = event.detail.data;

      if (chatData) {
        // 1. Open the UI first
        setIsOpen(true);
        setView("chat");

        setTimeout(() => {
          let toChat: Chat = {
            chatId: chatData.chatId,
            name: chatData.name,
            image: chatData.image || null,
            postId: chatData.postId,
          };

          setChats((prev) => {
            const exists = prev.some((c) => c.chatId === toChat.chatId);

            if (exists) {
              return prev;
            }

            return [toChat, ...prev];
          });

          setSelectedChat(toChat);
        }, 0);
      }
    };

    window.addEventListener("openChat", handleGlobalOpenChat as EventListener);
    return () =>
      window.removeEventListener(
        "openChat",
        handleGlobalOpenChat as EventListener,
      );
  }, []);

  // --- ACTIONS ---

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !selectedChat) return;

    let currentChatId = selectedChat.chatId;
    let isNewChat = currentChatId === -1;

    // 1. INSERT NEW CHAT IF DOESN'T EXIST (-1 logic)
    if (isNewChat) {
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedChat),
        });

        if (response.ok) {
          const data = await response.json();
          currentChatId = data.id; // Sync our local execution pointer
          console.log("CHAT CREATED WITH ID:", currentChatId);

          // Update the selectedChat state immediately
          const updatedChat = { ...selectedChat, chatId: data.id };
          setSelectedChat(updatedChat);

          // ALWAYS sync this back up to your parent chat list state if it exists!
          // Example: if you have a setChatList state function passed down:
          setChats((prev) =>
            prev.map((c) =>
              c.chatId === selectedChat.chatId ? updatedChat : c,
            ),
          );
        } else {
          console.error("Failed to create chat");
          return;
        }
      } catch (error) {
        console.error("Network error:", error);
        return;
      }
    }

    // 2. OPTIMISTIC UPDATE (Guaranteed to use the correct currentChatId now)
    const tempId = Date.now();
    const payload: Message = {
      messageId: tempId,
      chatId: currentChatId, // This will correctly be data.id now
      text: message,
      sender: "thisUser",
      status: "siunciama",
    };

    // Update UI immediately
    setMessages((prev) => [...prev, payload]);
    scrollToBottom();
    const textToClear = message;
    setMessage("");

    // 3. SEND TO API
    try {
      const response = await fetch("/api/chats/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tekstas: textToClear,
          busena: "issiusta",
          fk_Pokalbisid_Pokalbis: currentChatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === tempId
              ? { ...msg, messageId: data.id, status: "issiusta" }
              : msg,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === tempId ? { ...msg, status: "klaida" } : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const getLastMessage = (chatId: number) => {
    const chatMsgs = messages.filter((m) => m.chatId === chatId);
    return chatMsgs.length > 0
      ? chatMsgs[chatMsgs.length - 1].text
      : "Pradėkite pokalbį";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[60] w-full h-full rounded-none flex flex-col bg-[#111] 
                       sm:bottom-24 sm:right-0 sm:inset-auto sm:w-80 sm:h-[500px] sm:rounded-2xl sm:border sm:border-zinc-800 sm:shadow-2xl"
          >
            {/* HEADER */}
            <div className="h-16 px-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between antialiased touch-manipulation">
              <div className="flex items-center gap-3 overflow-hidden">
                {view === "chat" ? (
                  <>
                    <button
                      onClick={handleGoBack}
                      className="text-zinc-400 hover:text-white p-2 -ml-2 transition-all active:scale-90"
                    >
                      ←
                    </button>

                    {/* Profile Picture Logic */}
                    {selectedChat?.image ? (
                      <img
                        src={selectedChat.image}
                        alt={selectedChat.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center text-sm font-bold text-white border border-zinc-700 uppercase">
                        {selectedChat?.name?.charAt(0) || "💬"}
                      </div>
                    )}

                    <h3 className="text-white font-bold truncate">
                      {selectedChat?.name}
                    </h3>
                  </>
                ) : (
                  <h3 className="text-white font-bold">Pokalbiai</h3>
                )}
              </div>
              <button
                onClick={() => handleMenuCloseButton()}
                className="text-zinc-400 p-2 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
              {view === "list" ? (
                <div className="space-y-2">
                  {Array.isArray(chats) &&
                    chats.map((chat) => (
                      <button
                        key={chat.chatId}
                        onClick={() => handleOpenChat(chat)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition text-left group"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-600 flex items-center justify-center text-xl font-bold text-white border border-white/10 uppercase">
                          {chat.image ? (
                            <img
                              src={chat.image}
                              alt={chat.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span>{chat.name?.charAt(0) || "💬"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">
                            {chat.name}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {getLastMessage(chat.chatId)}
                          </div>
                        </div>
                      </button>
                    ))}
                  {chats.length === 0 && !isLoading && (
                    <p className="text-center text-zinc-500 text-xs py-4">
                      Nėra pokalbių
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto">
                  {isLoading ? (
                    /* --- This is the "Loading" HTML --- */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-zinc-500 text-sm">
                        Kraunamos žinutės...
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index, filteredArray) => {
                      const isLastMessage = index === filteredArray.length - 1;

                      return (
                        <div
                          key={msg.messageId}
                          className={`flex flex-col ${
                            msg.sender === "thisUser"
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          {/* Message Bubble */}
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                              msg.sender === "thisUser"
                                ? "bg-green-600 text-white rounded-tr-none shadow-lg shadow-green-900/20"
                                : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5"
                            }`}
                          >
                            {msg.text}
                          </div>

                          {/* Status Indicator - Only for your own messages AND only for the last one */}
                          {msg.sender === "thisUser" && isLastMessage && (
                            <span
                              style={{ fontSize: "12px" }}
                              className="mt-1 px-1 font-medium text-zinc-600"
                            >
                              {msg.status === "issiusta" && "Išsiųsta"}
                              {msg.status === "perskaityta" && "Perskaityta"}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* INPUT */}
            {view === "chat" && (
              <div className="pb-[env(safe-area-inset-bottom)] bg-zinc-900/30">
                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-zinc-800 flex gap-2"
                >
                  <input
                    //autoFocus
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Rašyti žinutę..."
                    //className="text-base sm:text-sm ..."
                    className="flex-1 h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-2 text-[16px] text-white focus:outline-none focus:border-green-500 box-border"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition"
                  >
                    ➔
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleMenuButton()}
        className={`h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border border-white/10 sm:h-14 sm:w-14 ${
          isOpen
            ? "bg-zinc-800 text-white"
            : "bg-gradient-to-tr from-green-700 to-green-400 text-white shadow-green-900/40"
        }`}
      >
        {isOpen ? (
          <span className="text-xl font-light">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
      </motion.button>
    </div>
  );
}
