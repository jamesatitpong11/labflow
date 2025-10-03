import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Download, 
  FileImage, 
  FileText, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttachedFile {
  fileName: string;
  fileData: string; // Base64 encoded
  fileType: string;
  uploadDate: string;
}

interface FileViewerProps {
  file: AttachedFile;
  trigger?: React.ReactNode;
}

export function FileViewer({ file, trigger }: FileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const isImage = file.fileType.startsWith('image/');
  const isPDF = file.fileType === 'application/pdf';
  const isText = file.fileType.startsWith('text/') || file.fileType === 'application/json';

  const getFileIcon = () => {
    if (isImage) return <FileImage className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const downloadFile = () => {
    try {
      const byteCharacters = atob(file.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.fileType });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "ดาวน์โหลดสำเร็จ",
        description: `ดาวน์โหลดไฟล์ ${file.fileName} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดไฟล์ได้",
        variant: "destructive",
      });
    }
  };

  const getFileSize = () => {
    try {
      const sizeInBytes = (file.fileData.length * 3) / 4;
      if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
      if (sizeInBytes < 1024 * 1024) return `${Math.round(sizeInBytes / 1024)} KB`;
      return `${Math.round(sizeInBytes / (1024 * 1024))} MB`;
    } catch {
      return 'ไม่ทราบขนาด';
    }
  };

  const renderFileContent = () => {
    if (isImage) {
      return (
        <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={`data:${file.fileType};base64,${file.fileData}`}
            alt={file.fileName}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">ไฟล์ PDF</p>
            <p className="text-sm text-gray-500 mb-4">
              คลิกดาวน์โหลดเพื่อเปิดไฟล์ในโปรแกรมอ่าน PDF
            </p>
            <Button onClick={downloadFile} className="bg-gradient-medical hover:opacity-90">
              <Download className="h-4 w-4 mr-2" />
              ดาวน์โหลด PDF
            </Button>
          </div>
        </div>
      );
    }

    if (isText) {
      try {
        const textContent = atob(file.fileData);
        return (
          <div className="bg-gray-50 rounded-lg p-4 h-full flex flex-col">
            <pre className="whitespace-pre-wrap text-sm font-mono overflow-auto flex-1">
              {textContent}
            </pre>
          </div>
        );
      } catch {
        return (
          <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">ไม่สามารถแสดงเนื้อหาไฟล์ได้</p>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">ไฟล์ประเภท: {file.fileType}</p>
          <p className="text-sm text-gray-500 mb-4">
            ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้
          </p>
          <Button onClick={downloadFile} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลดไฟล์
          </Button>
        </div>
      </div>
    );
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
      {getFileIcon()}
      <span className="ml-1 max-w-20 truncate">{file.fileName}</span>
      <Eye className="h-3 w-3 ml-1" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={`max-w-4xl ${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              {getFileIcon()}
              {file.fileName}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="text-xs">
                {file.fileType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ขนาด: {getFileSize()}
              </span>
              <span className="text-xs text-muted-foreground">
                อัปโหลด: {new Date(file.uploadDate).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((rotation + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto min-h-0">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FileViewer;
