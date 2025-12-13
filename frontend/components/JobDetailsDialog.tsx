"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, Briefcase, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface JobIntel {
  role_name: string;
  job_description_summary: string;
  required_experience: string;
  desirable_experience?: string;
  hard_skills: string[];
  soft_skills: string[];
  cultural_values: string[];
  mission_critical: string;
}

interface Job {
  id: string;
  company_name: string;
  position_title: string;
  job_url: string;
  status: string;
  created_at: string;
  raw_description?: string;
  job_intel?: JobIntel;
}

interface JobDetailsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailsDialog({ job, open, onOpenChange }: JobDetailsDialogProps) {
  if (!job) return null;

  const intel = job.job_intel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0">
        {/* Header Section */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">{job.position_title}</DialogTitle>
                <DialogDescription className="text-lg text-slate-600 font-medium mt-1">
                  {job.company_name}
                </DialogDescription>
              </div>
              {job.job_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Posting
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
              <Calendar className="h-3 w-3" />
              <span>Added on {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            
            {/* AI Summary Section */}
            {intel ? (
              <>
                {/* Mission Critical */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Mission Critical
                  </h3>
                  <p className="text-slate-700">{intel.mission_critical}</p>
                </div>

                {/* Skills Cloud */}
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    Tech Stack & Hard Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {intel.hard_skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Role Summary</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {intel.job_description_summary}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Required Experience</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {intel.required_experience}
                    </p>
                  </div>
                </div>

                {/* Cultural Values */}
                {intel.cultural_values.length > 0 && (
                   <div>
                     <h4 className="font-semibold text-slate-900 mb-2">Culture & Values</h4>
                     <div className="flex flex-wrap gap-2">
                        {intel.cultural_values.map((val, i) => (
                            <span key={i} className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                {val}
                            </span>
                        ))}
                     </div>
                   </div>
                )}
              </>
            ) : (
                // Fallback if Analysis hasn't run yet
                <div className="text-center py-10">
                    <p className="text-slate-500 italic">
                        AI Analysis not found. This job might still be processing or was added without a description.
                    </p>
                    <div className="mt-4 p-4 bg-slate-50 rounded text-left text-sm text-slate-600 whitespace-pre-wrap">
                        {job.raw_description || "No description available."}
                    </div>
                </div>
            )}
            
            <Separator />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}