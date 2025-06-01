import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Upload, X, FileText, Image, Video, Music, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface MediaUploadProps {
  assessmentId: number | null;
  sectionType: string;
  fieldName: string;
  className?: string;
  mediaType?: 'images' | 'videos' | 'all';
}

export function MediaUpload({ assessmentId, sectionType, fieldName, className, mediaType = 'all' }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch existing media for this field
  const { data: existingMedia = [] } = useQuery({
    queryKey: ["/api/assessments", assessmentId, "media", sectionType, fieldName],
    queryFn: async () => {
      if (!assessmentId) return [];
      const response = await fetch(`/api/assessments/${assessmentId}/media?sectionType=${sectionType}&fieldName=${fieldName}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!assessmentId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!assessmentId) throw new Error("No assessment ID");
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('sectionType', sectionType);
      formData.append('fieldName', fieldName);

      const response = await fetch(`/api/assessments/${assessmentId}/media`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "media", sectionType, fieldName] });
      setUploadedFiles([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "media", sectionType, fieldName] });
    },
  });

  const deleteMedia = (mediaId: number) => {
    deleteMutation.mutate(mediaId);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    // Check if there's already an uploaded file
    if (existingMedia.length > 0) {
      console.warn('Only one file is allowed per field');
      return;
    }
    
    const validFiles = files.filter(file => {
      const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
      
      // Filter based on media type requirement
      if (mediaType === 'images') {
        return imageTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
      } else if (mediaType === 'videos') {
        return videoTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit for videos
      } else {
        // Allow all supported types
        const allValidTypes = [...imageTypes, ...videoTypes, 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        return allValidTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
      }
    });

    // Only allow one file
    const singleFile = validFiles.slice(0, 1);
    setUploadedFiles(singleFile);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = () => {
    if (uploadedFiles.length > 0 && assessmentId) {
      uploadMutation.mutate(uploadedFiles);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Only show upload interface if no existing media */}
      {existingMedia.length === 0 && (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
            "hover:border-primary hover:bg-primary/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
        <CardContent className="p-6 text-center">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          {(() => {
            if (mediaType === 'images') {
              return (
                <>
                  <p className="text-sm text-gray-600 mb-1">Upload images only</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                </>
              );
            } else if (mediaType === 'videos') {
              return (
                <>
                  <p className="text-sm text-gray-600 mb-1">Upload videos only</p>
                  <p className="text-xs text-gray-500">MP4, WEBM, MOV, AVI up to 50MB</p>
                </>
              );
            }
            return (
              <>
                <p className="text-sm text-gray-600 mb-1">Upload images, videos, or documents</p>
                <p className="text-xs text-gray-500">PNG, JPG, MP4, WEBM, PDF up to 50MB</p>
              </>
            );
          })()}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={(() => {
              if (mediaType === 'images') {
                return ".jpg,.jpeg,.png,.gif,.webp";
              } else if (mediaType === 'videos') {
                return ".mp4,.webm,.mov,.avi";
              }
              return ".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.avi,.pdf,.doc,.docx";
            })()}
            onChange={handleChange}
            className="hidden"
          />
        </CardContent>
      </Card>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Files to upload:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button 
            onClick={uploadFiles} 
            disabled={uploadMutation.isPending || !assessmentId}
            className="w-full"
          >
            {uploadMutation.isPending ? "Uploading..." : `Upload ${uploadedFiles.length} file(s)`}
          </Button>
        </div>
      )}

      {/* Existing Uploaded Media with Thumbnails */}
      {existingMedia.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {existingMedia.map((media: any) => (
              <div key={media.id} className="relative group">
                {media.fileType?.startsWith('video/') ? (
                  <video
                    src={`/api/media/serve/${media.id}`}
                    className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setPreviewMedia({ url: `/api/media/serve/${media.id}`, type: media.fileType || 'video/mp4' })}
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={`/api/media/serve/${media.id}`}
                    alt={media.fileName}
                    className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setPreviewMedia({ url: `/api/media/serve/${media.id}`, type: media.fileType || 'image/jpeg' })}
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 hover:bg-green-700 text-white border border-green-500 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewMedia({ url: `/api/media/serve/${media.id}`, type: media.fileType || 'image/jpeg' });
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute top-1 right-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMedia(media.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-black bg-opacity-60 text-white text-xs p-1 rounded truncate">
                    {media.fileName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <DialogDescription className="sr-only">
            Full size preview of uploaded assessment media
          </DialogDescription>
          {previewMedia && (
            previewMedia.type.startsWith('video/') ? (
              <video
                src={previewMedia.url}
                controls
                className="w-full h-auto max-h-[80vh] object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={previewMedia.url}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
