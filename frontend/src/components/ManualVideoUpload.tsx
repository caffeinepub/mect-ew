import { useState, useRef } from 'react';
import { Upload, Loader2, FileVideo, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useUploadManualVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import { VideoCategory, VideoFileType, ExternalBlob } from '../backend';

const categories = [
  { value: VideoCategory.divisas, label: 'Divisas' },
  { value: VideoCategory.indices, label: 'Índices' },
  { value: VideoCategory.acciones, label: 'Acciones' },
  { value: VideoCategory.materiasPrimas, label: 'Materias Primas' },
  { value: VideoCategory.activosDigitales, label: 'Activos Digitales' },
];

const fileTypes = [
  { value: VideoFileType.mp4, label: 'MP4', mimeTypes: ['video/mp4'], extensions: ['.mp4'] },
  { value: VideoFileType.mov, label: 'MOV', mimeTypes: ['video/quicktime'], extensions: ['.mov'] },
  { value: VideoFileType.avi, label: 'AVI', mimeTypes: ['video/x-msvideo', 'video/avi', 'video/msvideo'], extensions: ['.avi'] },
  { value: VideoFileType.webm, label: 'WebM', mimeTypes: ['video/webm'], extensions: ['.webm'] },
];

// Maximum file size: 2GB
const MAX_FILE_SIZE_GB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;

export default function ManualVideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>(VideoCategory.divisas);
  const [selectedFileType, setSelectedFileType] = useState<VideoFileType>(VideoFileType.mp4);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStartTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<{ time: number; progress: number }>({ time: 0, progress: 0 });
  
  const uploadManualVideoMutation = useUploadManualVideo();

  const validateFileType = (file: File): { isValid: boolean; detectedType?: VideoFileType; error?: string } => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Check by file extension first
    for (const type of fileTypes) {
      for (const ext of type.extensions) {
        if (fileName.endsWith(ext)) {
          return { isValid: true, detectedType: type.value };
        }
      }
    }

    // Check by MIME type
    for (const type of fileTypes) {
      for (const mimeType of type.mimeTypes) {
        if (fileType === mimeType) {
          return { isValid: true, detectedType: type.value };
        }
      }
    }

    return { 
      isValid: false, 
      error: 'Formato no soportado. Use MP4, MOV, AVI o WebM.' 
    };
  };

  const validateFileSize = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      return { 
        isValid: false, 
        error: `Archivo demasiado grande (${fileSizeGB} GB). Máximo permitido: ${MAX_FILE_SIZE_GB} GB.` 
      };
    }
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Archivo corrupto o dañado. El tamaño del archivo es 0 bytes.'
      };
    }
    return { isValid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setUploadStatus('idle');
    setRetryCount(0);

    // Validate file type
    const typeValidation = validateFileType(file);
    if (!typeValidation.isValid) {
      setValidationError(typeValidation.error || 'Error de validación de formato');
      toast.error(typeValidation.error || 'Error de validación de formato');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.isValid) {
      setValidationError(sizeValidation.error || 'Error de validación de tamaño');
      toast.error(sizeValidation.error || 'Error de validación de tamaño');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    
    // Auto-detect and set file type
    if (typeValidation.detectedType) {
      setSelectedFileType(typeValidation.detectedType);
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Do NOT auto-fill title - let user decide if they want a title
    // Title field remains empty by default

    toast.success('Archivo seleccionado correctamente');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploadSpeed(0);
    setEstimatedTimeRemaining(0);
    setValidationError(null);
    setUploadStatus('idle');
    setRetryCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateUploadMetrics = (percentage: number) => {
    const now = Date.now();
    const elapsed = (now - uploadStartTimeRef.current) / 1000; // seconds
    
    if (elapsed > 0 && percentage > 0) {
      // Calculate speed
      const progressDelta = percentage - lastProgressUpdateRef.current.progress;
      const timeDelta = (now - lastProgressUpdateRef.current.time) / 1000;
      
      if (timeDelta > 0 && progressDelta > 0) {
        const bytesUploaded = (percentage / 100) * (selectedFile?.size || 0);
        const speed = bytesUploaded / elapsed; // bytes per second
        setUploadSpeed(speed);
        
        // Calculate estimated time remaining
        const remainingBytes = (selectedFile?.size || 0) - bytesUploaded;
        const timeRemaining = remainingBytes / speed;
        setEstimatedTimeRemaining(timeRemaining);
        
        lastProgressUpdateRef.current = { time: now, progress: percentage };
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    // Re-validate before upload
    const typeValidation = validateFileType(selectedFile);
    if (!typeValidation.isValid) {
      toast.error(typeValidation.error || 'Formato de archivo inválido');
      return;
    }

    const sizeValidation = validateFileSize(selectedFile);
    if (!sizeValidation.isValid) {
      toast.error(sizeValidation.error || 'Archivo demasiado grande');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTimeRemaining(0);
      uploadStartTimeRef.current = Date.now();
      lastProgressUpdateRef.current = { time: Date.now(), progress: 0 };

      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const externalBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage: number) => {
          setUploadProgress(percentage);
          calculateUploadMetrics(percentage);
        }
      );

      setUploadStatus('processing');
      
      // Trim whitespace from title before sending
      const trimmedTitle = videoTitle.trim();
      
      await uploadManualVideoMutation.mutateAsync({
        title: trimmedTitle,
        fileSize: BigInt(selectedFile.size),
        blob: externalBlob,
        category: selectedCategory,
        fileType: selectedFileType,
      });

      setUploadStatus('success');
      toast.success('Video subido exitosamente');
      
      // Reset form after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setVideoTitle('');
        setUploadProgress(0);
        setUploadSpeed(0);
        setEstimatedTimeRemaining(0);
        setPreviewUrl(null);
        setValidationError(null);
        setUploadStatus('idle');
        setRetryCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      setUploadStatus('error');
      
      // Enhanced error handling with Spanish messages
      let errorMessage = 'Error al subir el video';
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        if (msg.includes('formato') || msg.includes('format')) {
          errorMessage = 'Formato de archivo no soportado. Use MP4, MOV, AVI o WebM.';
        } else if (msg.includes('tamaño') || msg.includes('size') || msg.includes('grande') || msg.includes('large')) {
          errorMessage = `Archivo demasiado grande. Máximo permitido: ${MAX_FILE_SIZE_GB} GB.`;
        } else if (msg.includes('corrupto') || msg.includes('corrupt') || msg.includes('dañado') || msg.includes('damaged')) {
          errorMessage = 'Archivo corrupto o dañado. Intente con otro archivo.';
        } else if (msg.includes('autorizado') || msg.includes('authorized')) {
          errorMessage = 'Acceso no autorizado. Solo administradores pueden subir videos.';
        } else if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet e intente nuevamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      
      // Offer retry for network errors
      if (retryCount < 3 && (error?.message?.toLowerCase().includes('network') || error?.message?.toLowerCase().includes('timeout'))) {
        setRetryCount(prev => prev + 1);
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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Video Manualmente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Suba videos externos en formato MP4, MOV, AVI o WebM. Tamaño máximo: {MAX_FILE_SIZE_GB} GB.
          </AlertDescription>
        </Alert>

        {validationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Video subido exitosamente. El formulario se reiniciará automáticamente.
            </AlertDescription>
          </Alert>
        )}

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileVideo className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Haga clic para seleccionar un video</p>
              <p className="text-xs text-muted-foreground">MP4, MOV, AVI, WebM (máx. {MAX_FILE_SIZE_GB} GB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,video/msvideo,video/webm,.mp4,.mov,.avi,.webm"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveFile}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-muted-foreground">Archivo:</span>
                <span className="ml-2 font-medium truncate block">{selectedFile.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tamaño:</span>
                <span className="ml-2 font-medium">{formatFileSize(selectedFile.size)}</span>
              </div>
              {uploadStatus === 'idle' && (
                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Archivo válido y listo para subir</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-video-title">Video Title (optional)</Label>
              <Input
                id="upload-video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="E.g., EUR/USD Analysis - Week of January 27"
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for automatic title generation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-video-category">Categoría *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as VideoCategory)}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                >
                  <SelectTrigger id="upload-video-category">
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-file-type">Tipo de Archivo *</Label>
                <Select
                  value={selectedFileType}
                  onValueChange={(value) => setSelectedFileType(value as VideoFileType)}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                >
                  <SelectTrigger id="upload-file-type">
                    <SelectValue placeholder="Seleccione el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {uploadStatus === 'uploading' ? 'Subiendo video...' : 'Procesando video...'}
                  </span>
                  <span className="font-bold">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                {uploadStatus === 'uploading' && uploadSpeed > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Velocidad: {formatSpeed(uploadSpeed)}</span>
                    <span>Tiempo restante: ~{formatTime(estimatedTimeRemaining)}</span>
                  </div>
                )}
                {retryCount > 0 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Reintentando... (Intento {retryCount}/3)
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'success'}
                className="flex-1"
              >
                {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadStatus === 'uploading' ? 'Subiendo...' : 'Procesando...'}
                  </>
                ) : uploadStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Subido
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Video
                  </>
                )}
              </Button>
              <Button
                onClick={handleRemoveFile}
                variant="outline"
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
