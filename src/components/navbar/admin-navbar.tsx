import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  Avatar,
  DropdownMenu,
  DropdownItem,
  NavbarMenuToggle,
  NavbarMenu,
  addToast,
  NavbarMenuItem,
} from "@heroui/react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase.ts";

// Define the navigation items for easy mapping
const navItems = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Jobs", href: "/admin/jobs" },
  { name: "Proposals", href: "/admin/proposals" },
  { name: "Messages", href: "/admin/messages" },
];

export default function AdminNavbar() {
  const [user, setUser] = useState<any>(null);
  const [userDB, setUserDB] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control menu visibility

  // ... (fetchUser, fetchUsersDB, useEffect, and signOut functions remain the same)
  const fetchUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      }
      setUser(data.user);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsersDB = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        addToast({
          title: "Error fetching user details",
          description: error.message,
          color: "danger",
        });
      }
      if (data) {
        setUserDB(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUser().then(() => {
      if (user?.id) {
        fetchUsersDB(user.id);
      }
    });
  }, [user?.id]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
    window.location.href = "/";
  }

  return (
    <Navbar
      isBordered
      className="bg-white"
      isMenuOpen={isMenuOpen} // <-- 1. Add this prop
      maxWidth="xl"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="lg:hidden"
        />
        <NavbarBrand>
          <Link
            className="flex items-center gap-2 text-inherit"
            href="/admin/dashboard"
            // Add onPress to close menu if navigating from the brand link while menu is open
            onPress={() => isMenuOpen && setIsMenuOpen(false)}
          >
            <div className="p-1 rounded-lg">
              <img
                alt="F and R Logo"
                className="h-8 w-8 mr-2"
                src="/logo.png"
              />
            </div>
            <p className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900">
              F<span className="text-primary">&</span>R
              <span className="hidden sm:inline font-normal text-gray-500 text-lg ml-2">
                Job Specialists
              </span>
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop Navigation & User Menu (Content remains the same) */}
      <NavbarContent className="hidden lg:flex gap-4" justify="end">
        {navItems.map((item) => (
          <NavbarItem key={item.name}>
            <Link
              className="text-gray-600 hover:text-primary font-medium"
              href={item.href}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform ml-4"
              color="primary"
              name={userDB?.full_name || ""}
              size="sm"
              src={userDB?.avatar_url || undefined}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem
              key="profile"
              className="h-14 gap-2"
              textValue="Signed in as"
            >
              <Link className="w-full" href="/admin/profile">
                <div className="grid grid-rows-2 justify-start">
                  <p className="font-normal text-gray-800 text-sm">
                    Signed in as
                  </p>
                  <p className="font-semibold text-black text-sm">
                    {userDB?.email || user?.email}
                  </p>
                </div>
              </Link>
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={signOut}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      {/* Mobile User Avatar (Visible on Navbar - Content remains the same) */}
      <NavbarContent className="lg:hidden" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="primary"
              name={userDB?.full_name || ""}
              size="sm"
              src={userDB?.avatar_url || undefined}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem
              key="profile"
              className="h-14 gap-2"
              textValue="Signed in as"
            >
              <Link className="w-full" href="/admin/profile">
                <div className="grid grid-rows-2 justify-start">
                  <p className="font-normal text-gray-800 text-sm">
                    Signed in as
                  </p>
                  <p className="font-semibold text-black text-sm">
                    {userDB?.email || user?.email}
                  </p>
                </div>
              </Link>
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={signOut}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>

      {/* Mobile Menu Items */}
      <NavbarMenu className="pt-6 bg-white/95 backdrop-blur-md">
        {navItems.map((item, index) => (
          <NavbarMenuItem key={`${item.name}-${index}`}>
            <Link
              className="w-full text-lg font-medium text-gray-700 hover:text-primary py-2"
              href={item.href}
              size="lg"
              onPress={() => setIsMenuOpen(false)} // <-- 2. Add onPress to close menu
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
