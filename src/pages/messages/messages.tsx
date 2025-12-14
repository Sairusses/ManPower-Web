import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Input, Chip } from "@heroui/react";
import { Send, ChevronLeft } from "lucide-react"; // Added ChevronLeft
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
    const loadConversations = async () => {
      let proposalsQuery = supabase
        .from("proposals")
        .select("*, applicant:applicant_id(*)");
      let contractsQuery = supabase
        .from("contracts")
        .select("*, applicant:applicant_id(*)");

      if (userProfile.role === "applicant") {
        proposalsQuery = proposalsQuery.eq("applicant_id", userProfile.id);
        contractsQuery = contractsQuery.eq("applicant_id", userProfile.id);
      }

      const { data: proposals } = await proposalsQuery;
      const { data: contracts } = await contractsQuery;

      const combined = [
        ...(proposals?.map((p) => ({ ...p, type: "proposal" })) || []),
        ...(contracts?.map((c) => ({ ...c, type: "contract" })) || []),
      ];

      setConversations(combined);
    };

    loadConversations();
  }, [userProfile, supabase]);

  useEffect(() => {
    if (!conversations.length) return;
    const proposalId = params.get("proposalId");
    const contractId = params.get("contractId");

    let found = null;

    if (proposalId)
      found = conversations.find(
        (c) => c.type === "proposal" && c.id === proposalId,
      );
    if (contractId)
      found = conversations.find(
        (c) => c.type === "contract" && c.id === contractId,
      );

    if (found) setSelectedConversation(found);
    // If no ID in params, ensure we don't have a selection (important for mobile back nav)
    else setSelectedConversation(null);
  }, [params, conversations]);

  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      let query = supabase.from("messages").select("*").order("created_at");

      if (selectedConversation.type === "contract") {
        query = query.eq("contract_id", selectedConversation.id);
      } else {
        query = query.eq("proposal_id", selectedConversation.id);
      }

      const { data } = await query;

      setMessagesByConversation((prev: any) => ({
        ...prev,
        [selectedConversation.id]: data || [],
      }));
      setMessages(data || []);
    };

    loadMessages();
  }, [selectedConversation, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const convoId = msg.contract_id || msg.proposal_id;

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
    setNewMessage("");

    const messageData: any = {
      sender_id: userProfile.id,
      content: optimistic.content,
    };

    if (selectedConversation.type === "contract") {
      messageData.contract_id = selectedConversation.id;
    } else {
      messageData.proposal_id = selectedConversation.id;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    }
  };

  const selectConversation = (item: any) => {
    const basePath = window.location.pathname.startsWith("/admin")
      ? "/admin/messages"
      : "/applicant/messages";

    if (item.type === "contract") {
      navigate(`${basePath}?contractId=${item.id}`);
    } else {
      navigate(`${basePath}?proposalId=${item.id}`);
    }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 px-4 h-[calc(100vh-20px)] lg:h-auto">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-60px)] md:h-[400px] lg:h-[550px]">
          {/* SIDEBAR */}
          <Card
            className={`lg:col-span-1 h-full ${
              selectedConversation ? "hidden lg:block" : "block"
            }`}
            radius="sm"
            shadow="sm"
          >
            <CardHeader>
              <strong className="px-4 text-lg">Conversations</strong>
            </CardHeader>
            <CardBody className="p-0 overflow-y-auto">
              {conversations.map((item) => {
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
                    className={`w-full p-4 text-left border-b border-gray-200 ${
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
                              item.type === "contract" ? "success" : "primary"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {item.type}
                          </Chip>
                        </div>
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
                    </div>
                  </div>

                  <Chip
                    color={
                      selectedConversation.type === "contract"
                        ? "success"
                        : "primary"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {selectedConversation.type}
                  </Chip>
                </CardHeader>

                <CardBody className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div
                    ref={chatContainerRef}
                    className="flex-1 w-full overflow-y-auto p-4 space-y-3"
                  >
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === userProfile?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
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
