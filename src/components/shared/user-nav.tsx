"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { getClientDisplayUser } from "@/lib/simple-auth";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserNavProps {
  compact?: boolean;
}

export function UserNav({ compact }: UserNavProps) {
  const router = useRouter();
  const { displayName, username } = getClientDisplayUser();

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            compact ? "h-9 w-9 rounded-full p-0" : "w-full justify-start gap-2 px-2"
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          {!compact && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{username}</p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
