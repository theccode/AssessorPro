import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, Image, Video, Music, Eye, Camera, VideoIcon, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface MediaUploadProps {
  assessmentId: number | null;
  sectionType: string;
  fieldName: string;
  className?: string;
  mediaType?: 'images' | 'videos' | 'audio' | 'all';
  disabled?: boolean;
}

export function MediaUpload({ assessmentId, sectionType, fieldName, className, mediaType = 'all', disabled = false }: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showAudioDialog, setShowAudioDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
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

      // Simulate smooth progress for better user experience
      setUploadProgress(0);
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 90) {
            const increment = Math.random() * 10 + 5; // Increment by 5-15%
            return Math.min(prev + increment, 90); // Cap at 90% during simulation
          }
          return prev;
        });
      }, 200);
      
      try {
        const response = await fetch(`/api/assessments/${assessmentId}/media`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        setUploadProgress(100);
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments", assessmentId, "media", sectionType, fieldName] });
      setUploadedFiles([]);
      setTimeout(() => setUploadProgress(0), 1500); // Reset progress after 1.5 seconds
    },
    onError: () => {
      setUploadProgress(0); // Reset progress on error
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

  // Camera and recording functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCameraDialog(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFiles([file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const startVideoRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowVideoDialog(true);
    } catch (error) {
      console.error('Error accessing camera for video:', error);
      alert('Unable to access camera and microphone. Please check permissions or use file upload instead.');
    }
  };

  const startRecording = () => {
    if (stream) {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        handleFiles([file]);
        stopCamera();
      };
      
      setRecordedChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      setStream(mediaStream);
      setShowAudioDialog(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions or use file upload instead.');
    }
  };

  const startAudioCapture = () => {
    if (stream) {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        handleFiles([file]);
        stopCamera();
      };
      
      setRecordedChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    }
  };

  const stopAudioCapture = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCameraDialog(false);
    setShowVideoDialog(false);
    setShowAudioDialog(false);
    setIsRecording(false);
    setMediaRecorder(null);
    setRecordedChunks([]);
  };

  const handleFiles = (files: File[]) => {
    // Check if there's already an uploaded file
    if (existingMedia.length > 0) {
      console.warn('Only one file is allowed per field');
      return;
    }
    
    const validFiles = files.filter(file => {
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
      const audioTypes = [
        'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/m4a', 'audio/aac', 'audio/x-aac', 'audio/mp4',
        'audio/ogg', 'audio/vorbis', 'audio/x-vorbis'
      ];
      
      // Debug logging to see what MIME type the file actually has
      console.log(`File: ${file.name}, MIME type: ${file.type}, Size: ${file.size}`);
      
      // Also check file extension as a fallback
      const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase();
      const extension = getFileExtension(file.name);
      
      // Filter based on media type requirement
      if (mediaType === 'images') {
        const isValidImage = imageTypes.includes(file.type) || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
        return isValidImage && file.size <= 10 * 1024 * 1024; // 10MB limit
      } else if (mediaType === 'videos') {
        const isValidVideo = videoTypes.includes(file.type) || ['mp4', 'webm', 'mov', 'avi'].includes(extension || '');
        return isValidVideo && file.size <= 50 * 1024 * 1024; // 50MB limit for videos
      } else if (mediaType === 'audio') {
        const isValidAudio = audioTypes.includes(file.type) || ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension || '');
        return isValidAudio && file.size <= 20 * 1024 * 1024; // 20MB limit for audio
      } else {
        // Allow all supported types
        const allValidTypes = [...imageTypes, ...videoTypes, ...audioTypes, 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allValidExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'm4a', 'aac', 'ogg', 'pdf', 'doc', 'docx'];
        const isValid = allValidTypes.includes(file.type) || allValidExtensions.includes(extension || '');
        return isValid && file.size <= 50 * 1024 * 1024; // 50MB limit
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
      {/* Only show upload interface if no existing media and not disabled */}
      {existingMedia.length === 0 && !disabled && (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
            mediaType === 'all' && "cursor-pointer hover:border-primary hover:bg-primary/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={mediaType === 'all' ? () => fileInputRef.current?.click() : undefined}
        >
        <CardContent className="p-6 text-center">
          {/* Upload Options Based on Media Type */}
          {mediaType === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Image className="h-6 w-6 text-gray-400" />
                <span className="text-lg font-medium text-gray-600">Add Photo</span>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-sm">Take Photo</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Upload Photo</span>
                </Button>
              </div>
            </div>
          )}

          {mediaType === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Video className="h-6 w-6 text-gray-400" />
                <span className="text-lg font-medium text-gray-600">Add Video</span>
              </div>
              <p className="text-xs text-gray-500">MP4, WEBM, MOV, AVI up to 50MB</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    startVideoRecording();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <VideoIcon className="h-6 w-6" />
                  <span className="text-sm">Record Video</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Upload Video</span>
                </Button>
              </div>
            </div>
          )}

          {mediaType === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Music className="h-6 w-6 text-gray-400" />
                <span className="text-lg font-medium text-gray-600">Add Audio</span>
              </div>
              <p className="text-xs text-gray-500">MP3, WAV, M4A, AAC, OGG up to 20MB</p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    startAudioRecording();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Mic className="h-6 w-6" />
                  <span className="text-sm">Record Audio</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">Upload Audio</span>
                </Button>
              </div>
            </div>
          )}

          {mediaType === 'all' && (
            <div className="space-y-4">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Upload media files</p>
                <p className="text-xs text-gray-500">Images, videos, audio, or documents up to 50MB</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  className="flex items-center gap-1"
                >
                  <Camera className="h-4 w-4" />
                  Photo
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startVideoRecording();
                  }}
                  className="flex items-center gap-1"
                >
                  <VideoIcon className="h-4 w-4" />
                  Video
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    startAudioRecording();
                  }}
                  className="flex items-center gap-1"
                >
                  <Mic className="h-4 w-4" />
                  Audio
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={(() => {
              if (mediaType === 'images') {
                return ".jpg,.jpeg,.png,.gif,.webp";
              } else if (mediaType === 'videos') {
                return ".mp4,.webm,.mov,.avi";
              } else if (mediaType === 'audio') {
                return ".mp3,.wav,.m4a,.aac,.ogg,.webm";
              }
              return ".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.avi,.mp3,.wav,.m4a,.aac,.ogg,.pdf,.doc,.docx";
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
            <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate text-green-800">{file.name}</span>
                <span className="text-xs text-green-600">
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
          {uploadMutation.isPending && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Uploading...</span>
                <span className="text-green-600">{uploadProgress.toFixed(2)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          <Button 
            onClick={uploadFiles} 
            disabled={uploadMutation.isPending || !assessmentId}
            className="w-full bg-green-600 hover:bg-green-700 text-white border-green-500"
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
                {(media.fileType?.startsWith('video/') || media.fileType === 'video' || media.mimeType?.startsWith('video/')) ? (
                  <video
                    src={`/api/media/serve/${media.id}`}
                    className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setPreviewMedia({ url: `/api/media/serve/${media.id}`, type: media.fileType || 'video/mp4' })}
                    muted
                    preload="metadata"
                  />
                ) : (media.fileType?.startsWith('audio/') || media.fileType === 'audio' || media.mimeType?.startsWith('audio/')) ? (
                  <div 
                    className="w-full h-24 bg-green-50 border rounded-lg cursor-pointer hover:bg-green-100 transition-colors flex flex-col items-center justify-center"
                    onClick={() => setPreviewMedia({ url: `/api/media/serve/${media.id}`, type: media.fileType || 'audio/mpeg' })}
                  >
                    <Music className="h-8 w-8 text-green-600 mb-1" />
                    <span className="text-xs text-green-700 font-medium">Audio</span>
                  </div>
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
                {!disabled && (
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
                )}
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
            (previewMedia.type.startsWith('video/') || previewMedia.type === 'video') ? (
              <video
                src={previewMedia.url}
                controls
                className="w-full h-auto max-h-[80vh] object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (previewMedia.type.startsWith('audio/') || previewMedia.type === 'audio') ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Music className="h-16 w-16 text-green-600" />
                <h3 className="text-lg font-medium text-center">Audio File</h3>
                <audio
                  src={previewMedia.url}
                  controls
                  className="w-full max-w-md"
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
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

      {/* Camera Dialog for Photo Capture */}
      <Dialog open={showCameraDialog} onOpenChange={() => stopCamera()}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Take Photo</DialogTitle>
          <DialogDescription>
            Position your camera to capture the photo
          </DialogDescription>
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                onClick={capturePhoto}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
              <Button
                variant="outline"
                onClick={stopCamera}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Recording Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={() => stopCamera()}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Record Video</DialogTitle>
          <DialogDescription>
            Record your video by clicking start recording
          </DialogDescription>
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
            </div>
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex items-center gap-2"
                >
                  <VideoIcon className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </Button>
              )}
              <Button
                variant="outline"
                onClick={stopCamera}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Recording Dialog */}
      <Dialog open={showAudioDialog} onOpenChange={() => stopCamera()}>
        <DialogContent className="max-w-md">
          <DialogTitle>Record Audio</DialogTitle>
          <DialogDescription>
            Record your audio by clicking start recording
          </DialogDescription>
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                isRecording ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
              )}>
                <Mic className={cn(
                  "h-12 w-12",
                  isRecording && "animate-pulse"
                )} />
              </div>
            </div>
            
            {isRecording && (
              <div className="text-center">
                <p className="text-sm text-gray-600">Recording in progress...</p>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              {!isRecording ? (
                <Button
                  onClick={startAudioCapture}
                  className="flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopAudioCapture}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </Button>
              )}
              <Button
                variant="outline"
                onClick={stopCamera}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
