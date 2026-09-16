"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearToken } from "@/lib/auth";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: "ADMIN" | "MANAGER" | "TEAM_MEMBER";
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/login");
  }

  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      visible: true,
    },
    {
      label: "Tasks",
      href: "/tasks",
      visible: true,
    },
    {
      label: "Clients",
      href: "/clients",
      visible: user.role === "ADMIN",
    },
    {
      label: "Users",
      href: "/users",
      visible: user.role === "ADMIN",
    },
    {
      label: "Engagements",
      href: "/engagements",
      visible: user.role === "ADMIN" || user.role === "MANAGER",
    },
    {
      label: "Service Types",
      href: "/service-types",
      visible: user.role === "ADMIN",
    },
    {
      label: "Task Templates",
      href: "/task-templates",
      visible: user.role === "ADMIN",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="border-b p-6">
          <h1 className="text-lg font-semibold">Task Management</h1>
          <p className="mt-1 text-sm text-gray-500">Professional Services</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation
            .filter((item) => item.visible)
            .map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    active
                      ? "bg-gray-100 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.role.replace("_", " ")}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
