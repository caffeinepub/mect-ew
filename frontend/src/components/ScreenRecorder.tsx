import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Square, Mic, MicOff, Loader2, Monitor, Settings, AlertCircle, Download, CheckCircle2, Upload, X, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useUploadVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import { VideoCategory } from '../backend';

declare const ExternalBlob: any;

const categories = [
  { value: VideoCategory.divisas, label: 'Divisas' },
  { value: VideoCategory.indices, label: 'Índices' },
  { value: VideoCategory.acciones, label: 'Acciones' },
  { value: VideoCategory.materiasPrimas, label: 'Materias Primas' },
  { value: VideoCategory.activosDigitales, label: 'Activos Digitales' },
];

export default function ScreenRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>(VideoCategory.divisas);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<{ time: number; progress: number }>({ time: 0, progress: 0 });
  const previewUrlRef = useRef<string | null>(null);

  const uploadVideoMutation = useUploadVideo();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
    return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const calculateUploadMetrics = (percentage: number, fileSize: number) => {
    const now = Date.now();
    const elapsed = (now - uploadStartTimeRef.current) / 1000;

    if (elapsed > 0 && percentage > 0) {
      const progressDelta = percentage - lastProgressUpdateRef.current.progress;
      const timeDelta = (now - lastProgressUpdateRef.current.time) / 1000;

      if (timeDelta > 0 && progressDelta > 0) {
        const bytesUploaded = (percentage / 100) * fileSize;
        const speed = bytesUploaded / elapsed;
        setUploadSpeed(speed);

        const remainingBytes = fileSize - bytesUploaded;
        const timeRemaining = remainingBytes / speed;
        setEstimatedTimeRemaining(timeRemaining);

        lastProgressUpdateRef.current = { time: now, progress: percentage };
      }
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setIsPreparing(true);
      chunksRef.current = [];
      setRecordingDuration(0);
      // Clear any previous preview when starting a new recording
      clearPreviewUrl();

      const displayMediaOptions: any = {
        video: {
          displaySurface: 'monitor',
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: includeSystemAudio
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              sampleRate: 48000,
            }
          : false,
        preferCurrentTab: false,
        selfBrowserSurface: 'exclude',
        systemAudio: includeSystemAudio ? 'include' : 'exclude',
        surfaceSwitching: 'include',
        monitorTypeSurfaces: 'include',
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      let finalStream = displayStream;

      if (includeMicrophone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 48000,
            },
            video: false,
          });

          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            finalStream.addTrack(audioTrack);
          }
        } catch (audioError) {
          console.warn('Could not capture microphone audio:', audioError);
          toast.warning('Grabación iniciada sin audio de micrófono');
        }
      }

      streamRef.current = finalStream;

      let mimeType = 'video/webm';
      const videoBitsPerSecond = 8000000;

      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264';
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setIsRecording(false);

        // Create preview URL from the recorded blob
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        toast.success('Grabación completada');
      };

      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          toast.info('Grabación detenida por el usuario');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPreparing(false);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast.success('Grabación iniciada en alta calidad (Full HD, 60 FPS)');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setIsPreparing(false);

      if (error.name === 'NotAllowedError') {
        toast.error('Permiso denegado para capturar pantalla');
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró ninguna pantalla para capturar');
      } else {
        toast.error('Error al iniciar la grabación: ' + error.message);
      }
    }
  }, [includeMicrophone, includeSystemAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleDownloadRecording = async () => {
    if (!recordedBlob) return;

    try {
      setIsDownloading(true);
      const url = URL.createObjectURL(recordedBlob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `grabacion-${timestamp}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Video descargado exitosamente');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Error al descargar el video');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob) {
      toast.error('No hay grabación disponible para subir');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTimeRemaining(0);
      setRetryCount(0);
      uploadStartTimeRef.current = Date.now();
      lastProgressUpdateRef.current = { time: Date.now(), progress: 0 };

      const arrayBuffer = await recordedBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage: number) => {
          setUploadProgress(percentage);
          calculateUploadMetrics(percentage, recordedBlob.size);
        }
      );

      setUploadStatus('processing');

      // Trim whitespace from title before sending
      const trimmedTitle = videoTitle.trim();

      await uploadVideoMutation.mutateAsync({
        title: trimmedTitle,
        fileSize: BigInt(recordedBlob.size),
        blob: externalBlob,
        category: selectedCategory,
      });

      setUploadStatus('success');
      toast.success('Video subido exitosamente');

      setTimeout(() => {
        clearPreviewUrl();
        setRecordedBlob(null);
        setVideoTitle('');
        setUploadProgress(0);
        setUploadSpeed(0);
        setEstimatedTimeRemaining(0);
        setRecordingDuration(0);
        setUploadStatus('idle');
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      setUploadStatus('error');

      let errorMessage = 'Error al subir el video';

      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('autorizado') || msg.includes('authorized')) {
          errorMessage = 'Acceso no autorizado. Solo administradores pueden subir videos.';
        } else if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);

      if (
        retryCount < 3 &&
        (error?.message?.toLowerCase().includes('network') ||
          error?.message?.toLowerCase().includes('timeout'))
      ) {
        setRetryCount((prev) => prev + 1);
        toast.info(`Reintento automático ${retryCount + 1}/3 en 3 segundos...`);
        setTimeout(() => {
          handleUpload();
        }, 3000);
      } else {
        setUploadProgress(0);
        setUploadSpeed(0);
        setEstimatedTimeRemaining(0);
      }
    }
  };

  const discardRecording = () => {
    clearPreviewUrl();
    setRecordedBlob(null);
    setVideoTitle('');
    setUploadProgress(0);
    setUploadSpeed(0);
    setEstimatedTimeRemaining(0);
    setRecordingDuration(0);
    setUploadStatus('idle');
    setRetryCount(0);
    toast.info('Grabación descartada');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Panel de Grabación de Pantalla
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recordedBlob ? (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Grabe su pantalla en alta calidad (Full HD, 60 FPS) con audio del sistema y micrófono.
                Ideal para capturar análisis desde TradingView u otras plataformas.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Configuración de Audio</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {showAdvancedSettings ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>

              {showAdvancedSettings && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="mic-audio" className="text-sm font-medium">
                        Audio de Micrófono
                      </Label>
                      <p className="text-xs text-muted-foreground">Captura tu voz durante el análisis</p>
                    </div>
                    <Switch
                      id="mic-audio"
                      checked={includeMicrophone}
                      onCheckedChange={setIncludeMicrophone}
                      disabled={isRecording || isPreparing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-audio" className="text-sm font-medium">
                        Audio del Sistema
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Captura el audio de la aplicación compartida
                      </p>
                    </div>
                    <Switch
                      id="system-audio"
                      checked={includeSystemAudio}
                      onCheckedChange={setIncludeSystemAudio}
                      disabled={isRecording || isPreparing}
                    />
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      <strong>Calidad de Video:</strong> Full HD (1920x1080) a 60 FPS
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Bitrate:</strong> 8 Mbps para máxima calidad
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  {includeMicrophone ? (
                    <>
                      <Mic className="w-4 h-4 text-primary" />
                      <span>
                        Micrófono: <strong>Activado</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Micrófono: Desactivado</span>
                    </>
                  )}
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 text-sm">
                  {includeSystemAudio ? (
                    <>
                      <Monitor className="w-4 h-4 text-primary" />
                      <span>
                        Audio Sistema: <strong>Activado</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Audio Sistema: Desactivado</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} disabled={isPreparing} className="flex-1" size="lg">
                  {isPreparing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Iniciar Grabación
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Detener Grabación
                </Button>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center justify-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium text-destructive">
                  Grabando — {formatDuration(recordingDuration)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recording Preview Section */}
            {previewUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Vista Previa de la Grabación</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Revisá el video antes de subirlo
                  </span>
                </div>
                <div className="relative w-full rounded-lg overflow-hidden border border-border bg-black">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-72 object-contain"
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Grabación lista</p>
                <p className="text-xs text-muted-foreground">
                  Tamaño: {formatFileSize(recordedBlob.size)} · Duración: {formatDuration(recordingDuration)}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>

            {uploadStatus === 'idle' || uploadStatus === 'error' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title">Título del Video (opcional)</Label>
                  <Input
                    id="video-title"
                    placeholder="Se generará automáticamente si se deja vacío"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-category">Categoría</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value as VideoCategory)}
                  >
                    <SelectTrigger id="video-category">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpload} className="flex-1" size="lg">
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Video
                  </Button>
                  <Button
                    onClick={handleDownloadRecording}
                    variant="outline"
                    size="lg"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                  <Button onClick={discardRecording} variant="ghost" size="lg">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {uploadStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error al subir el video. Puede intentarlo nuevamente o descargar la grabación.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploadStatus === 'uploading' ? 'Subiendo video...' : 'Procesando...'}
                  </span>
                  <span className="font-medium">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {uploadSpeed > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Velocidad: {formatSpeed(uploadSpeed)}</span>
                    {estimatedTimeRemaining > 0 && (
                      <span>Tiempo restante: {formatTime(estimatedTimeRemaining)}</span>
                    )}
                  </div>
                )}
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">¡Video subido exitosamente!</span>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
