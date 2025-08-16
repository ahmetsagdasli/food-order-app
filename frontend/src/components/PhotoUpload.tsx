// frontend/src/components/PhotoUpload.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import AttachFile from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

interface PhotoUploadProps {
  onPhotoSelected: (photo: File | null) => void;
  open: boolean;
  onClose: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoSelected,
  open,
  onClose,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [capture, setCapture] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Kamera başlatma
  useEffect(() => {
    if (capture && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) =>
          console.error("Kamera erişim hatası:", error)
        );
    }

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [capture]);

  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }, []);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        onPhotoSelected(file);
        setPreview(dataUrl);
        setCapture(false);
      }
    }
  }, [dataUrlToBlob, onPhotoSelected]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onPhotoSelected(file);
        setPreview(URL.createObjectURL(file));
      }
    },
    [onPhotoSelected]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Fotoğraf Yükle
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {preview ? (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <img
                src={preview}
                alt="Önizleme"
                style={{ maxWidth: "100%", maxHeight: "300px" }}
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                startIcon={<PhotoCamera />}
                onClick={() => setCapture(true)}
              >
                Kamera ile Çek
              </Button>
              <Button
                variant="outlined"
                startIcon={<AttachFile />}
                component="label"
              >
                Dosya Seç
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          )}

          {capture && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "300px",
                  objectFit: "cover",
                  backgroundColor: "#000",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <Button
                variant="contained"
                color="primary"
                onClick={handleCapture}
              >
                Fotoğraf Çek
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUpload;
