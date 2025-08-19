import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface QRCodeModalProps {
  publicId: string;
  buildingName: string;
  overallScore: number;
  maxPossibleScore: number;
  status: string;
  trigger?: React.ReactNode;
}

interface QRCodeData {
  qrCodeDataUrl: string;
  targetUrl: string;
  buildingName: string;
  overallScore: number;
  maxPossibleScore: number;
}

export default function QRCodeModal({ publicId, buildingName, overallScore, maxPossibleScore, status, trigger }: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch QR code data when modal opens
  const { data: qrData, isLoading, error } = useQuery<QRCodeData>({
    queryKey: ['/api/assessments', publicId, 'qr'],
    enabled: isOpen,
  });

  const handleDownload = () => {
    if (qrData?.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = qrData.qrCodeDataUrl;
      link.download = `${buildingName.replace(/[^a-z0-9]/gi, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your downloads folder.",
      });
    }
  };

  const handleCopyUrl = async () => {
    if (qrData?.targetUrl) {
      try {
        await navigator.clipboard.writeText(qrData.targetUrl);
        toast({
          title: "URL Copied",
          description: "The public assessment URL has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy URL to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrData?.targetUrl) {
      try {
        await navigator.share({
          title: `${buildingName} - GREDA Assessment`,
          text: `View the green building assessment for ${buildingName}`,
          url: qrData.targetUrl,
        });
      } catch (error) {
        // Fallback to copy URL if native sharing fails
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleViewPublic = () => {
    if (qrData?.targetUrl) {
      window.open(qrData.targetUrl, '_blank');
    }
  };

  // Only show QR code for completed assessments
  if (status !== 'completed') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code for {buildingName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center p-6 bg-white rounded-lg border">
            {isLoading ? (
              <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-400" />
              </div>
            ) : error ? (
              <div className="w-48 h-48 bg-red-50 rounded-lg flex items-center justify-center">
                <p className="text-red-600 text-sm text-center">
                  Failed to generate QR code
                </p>
              </div>
            ) : qrData?.qrCodeDataUrl ? (
              <img
                src={qrData.qrCodeDataUrl}
                alt={`QR Code for ${buildingName}`}
                className="w-48 h-48 rounded-lg"
              />
            ) : null}
          </div>

          {/* Assessment Info */}
          {qrData && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Assessment Details
              </h3>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <p><span className="font-medium">Building:</span> {qrData.buildingName}</p>
                <p><span className="font-medium">Score:</span> {qrData.overallScore}/{qrData.maxPossibleScore}</p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                  Scan this QR code to view the complete assessment data publicly
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDownload}
              disabled={!qrData?.qrCodeDataUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            
            <Button
              onClick={handleShare}
              disabled={!qrData?.targetUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            
            <Button
              onClick={handleCopyUrl}
              disabled={!qrData?.targetUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy URL
            </Button>
            
            <Button
              onClick={handleViewPublic}
              disabled={!qrData?.targetUrl}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Public
            </Button>
          </div>

          {/* Public URL Display */}
          {qrData?.targetUrl && (
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="font-medium mb-1">Public URL:</p>
              <p className="break-all font-mono">{qrData.targetUrl}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}