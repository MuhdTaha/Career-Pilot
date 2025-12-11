"use client";

import { useState, useEffect } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/KanbanBoard";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  // Listen for Auth State
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
                <span className="text-sm font-medium">{user.displayName}</span>
                <Button variant="outline" onClick={() => auth.signOut()}>Logout</Button>
            </div>
        ) : (
            <Button onClick={handleLogin}>Sign in with Google</Button>
        )}
      </header>

      {user ? (
        <KanbanBoard userId={user.uid} />
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to your Agentic Job Hunt</h2>
            <p className="text-slate-500 mb-8 max-w-md">Login to track applications, analyze job descriptions, and tailor your resume automatically.</p>
            <Button size="lg" onClick={handleLogin}>Get Started</Button>
        </div>
      )}
    </main>
  );
}