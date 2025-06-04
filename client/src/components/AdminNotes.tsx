import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Calendar, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AssessmentNote {
  id: number;
  assessmentId: number;
  adminId: string;
  assignedUserId: string;
  content: string;
  priority: "low" | "medium" | "high";
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  admin?: {
    firstName: string;
    lastName: string;
  };
  assignedUser?: {
    firstName: string;
    lastName: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminNotesProps {
  assessmentId: number;
  assessmentStatus: string;
  assessmentData?: any;
}

export default function AdminNotes({ assessmentId, assessmentStatus, assessmentData }: AdminNotesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  // Only show admin notes for completed assessments
  if (assessmentStatus !== "completed") {
    return null;
  }

  // Fetch assessment notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "notes"],
    enabled: !!assessmentId,
  });

  // Generate relevant users from assessment data (assessor and client only)
  const relevantUsers = useMemo(() => {
    if (!assessmentData) return [];
    
    const users = [];
    
    // Add the assessor who conducted the assessment
    if (assessmentData.userId) {
      users.push({
        id: assessmentData.userId,
        firstName: assessmentData.assessorName?.split(' ')[0] || 'Assessor',
        lastName: assessmentData.assessorName?.split(' ').slice(1).join(' ') || '',
        role: 'assessor'
      });
    }
    
    // Add the client who owns the assessment
    if (assessmentData.clientId) {
      users.push({
        id: assessmentData.clientId,
        firstName: assessmentData.clientName?.split(' ')[0] || 'Client',
        lastName: assessmentData.clientName?.split(' ').slice(1).join(' ') || '',
        role: 'client'
      });
    }
    
    return users;
  }, [assessmentData]);



  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { content: string; assignedUserId: string; priority: string }) => {
      const response = await fetch(`/api/assessments/${assessmentId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create note: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "notes"] });
      setNewNote("");
      setSelectedUserId("");
      setPriority("medium");
      setIsCreating(false);
      toast({
        title: "Note Created",
        description: "Assessment note has been created and the user has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create note",
        variant: "destructive",
      });
    },
  });

  // Mark note as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/assessment-notes/${noteId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark note as read: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "notes"] });
    },
  });

  const handleCreateNote = () => {
    if (!newNote.trim() || !selectedUserId) {
      toast({
        title: "Validation Error",
        description: "Please enter note content and select a user.",
        variant: "destructive",
      });
      return;
    }

    createNoteMutation.mutate({
      content: newNote.trim(),
      assignedUserId: selectedUserId,
      priority,
    });
  };

  const handleMarkAsRead = (noteId: number) => {
    markReadMutation.mutate(noteId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Admin Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create new note form (admin only) */}
        {user?.role === "admin" && (
          <div className="border rounded-lg p-4 bg-muted/30">
            {!isCreating ? (
              <Button onClick={() => setIsCreating(true)} className="w-full" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add New Note
              </Button>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assign to User</label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {relevantUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName || 'N/A'} {user.lastName || 'N/A'} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateNote}
                    disabled={createNoteMutation.isPending}
                    className="flex-1"
                  >
                    {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setNewNote("");
                      setSelectedUserId("");
                      setPriority("medium");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes list */}
        {notesLoading ? (
          <div className="text-center py-4">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes have been added to this assessment yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note: AssessmentNote) => {
              const canMarkAsRead = user?.id === note.assignedUserId && !note.isRead;
              
              return (
                <div
                  key={note.id}
                  className={`border rounded-lg p-4 bg-card shadow-sm ${
                    !note.isRead && user?.id === note.assignedUserId
                      ? "border-primary/30 ring-1 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(note.priority || 'medium')}>
                        {(note.priority || 'medium').toUpperCase()}
                      </Badge>
                      {!note.isRead && user?.id === note.assignedUserId && (
                        <Badge variant="outline" className="text-primary border-primary">
                          Unread
                        </Badge>
                      )}
                    </div>
                    {canMarkAsRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(note.id)}
                        disabled={markReadMutation.isPending}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-foreground mb-3 whitespace-pre-wrap">
                    {note.content || note.noteContent || 'No content'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>
                          By: {note.admin?.firstName || 'N/A'} {note.admin?.lastName || 'N/A'}
                        </span>
                      </div>
                      {note.assignedUser && (
                        <div className="flex items-center gap-1">
                          <span>→</span>
                          <span>
                            For: {note.assignedUser?.firstName || 'N/A'} {note.assignedUser?.lastName || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  
                  {note.isRead && note.readAt && (
                    <div className="mt-2 text-xs text-primary">
                      Read on {formatDate(note.readAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}