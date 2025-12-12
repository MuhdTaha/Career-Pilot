"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditJobDialog from "./EditJobDialog";

// Define 4 columns for the Kanban board
const COLUMNS = {
    wishlist: "Wishlist",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer"
};

// Define the Job type
type Job = {
    id: string;
    company_name: string;
    position_title: string;
    job_url: string;
    status: string;
    raw_description?: string;   
};

export default function KanbanBoard({ userId}: { userId: string }) {
  // Create state for accessing, deleting, and editing jobs
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/jobs/${userId}`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, [userId]);

  // Fetch jobs on load
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await fetchJobs();
      }
    };
    load();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [fetchJobs]);

  // Handle drag end
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;
    // If dropped in the same place, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // 1. Optimistic UI Update (Update local state immediately)
    const newStatus = destination.droppableId;
    const updatedJobs = jobs.map((job) =>
      job.id === draggableId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);

    // 2. API Call to update backend
    try {
      const res = await fetch(`http://localhost:8000/api/jobs/${userId}/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error("Error updating job status:", error);
      // Optionally, revert UI update on failure
      setJobs(jobs);
    }
  };

  // Helper to handle job delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingJobId) return;

    // Optimistic UI Update
    const updatedJobs = jobs.filter((job) => job.id !== deletingJobId);
    setJobs(updatedJobs);

    // API Call to delete job
    await fetch(`http://localhost:8000/api/jobs/${userId}/${deletingJobId}`, {
      method: "DELETE",
    });
    setDeletingJobId(null);
  };

  // Helper to filter jobs by status
  const getJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
          {Object.entries(COLUMNS).map(([columnId, columnTitle]) => (
            <div key={columnId} className="flex min-w-[280px] w-full max-w-xs flex-col rounded-lg bg-slate-100 border border-slate-200">
               {/* Column Header */}
              <div className="p-4 font-semibold text-slate-700 flex justify-between">
                  {columnTitle}
                  <Badge variant="secondary">{getJobsByStatus(columnId).length}</Badge>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 space-y-3 p-3">
                    {getJobsByStatus(columnId).map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="group relative hover:shadow-md transition-shadow"
                          >
                            <CardHeader className="p-4 pb-2 pr-8"> {/* Added pr-8 for menu space */}
                              <CardTitle className="text-base font-bold truncate">{job.company_name}</CardTitle>
                              
                              {/* --- MENU TRIGGER --- */}
                              <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingJob(job)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600" onClick={() => setDeletingJobId(job.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* ------------------ */}
                            </CardHeader>
                            <CardContent className="p-4 pt-0 text-sm text-slate-500">
                              <div className="truncate">{job.position_title}</div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* --- DIALOGS --- */}
      <EditJobDialog 
        job={editingJob} 
        open={!!editingJob} 
        onOpenChange={(open) => !open && setEditingJob(null)}
        userId={userId}
        onJobUpdated={fetchJobs}
      />

      <AlertDialog open={!!deletingJobId} onOpenChange={(open) => !open && setDeletingJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}