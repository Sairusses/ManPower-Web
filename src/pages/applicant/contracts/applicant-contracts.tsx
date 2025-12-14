import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input, Button, Chip, Avatar, Link, Divider } from "@heroui/react";
import { Eye } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";

export default function ApplicantContracts() {
  const supabase = getSupabaseClient();
  const [contracts, setContracts] = useState<any[]>([]);
  const [admin, setAdmin] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);

        return;
      }

      const { data: adminData } = await supabase
        .from("users")
        .select(`full_name, avatar_url, company_name`)
        .eq("role", "admin")
        .single();

      setAdmin(adminData);

      const { data: contractsData, error } = await supabase
        .from("contracts")
        .select(
          `*, 
           jobs:job_id(title)`,
        )
        .eq("applicant_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setContracts(contractsData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredContracts = contracts.filter(
    (c) =>
      c.jobs?.title?.toLowerCase().includes(search.toLowerCase()) ||
      admin?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">My Contracts</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Divider />

        <Card radius="sm" shadow="sm">
          <CardBody className="">
            {loading ? (
              <div className="p-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32" />
              </div>
            ) : filteredContracts.length > 0 ? (
              filteredContracts.map((contract, index) => (
                <div key={contract.id} className="grid grid-cols-1">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={admin?.full_name || "Admin"}
                        size="sm"
                        src={admin?.avatar_url || ""}
                      />
                      <div>
                        <p className="font-medium">{contract.jobs?.title}</p>
                        <p className="text-sm text-gray-600">
                          {admin?.full_name} •{" "}
                          {admin?.company_name || "Platform Admin"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip
                        color={
                          contract.status === "active"
                            ? "primary"
                            : contract.status === "completed"
                              ? "success"
                              : "warning"
                        }
                        size="sm"
                        radius="sm"
                        variant="flat"
                      >
                        {contract.status}
                      </Chip>
                      <Link
                        href={`/applicant/contracts/details?id=${contract.id}`}
                      >
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<Eye />}
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {index !== filteredContracts.length - 1 && <Divider />}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No contracts found
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
