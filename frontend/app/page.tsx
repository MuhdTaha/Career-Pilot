"use client";

import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/KanbanBoard";
import AddJobDialog from "@/components/AddJobDialog";
import Link from "next/link"; 
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  // Listen for Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
        if (u) setUser(u);
        else setUser(null);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  return (
    <main className="flex min-h-screen flex-col p-8 bg-slate-50">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">CareerPilot ✈️</h1>
        
        {user ? (
            <div className="flex items-center gap-4">
                {/* Add Job Button */}
                <AddJobDialog userId={user.uid} onJobAdded={() => window.location.reload()} />
                
                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-slate-100 text-slate-600">
                          {user.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile & Resume</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                        onClick={() => auth.signOut()} 
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        ) : (
            <Button onClick={handleLogin}>Sign in with Google</Button>
        )}
      </header>

      {/* Main Content Area */}
      {user ? (
        <KanbanBoard userId={user.uid} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to your Agentic Job Hunt</h2>
            <p className="text-slate-500 mb-8 max-w-md">
                Login to track applications, analyze job descriptions, and tailor your resume automatically.
            </p>
            <Button size="lg" onClick={handleLogin}>Get Started</Button>
        </div>
      )}
    </main>
  );
}