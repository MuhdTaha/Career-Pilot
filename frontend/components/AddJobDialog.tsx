// frontend/components/AddJobDialog.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AddJobDialog({ userId, onJobAdded }: { userId: string, onJobAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  
  // We use a string for loading state to show different messages
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingStatus("Saving...");

    try {
      // 1. Create the Job in Firestore
      const createRes = await fetch("http://localhost:8000/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          company_name: company,
          position_title: "Pending Analysis...",
          job_url: url,
          status: "wishlist",
          raw_description: description
        }),
      });

      const newJob = await createRes.json();

      // 2. Trigger AI Analysis immediately if we have a description
      if (newJob.id && description.length > 50) {
        setLoadingStatus("Analyzing with AI..."); // Update UI so user knows what's happening
        
        await fetch(`http://localhost:8000/api/analyze/${userId}/${newJob.id}`, {
          method: "POST",
        });
      }

      // 3. Cleanup and Refresh
      onJobAdded(); // Refresh the board
      setOpen(false);
      
      // Reset Form
      setCompany("");
      setUrl("");
      setDescription("");

    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to save job. Check console.");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Company</Label>
            <Input 
                id="company" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)} 
                className="col-span-3" 
                required 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">Job URL</Label>
            <Input 
                id="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                className="col-span-3" 
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="desc" className="text-right mt-2">Job Description</Label>
            <Textarea 
              id="desc" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="col-span-3 h-40" 
              placeholder="Paste the full job description here to auto-extract skills..."
            />
          </div>

          <Button type="submit" disabled={!!loadingStatus}>
            {loadingStatus ? loadingStatus : "Save & Analyze"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}