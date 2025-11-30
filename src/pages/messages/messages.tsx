import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Input, Chip } from "@heroui/react";
import { Send } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { getSupabaseClient } from "@/lib/supabase";
import AdminNavbar from "@/components/navbar/admin-navbar.tsx";
import ApplicantNavbar from "@/components/navbar/applicant-navbar.tsx";

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

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
  }, [userProfile]);

  useEffect(() => {
    if (!conversations.length) return;

    const proposalId = params.get("proposalId");
    const contractId = params.get("contractId");

    let found = null;

    if (proposalId) {
      found = conversations.find(
        (c) => c.type === "proposal" && c.id === proposalId,
      );
    }

    if (contractId) {
      found = conversations.find(
        (c) => c.type === "contract" && c.id === contractId,
      );
    }

    if (found) {
      setSelectedConversation(found);
    }
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
  }, [selectedConversation]);

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

            return {
              ...prev,
              [convoId]: [...current, msg],
            };
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
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    if (item.type === "contract") {
      navigate(`/messages?contractId=${item.id}`);
    } else {
      navigate(`/messages?proposalId=${item.id}`);
    }

    if (messagesByConversation[item.id]) {
      setMessages(messagesByConversation[item.id]);
    }

    setSelectedConversation(item);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {userProfile?.role === "admin" ? <AdminNavbar /> : <ApplicantNavbar />}

      <div className="max-w-7xl mx-auto py-4 px-4">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px]">
          {/* SIDEBAR */}
          <Card className="lg:col-span-1" radius="sm" shadow="sm">
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

                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{other?.full_name}</p>
                          <Chip
                            color={
                              item.type === "contract" ? "success" : "primary"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {item.type}
                          </Chip>
                        </div>

                        <p className="text-sm text-gray-600 truncate max-w-[200px]">
                          {latestMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          {/* CHAT */}
          <Card className="lg:col-span-3 flex flex-col" radius="sm" shadow="sm">
            {selectedConversation ? (
              <>
                <CardHeader className="px-6 border-b border-gray-200 flex items-center justify-between">
                  <strong>
                    {userProfile?.role === "admin"
                      ? selectedConversation.applicant?.full_name
                      : adminProfile?.full_name}
                  </strong>

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

                <CardBody className="flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === userProfile?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`px-4 py-2 rounded-lg max-w-xs ${
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

                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    className="p-4 border-t border-gray-200 flex gap-2"
                    onSubmit={sendMessage}
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                      color="primary"
                      isDisabled={!newMessage.trim()}
                      type="submit"
                    >
                      <Send size={16} />
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
