import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  Play,
  Square,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import React, { useState, useRef, useCallback } from "react";
import { ExternalBlob, VideoCategory } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUploadVideo } from "../hooks/useQueries";

type RecordingState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "success"
  | "error";

export default function ScreenRecorder() {
  const { identity } = useInternetIdentity();
  const uploadVideoMutation = useUploadVideo();

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<VideoCategory>(
    VideoCategory.indices,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const categoryOptions = [
    { value: VideoCategory.indices, label: "Índices" },
    { value: VideoCategory.divisas, label: "Divisas" },
    { value: VideoCategory.acciones, label: "Acciones" },
    { value: VideoCategory.materiasPrimas, label: "Materias Primas" },
    { value: VideoCategory.activosDigitales, label: "Activos Digitales" },
  ];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      setErrorMessage("");
      revokePreview();
      chunksRef.current = [];
      recordedBlobRef.current = null;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        recordedBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecordingState("stopped");
      };

      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      };

      mediaRecorder.start(1000);
      setRecordingState("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        setErrorMessage(
          `Error al iniciar la grabación: ${err.message || "Error desconocido"}`,
        );
        setRecordingState("error");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) {
        t.stop();
      }
      streamRef.current = null;
    }
  };

  const handleUpload = async () => {
    if (!recordedBlobRef.current) return;

    setRecordingState("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const arrayBuffer = await recordedBlobRef.current.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (pct) => {
          setUploadProgress(pct);
        },
      );

      // Send title as-is (empty string allowed — no default substitution)
      const trimmedTitle = title.trim();

      await uploadVideoMutation.mutateAsync({
        title: trimmedTitle,
        blob,
        fileSize: BigInt(recordedBlobRef.current.size),
        category,
      });

      revokePreview();
      setRecordingState("success");
      setTitle("");
      setUploadProgress(100);
    } catch (err: any) {
      setErrorMessage(
        `Error al subir el video: ${err.message || "Error desconocido"}`,
      );
      setRecordingState("error");
    }
  };

  const handleDownload = () => {
    if (!recordedBlobRef.current) return;
    const url = previewUrl || URL.createObjectURL(recordedBlobRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grabacion-${Date.now()}.webm`;
    a.click();
    if (!previewUrl) URL.revokeObjectURL(url);
  };

  const handleDiscard = () => {
    revokePreview();
    recordedBlobRef.current = null;
    chunksRef.current = [];
    setRecordingState("idle");
    setTitle("");
    setUploadProgress(0);
    setErrorMessage("");
    setRecordingTime(0);
  };

  const handleRetry = () => {
    setRecordingState("idle");
    setErrorMessage("");
    setUploadProgress(0);
  };

  if (!identity) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Monitor className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Grabador de Pantalla
        </h3>
      </div>

      {/* Title & Category */}
      {(recordingState === "idle" ||
        recordingState === "stopped" ||
        recordingState === "error") && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="rec-title"
              className="text-sm font-medium text-foreground"
            >
              Título del Video
            </Label>
            <Input
              id="rec-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Análisis EUR/USD 25 Feb"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Opcional — dejá en blanco para guardar sin título.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Categoría
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as VideoCategory)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Recording state */}
      {recordingState === "recording" && (
        <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            Grabando — {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Preview */}
      {recordingState === "stopped" && previewUrl && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Play className="w-4 h-4" /> Vista previa
          </Label>
          <video
            src={previewUrl}
            controls
            className="w-full rounded-md border border-border bg-black"
            style={{ maxHeight: "320px" }}
          >
            <track kind="captions" />
          </video>
        </div>
      )}

      {/* Upload progress */}
      {recordingState === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Subiendo video… {uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Success */}
      {recordingState === "success" && (
        <Alert>
          <AlertDescription className="text-sm">
            ✅ Video subido correctamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {(recordingState === "error" || errorMessage) && errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {recordingState === "idle" && (
          <Button onClick={startRecording} className="gap-2">
            <Video className="w-4 h-4" />
            Iniciar Grabación
          </Button>
        )}

        {recordingState === "recording" && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Detener Grabación
          </Button>
        )}

        {recordingState === "stopped" && (
          <>
            <Button onClick={handleUpload} className="gap-2">
              <Upload className="w-4 h-4" />
              Subir Video
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar
            </Button>
            <Button
              onClick={handleDiscard}
              variant="ghost"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Descartar
            </Button>
          </>
        )}

        {recordingState === "error" && (
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            Reintentar
          </Button>
        )}

        {recordingState === "success" && (
          <Button onClick={handleDiscard} variant="outline" className="gap-2">
            Nueva Grabación
          </Button>
        )}
      </div>
    </div>
  );
}
