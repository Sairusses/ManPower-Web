import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Input, Chip } from "@heroui/react";
import { Send, ChevronLeft } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { getSupabaseClient } from "@/lib/supabase";

export default function MessagesPage() {
  const supabase = getSupabaseClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const selectedConversationRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const loadProfiles = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      const { data: admin } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .single();

      setAdminProfile(admin);
    };

    loadProfiles();
  }, []);

  useEffect(() => {
    if (!userProfile) return;
    const loadConversationsAndPreviews = async () => {
      let proposalsQuery = supabase
        .from("proposals")
        .select("*, applicant:applicant_id(*), job:job_id(title)")
        .order("created_at", { ascending: false });

      if (userProfile.role === "applicant") {
        proposalsQuery = proposalsQuery.eq("applicant_id", userProfile.id);
      }

      const { data: proposals } = await proposalsQuery;
      const conversationList = proposals || [];

      setConversations(conversationList);

      if (conversationList.length > 0) {
        const proposalIds = conversationList.map((c) => c.id);

        const { data: allMessages } = await supabase
          .from("messages")
          .select("*")
          .in("proposal_id", proposalIds)
          .order("created_at", { ascending: true });

        if (allMessages) {
          const grouped = allMessages.reduce((acc: any, msg: any) => {
            if (!acc[msg.proposal_id]) acc[msg.proposal_id] = [];
            acc[msg.proposal_id].push(msg);

            return acc;
          }, {});

          setMessagesByConversation(grouped);
        }
      }
    };

    loadConversationsAndPreviews();
  }, [userProfile, supabase]);

  useEffect(() => {
    if (!conversations.length) return;
    const proposalId = params.get("proposalId");

    let found = null;

    if (proposalId) {
      found = conversations.find((c) => c.id === proposalId);
    }

    if (found) {
      setSelectedConversation(found);
      if (messagesByConversation[found.id]) {
        setMessages(messagesByConversation[found.id]);
      }
    } else {
      setSelectedConversation(null);
    }
  }, [params, conversations, messagesByConversation]);

  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      const query = supabase
        .from("messages")
        .select("*")
        .eq("proposal_id", selectedConversation.id)
        .order("created_at");

      const { data } = await query;

      setMessagesByConversation((prev: any) => ({
        ...prev,
        [selectedConversation.id]: data || [],
      }));
      setMessages(data || []);
    };

    loadMessages();
  }, [selectedConversation?.id, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const convoId = msg.proposal_id;

          if (!convoId) return;

          setMessagesByConversation((prev: any) => {
            const current = prev[convoId] || [];

            if (current.some((m: any) => m.id === msg.id)) return prev;

            return { ...prev, [convoId]: [...current, msg] };
          });

          const activeConvo = selectedConversationRef.current;

          if (activeConvo && activeConvo.id === convoId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;

              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;

      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender_id: userProfile.id,
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    setMessagesByConversation((prev: any) => ({
      ...prev,
      [selectedConversation.id]: [
        ...(prev[selectedConversation.id] || []),
        optimistic,
      ],
    }));

    setNewMessage("");

    const messageData: any = {
      sender_id: userProfile.id,
      content: optimistic.content,
      proposal_id: selectedConversation.id,
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
      setMessagesByConversation((prev: any) => {
        const current = prev[selectedConversation.id] || [];
        const updated = current.map((m: any) => (m.id === tempId ? data : m));

        return { ...prev, [selectedConversation.id]: updated };
      });
    }
  };

  const selectConversation = (item: any) => {
    const basePath = window.location.pathname.startsWith("/admin")
      ? "/admin/messages"
      : "/applicant/messages";

    navigate(`${basePath}?proposalId=${item.id}`);

    if (messagesByConversation[item.id]) {
      setMessages(messagesByConversation[item.id]);
    }
    setSelectedConversation(item);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    const basePath = window.location.pathname.startsWith("/admin")
      ? "/admin/messages"
      : "/applicant/messages";

    navigate(basePath);
  };

  const isWithinFiveMinutes = (date1: string, date2: string) => {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();

    return Math.abs(d1 - d2) < 5 * 60 * 1000;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const msgsA = messagesByConversation[a.id] || [];
    const msgsB = messagesByConversation[b.id] || [];

    const lastTimeA =
      msgsA.length > 0
        ? new Date(msgsA[msgsA.length - 1].created_at).getTime()
        : new Date(a.created_at).getTime();

    const lastTimeB =
      msgsB.length > 0
        ? new Date(msgsB[msgsB.length - 1].created_at).getTime()
        : new Date(b.created_at).getTime();

    return lastTimeB - lastTimeA;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 px-4 h-[calc(100vh-20px)] lg:h-screen">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-60px)] md:h-[400px] lg:h-[550px]">
          {/* SIDEBAR */}
          <Card
            className={`lg:col-span-1 h-full flex flex-col ${
              selectedConversation ? "hidden lg:flex" : "flex"
            }`}
            radius="sm"
            shadow="sm"
          >
            <CardHeader className="shrink-0">
              <strong className="px-4 text-lg">Conversations</strong>
            </CardHeader>
            <CardBody className="p-0 flex-1 overflow-y-auto min-h-0">
              {sortedConversations.map((item) => {
                const other =
                  userProfile?.role === "admin" ? item.applicant : adminProfile;
                const convoMsgs = messagesByConversation[item.id] ?? [];

                const latestMessage =
                  convoMsgs.length > 0
                    ? convoMsgs[convoMsgs.length - 1].content
                    : "No messages yet";

                return (
                  <button
                    key={item.id}
                    className={`w-full p-4 text-left border-b border-gray-200 shrink-0 ${
                      selectedConversation?.id === item.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => selectConversation(item)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={other?.full_name || "User"}
                        src={other?.avatar_url || ""}
                      />
                      <div className="flex flex-col w-full overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {other?.full_name}
                          </p>
                          <Chip
                            className="ml-2"
                            color={
                              item.status === "accepted" ? "success" : "default"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {item.status}
                          </Chip>
                        </div>

                        <p className="text-xs text-blue-600 font-medium truncate mb-1">
                          {item.job?.title || "Unknown Job"}
                        </p>

                        <p className="text-sm text-gray-600 truncate">
                          {latestMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          {/* CHAT AREA */}
          <Card
            className={`lg:col-span-3 h-full flex flex-col ${
              selectedConversation ? "flex" : "hidden lg:flex"
            }`}
            radius="sm"
            shadow="sm"
          >
            {selectedConversation ? (
              <>
                <CardHeader className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Button
                      isIconOnly
                      className="lg:hidden -ml-2"
                      variant="light"
                      onPress={handleBack}
                    >
                      <ChevronLeft />
                    </Button>

                    <div className="flex flex-col">
                      <strong className="text-sm md:text-base">
                        {userProfile?.role === "admin"
                          ? selectedConversation.applicant?.full_name
                          : adminProfile?.full_name}
                      </strong>
                      <span className="text-xs text-gray-500">
                        {selectedConversation.job?.title}
                      </span>
                    </div>
                  </div>

                  <Chip
                    color={
                      selectedConversation.status === "accepted"
                        ? "success"
                        : "default"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {selectedConversation.status}
                  </Chip>
                </CardHeader>

                <CardBody className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div
                    ref={chatContainerRef}
                    className="flex-1 w-full overflow-y-auto p-4"
                  >
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === userProfile?.id;
                      const prevMsg = messages[index - 1];
                      const nextMsg = messages[index + 1];

                      const isSequence =
                        prevMsg &&
                        prevMsg.sender_id === msg.sender_id &&
                        isWithinFiveMinutes(msg.created_at, prevMsg.created_at);

                      const isLastInSequence =
                        !nextMsg ||
                        nextMsg.sender_id !== msg.sender_id ||
                        !isWithinFiveMinutes(
                          nextMsg.created_at,
                          msg.created_at,
                        );

                      const timeString = formatMessageTime(msg.created_at);

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col w-full ${
                            isOwn ? "items-end" : "items-start"
                          } ${isSequence ? "mt-1" : "mt-4"}`}
                        >
                          <div
                            className={`px-4 py-2 rounded-lg max-w-[85%] md:max-w-xs break-words ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {msg.content}
                          </div>
                          {isLastInSequence && (
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {timeString}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <form
                    className="p-3 md:p-4 border-t border-gray-200 flex gap-2 bg-white shrink-0"
                    onSubmit={sendMessage}
                  >
                    <Input
                      className="flex-1"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                      isIconOnly
                      color="primary"
                      isDisabled={!newMessage.trim()}
                      type="submit"
                    >
                      <Send size={18} />
                    </Button>
                  </form>
                </CardBody>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
