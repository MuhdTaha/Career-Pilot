// frontend/components/EditJobDialog.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Job {
  id: string;
  company_name: string;
  position_title: string;
  job_url: string;
  raw_description?: string;
}

interface EditJobDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onJobUpdated: () => void;
}

export default function EditJobDialog({ job, open, onOpenChange, userId, onJobUpdated }: EditJobDialogProps) {
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    position_title: "",
    job_url: "",
    raw_description: ""
  });

  // Load job data when the dialog opens
  useEffect(() => {
    if (job) {
      setFormData({
        company_name: job.company_name || "",
        position_title: job.position_title || "",
        job_url: job.job_url || "",
        raw_description: job.raw_description || ""
      });
    }
  }, [job]);

  const handleSave = async () => {
    if (!job) return;
    setLoadingStatus("Saving changes...");

    try {
      // 1. Save the basic updated job details to the backend
      await fetch(`http://localhost:8000/api/jobs/${userId}/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // 2. Check if raw description was updated and is sufficiently long to re-trigger AI analysis
      if (formData.raw_description && formData.raw_description.length > 50 && formData.raw_description !== job.raw_description) {
        setLoadingStatus("Re-analyzing with AI...");

        await fetch(`http://localhost:8000/api/analyze/${userId}/${job.id}`, {
          method: "POST",
        });
      }

      // 3. Cleanup and notify parent
      onJobUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update", error);
      alert("Failed to save changes. Check console.");
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Job Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Company</Label>
            <Input 
              value={formData.company_name} 
              onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Position</Label>
            <Input 
              value={formData.position_title} 
              onChange={(e) => setFormData({...formData, position_title: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">URL</Label>
            <Input 
              value={formData.job_url} 
              onChange={(e) => setFormData({...formData, job_url: e.target.value})} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Label className="text-right mt-2">Description</Label>
            <Textarea 
              value={formData.raw_description} 
              onChange={(e) => setFormData({...formData, raw_description: e.target.value})} 
              className="col-span-3 h-32" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loadingStatus !== null}>Cancel</Button>
          <Button onClick={handleSave} disabled={loadingStatus !== null}>{loadingStatus ? loadingStatus : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}