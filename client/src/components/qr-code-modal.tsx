import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Share2, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface QRCodeData {
  qrCodeDataUrl: string;
  targetUrl: string;
  buildingName: string;
  overallScore: number;
  maxPossibleScore: number;
}

interface QRCodeModalProps {
  publicId: string;
  buildingName: string;
  overallScore: number;
  maxPossibleScore: number;
  status: string;
}

export function QRCodeModal({ publicId, buildingName, overallScore, maxPossibleScore, status }: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: qrData, isLoading, error } = useQuery<QRCodeData>({
    queryKey: [`/api/assessments/${publicId}/qr`],
    enabled: isOpen && status === 'completed',
  });

  const handleCopyUrl = async () => {
    if (qrData?.targetUrl) {
      try {
        await navigator.clipboard.writeText(qrData.targetUrl);
        setCopied(true);
        toast({
          title: "URL Copied",
          description: "The assessment URL has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy URL to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadQR = () => {
    if (qrData?.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = qrData.qrCodeDataUrl;
      link.download = `${buildingName.replace(/[^a-zA-Z0-9]/g, '_')}_QR_Code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your downloads.",
      });
    }
  };

  const handleShare = async () => {
    if (qrData?.targetUrl) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${buildingName} - Green Building Assessment`,
            text: `View the detailed green building assessment for ${buildingName}`,
            url: qrData.targetUrl,
          });
        } catch (error) {
          console.log('Share cancelled or failed');
        }
      } else {
        handleCopyUrl();
      }
    }
  };

  const getCertificationType = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return { type: 'Gold', color: 'bg-yellow-500' };
    if (percentage >= 60) return { type: 'Silver', color: 'bg-gray-400' };
    if (percentage >= 40) return { type: 'Bronze', color: 'bg-amber-600' };
    return { type: 'Basic', color: 'bg-green-600' };
  };

  const certification = getCertificationType(overallScore, maxPossibleScore);

  if (status !== 'completed') {
    return (
      <Button variant="outline" disabled>
        <QrCode className="w-4 h-4 mr-2" />
        QR Code (Complete assessment first)
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800">
          <QrCode className="w-4 h-4 mr-2 text-green-600" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-green-600" />
            Public Assessment QR Code
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center p-4">
            <p className="text-destructive text-sm">Failed to generate QR code. Please try again.</p>
          </div>
        )}

        {qrData && (
          <div className="space-y-4">
            {/* QR Code Display */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                    <img 
                      src={qrData.qrCodeDataUrl} 
                      alt={`QR Code for ${buildingName}`}
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{buildingName}</h3>
                    <div className="flex items-center justify-center gap-2">
                      <Badge className={`${certification.color} text-white`}>
                        {certification.type} Certification
                      </Badge>
                      <Badge variant="outline">
                        Score: {overallScore}/{maxPossibleScore}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* URL Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Public Assessment URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrData.targetUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleDownloadQR}
                className="flex-1"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Button 
                onClick={handleShare}
                className="flex-1"
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share URL
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p className="font-medium mb-1">How to use this QR code:</p>
              <p>Anyone who scans this QR code can view the complete assessment data, including all sections, scores, and supporting documentation for {buildingName}.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}