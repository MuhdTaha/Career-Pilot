"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

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
};

export default function KanbanBoard({ userId}: { userId: string }) {
    // Create state for jobs 
    const [jobs, setJobs] = useState<Job[]>([]);

    // Fetch jobs on load
    useEffect(() => {
        if (!userId) return;
        fetch(`http://localhost:8000/api/jobs/${userId}`)
            .then((res) => res.json())
            .then((data) => setJobs(data))
            .catch(err => console.error("Error fetching jobs:", err));
    }, [userId]);

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
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error("Error updating job status:", error);
            // Optionally, revert UI update on failure
            setJobs(jobs);
        }
    };

    // Helper to filter jobs by status
    const getJobsByStatus = (status: string) => {
        return jobs.filter((job) => job.status === status);
    };

    return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
        {Object.entries(COLUMNS).map(([columnId, columnTitle]) => (
          <div key={columnId} className="flex min-w-[280px] w-full max-w-xs flex-col rounded-lg bg-slate-100 border border-slate-200">
            <div className="p-4 font-semibold text-slate-700 flex justify-between">
                {columnTitle}
                <Badge variant="secondary">{getJobsByStatus(columnId).length}</Badge>
            </div>
            
            <Droppable droppableId={columnId}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex-1 space-y-3 p-3"
                >
                  {getJobsByStatus(columnId).map((job, index) => (
                    <Draggable key={job.id} draggableId={job.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base font-bold">{job.company_name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 text-sm text-slate-500">
                            {job.position_title}
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
  );
}