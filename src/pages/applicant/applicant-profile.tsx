import {
  Button,
  Input,
  Textarea,
  Avatar,
  addToast,
  Chip,
  Link,
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { supabase } from "@/lib/supabase";

const skillCategoryMap: Record<string, string> = {
  // General Labor
  "general labor": "general_labor",
  "manual labor": "general_labor",
  construction: "general_labor",
  cleaning: "general_labor",
  janitorial: "general_labor",
  "waste collection": "general_labor",
  farming: "general_labor",
  gardening: "general_labor",
  "food processing": "general_labor",
  packaging: "general_labor",

  // Skilled Trades
  welding: "skilled_trades",
  electrician: "skilled_trades",
  plumbing: "skilled_trades",
  carpentry: "skilled_trades",
  hvac: "skilled_trades",
  mechanic: "skilled_trades",
  "machine operation": "skilled_trades",
  masonry: "skilled_trades",
  framing: "skilled_trades",
  roofing: "skilled_trades",
  "tile setting": "skilled_trades",
  "building wiring": "skilled_trades",
  automotive: "skilled_trades",
  "heavy equipment operation": "skilled_trades",
  "scaffolding assembly": "skilled_trades",
  "construction painting": "skilled_trades",

  // Manufacturing & Production
  manufacturing: "manufacturing_production",
  "assembly line": "manufacturing_production",
  production: "manufacturing_production",
  operations: "manufacturing_production",
  "quality control": "manufacturing_production",
  "machine operating": "manufacturing_production",
  "cnc machine operation": "manufacturing_production",
  electronics: "manufacturing_production",
  "food manufacturing": "manufacturing_production",

  // Warehouse & Logistics
  forklift: "warehouse_logistics",
  inventory: "warehouse_logistics",
  "order picking": "warehouse_logistics",
  shipping: "warehouse_logistics",
  receiving: "warehouse_logistics",
  "material handling": "warehouse_logistics",
  logistics: "warehouse_logistics",
  "supply chain management": "warehouse_logistics",
  "warehouse management": "warehouse_logistics",

  // Drivers & Delivery
  driving: "drivers_delivery",
  delivery: "drivers_delivery",
  "cdl class a": "drivers_delivery",
  "route sales": "drivers_delivery",
  trucking: "drivers_delivery",
  "light vehicle driving": "drivers_delivery",
  motorcycle: "drivers_delivery",
  "public utility vehicle operation": "drivers_delivery",

  // Office & Administrative
  excel: "office_admin",
  word: "office_admin",
  "data entry": "office_admin",
  administration: "office_admin",
  scheduling: "office_admin",
  receptionist: "office_admin",
  "customer service": "office_admin",
  "project management": "office_admin",
  "virtual assistance": "office_admin",
  "data analysis": "office_admin",
  "time management": "office_admin",
  "organizational skills": "office_admin",
  "clerical skills": "office_admin",

  // Accounting & Finance
  bookkeeping: "accounting_finance",
  accounting: "accounting_finance",
  finance: "accounting_finance",
  payroll: "accounting_finance",
  "accounts payable": "accounting_finance",
  "accounts receivable": "accounting_finance",
  auditing: "accounting_finance",
  "financial analysis": "accounting_finance",
  taxation: "accounting_finance",
  "financial reporting": "accounting_finance",
  budgeting: "accounting_finance",

  // IT & Software Development
  javascript: "it_software",
  react: "it_software",
  python: "it_software",
  java: "it_software",
  sql: "it_software",
  "c++": "it_software",
  "c#": "it_software",
  devops: "it_software",
  "quality assurance": "it_software",
  networking: "it_software",
  "cloud computing": "it_software",
  "data science": "it_software",
  cybersecurity: "it_software",
  "machine learning": "it_software",
  "ui/ux design": "it_software",
  "mobile app development": "it_software",
  php: "it_software",

  // Engineering & Technical Roles
  cad: "engineering_technical",
  autocad: "engineering_technical",
  engineering: "engineering_technical",
  mechanical: "engineering_technical",
  electrical: "engineering_technical",
  civil: "engineering_technical",
  "process improvement": "engineering_technical",
  "industrial engineering": "engineering_technical",
  "renewable energy": "engineering_technical",
  architecture: "engineering_technical",
  robotics: "engineering_technical",
  "technical drawing interpretation": "engineering_technical",

  // Other (Catch-all for skills outside the primary defined buckets, including soft skills or niche roles)
  "communication skills": "other",
  teamwork: "other",
  "problem solving": "other",
  leadership: "other",
  "customer relations": "other", // Could also be office_admin
  "sales skills": "other",
  negotiation: "other",
  bilingual: "other",
  tagalog: "other", // Specific language skill
  bisaya: "other", // Specific language skill
  mandarin: "other", // Specific language skill
  "project management methodology": "other", // More specific than the one in office_admin
  "event planning": "other",
  "graphic design": "other",
  "social media management": "other",
  nursing: "other",
  "patient care": "other",
  teaching: "other",
  tutoring: "other",
  "food service": "other",
  bartending: "other",
  cooking: "other",
  housekeeping: "other",
};

// Define the interface for the new skill structure
interface Skill {
  name: string;
  years: number;
}

export default function ApplicantProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Skill State
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillYears, setNewSkillYears] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      setUser(authData.user);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        addToast({
          title: "Error",
          description: "Failed to fetch profile.",
          color: "danger",
        });
      }

      // Ensure skills is initialized as an array
      setProfile({
        ...data,
        skills: data.skills || [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  // ... (Avatar and Resume functions remain unchanged) ...
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];

      if (!file) return;

      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);
      const avatarUrl = publicUrlData.publicUrl;

      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));

      await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      addToast({
        title: "Success",
        description: "Avatar updated!",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Upload Error",
        description: error.message,
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setResumeUploading(true);
      const file = e.target.files?.[0];

      if (!file) return;

      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        addToast({
          title: "Invalid File",
          description: "PDF/DOC/DOCX only.",
          color: "danger",
        });

        return;
      }

      const ext = file.name.split(".").pop();
      const fileName = `${file.name}-${Date.now()}.${ext}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);
      const resumeUrl = publicUrlData.publicUrl;

      setProfile((prev: any) => ({ ...prev, resume_url: resumeUrl }));

      await supabase
        .from("users")
        .update({ resume_url: resumeUrl })
        .eq("id", user.id);

      addToast({
        title: "Success",
        description: "Resume uploaded!",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Upload Error",
        description: error.message,
        color: "danger",
      });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    try {
      await supabase
        .from("users")
        .update({ resume_url: null })
        .eq("id", user.id);
      setProfile((prev: any) => ({ ...prev, resume_url: null }));
      addToast({
        title: "Removed",
        description: "Resume removed.",
        color: "success",
      });
    } catch (error: any) {
      addToast({ title: "Error", description: error.message, color: "danger" });
    }
  };

  // --- NEW SKILL LOGIC ---

  const addSkill = () => {
    if (!newSkillName.trim()) {
      addToast({
        title: "Missing Name",
        description: "Please enter a skill name.",
        color: "warning",
      });

      return;
    }
    if (!newSkillYears) {
      addToast({
        title: "Missing Experience",
        description: "Please enter years of experience.",
        color: "warning",
      });

      return;
    }

    // Create the new skill object
    const newSkillObj: Skill = {
      name: newSkillName.trim(),
      years: parseInt(newSkillYears),
    };

    // Check for duplicates
    const exists = profile.skills.some(
      (s: any) =>
        (typeof s === "string" ? s : s.name).toLowerCase() ===
        newSkillObj.name.toLowerCase(),
    );

    if (exists) {
      addToast({
        title: "Duplicate",
        description: "You already added this skill.",
        color: "warning",
      });

      return;
    }

    const updatedSkills = [...(profile.skills || []), newSkillObj];

    setProfile((prev: any) => ({ ...prev, skills: updatedSkills }));

    // Reset inputs
    setNewSkillName("");
    setNewSkillYears("");
  };

  const removeSkill = (skillNameToRemove: string) => {
    // Handle both old string format and new object format just in case
    const updatedSkills = profile.skills.filter((s: any) => {
      const name = typeof s === "string" ? s : s.name;

      return name !== skillNameToRemove;
    });

    setProfile((prev: any) => ({ ...prev, skills: updatedSkills }));
  };

  useEffect(() => {
    if (!newSkillName.trim()) {
      setSuggestions([]);
      setShowDropdown(false);

      return;
    }

    const handler = setTimeout(() => {
      const input = newSkillName.toLowerCase();

      // Ensure skillCategoryMap exists before accessing
      if (typeof skillCategoryMap !== "undefined") {
        const matches = Object.keys(skillCategoryMap).filter((skill) =>
          skill.toLowerCase().includes(input),
        );

        setSuggestions(matches);
        setShowDropdown(matches.length > 0);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [newSkillName]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          expected_salary: profile.expected_salary, // Added Salary
          skills: profile.skills, // Now sends JSON array
        })
        .eq("id", user.id);

      if (error) throw error;

      addToast({
        title: "Profile Saved",
        description: "Your profile has been updated.",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>
        <Card className="px-4 py-2" radius="sm" shadow="sm">
          <CardHeader>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Personal Information
              </h1>
              <p className="text-gray-600">Update your profile details</p>
            </div>
          </CardHeader>
          <CardBody>
            {/* Avatar Upload */}
            <div className="flex flex-cols-2 items-center gap-6 mb-8">
              <Avatar
                isBordered
                color="primary"
                name={profile.avatar_url ? undefined : profile.full_name}
                size="lg"
                src={profile?.avatar_url || undefined}
              />
              <div>
                <label
                  className="bg-white hover:bg-gray-200 border border-gray-500 py-2 px-4 text-sm rounded-lg cursor-pointer"
                  htmlFor="file-upload"
                >
                  Change Photo
                </label>
                <input
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  id="file-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                labelPlacement="outside"
                placeholder="Enter your full name"
                radius="sm"
                value={profile?.full_name || ""}
                variant="bordered"
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
              <Input
                disabled
                label="Email"
                labelPlacement="outside"
                placeholder="Your registered email"
                radius="sm"
                value={profile?.email || ""}
                variant="bordered"
              />
              <Input
                label="Phone"
                labelPlacement="outside"
                placeholder="Enter your phone number"
                radius="sm"
                value={profile?.phone || ""}
                variant="bordered"
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <Input
                label="Location"
                labelPlacement="outside"
                placeholder="City, Country"
                radius="sm"
                value={profile?.location || ""}
                variant="bordered"
                onChange={(e) => handleChange("location", e.target.value)}
              />
              {/* NEW: Expected Salary */}
              <Input
                label="Expected Salary"
                labelPlacement="outside"
                placeholder="e.g. 50000"
                radius="sm"
                startContent={
                  <span className="text-default-400 text-small">&#8369;</span>
                }
                type="number"
                value={profile?.expected_salary || ""}
                variant="bordered"
                onChange={(e) =>
                  handleChange("expected_salary", parseFloat(e.target.value))
                }
              />
            </div>

            {/* Bio & Website */}
            <div className="flex flex-col gap-4 mt-4">
              <Textarea
                label="Bio"
                labelPlacement="outside"
                placeholder="Write a short bio about yourself"
                radius="sm"
                value={profile?.bio || ""}
                variant="bordered"
                onChange={(e) => handleChange("bio", e.target.value)}
              />
              <Input
                label="Website"
                labelPlacement="outside"
                placeholder="https://yourwebsite.com"
                radius="sm"
                type="url"
                value={profile?.website || ""}
                variant="bordered"
                onChange={(e) => handleChange("website", e.target.value)}
              />

              {/* --- SKILLS SECTION --- */}
              <div className="relative mt-2">
                <h2 className="text-sm font-medium mb-2">
                  Skills & Experience
                </h2>

                <div className="flex gap-2 mb-1 items-end">
                  <div className="flex-grow">
                    <Input
                      label="Skill Name"
                      placeholder="e.g. React"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {/* Suggestion Dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                      <div className="absolute z-20 w-64 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                        {suggestions.map((skill) => (
                          <button
                            key={skill}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setNewSkillName(skill);
                              setShowDropdown(false);
                            }}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-32">
                    <Input
                      label="Years"
                      min={0}
                      placeholder="e.g. 3"
                      type="number"
                      value={newSkillYears}
                      onChange={(e) => setNewSkillYears(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                  </div>

                  <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    onClick={addSkill}
                  >
                    <Plus size={20} />
                  </Button>
                </div>

                {/* Skill Chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile?.skills?.map((skill: any, index: number) => {
                    // Handle display for both new object format and potential old string format
                    const name = typeof skill === "string" ? skill : skill.name;
                    const years =
                      typeof skill === "string" ? null : skill.years;

                    return (
                      <Chip
                        key={index}
                        color="primary"
                        variant="flat"
                        onClose={() => removeSkill(name)}
                      >
                        {name}{" "}
                        {years !== null && (
                          <span className="text-xs opacity-75">
                            ({years} yrs)
                          </span>
                        )}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* Resume */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Resume</h2>
                {profile?.resume_url ? (
                  <div className="flex items-center gap-2">
                    <Link
                      className="text-blue-600 hover:underline"
                      href={profile.resume_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Resume
                    </Link>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onClick={handleRemoveResume}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md">
                    <label
                      className="cursor-pointer text-gray-600 block"
                      htmlFor="resume-upload"
                    >
                      Click to upload or drag and drop <br />
                      <span className="text-sm text-gray-500">
                        .pdf, .doc, .docx • Max 5MB
                      </span>
                    </label>
                    <input
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      disabled={resumeUploading}
                      id="resume-upload"
                      type="file"
                      onChange={handleResumeUpload}
                    />
                    {resumeUploading && (
                      <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="flex w-full justify-center items-center mt-8">
              <Button
                className="w-full sm:w-1/3 bg-blue-600 text-white"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
