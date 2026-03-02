import React, { useState, useRef } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUploadManualVideo } from '../hooks/useQueries';
import { ExternalBlob, VideoCategory, VideoFileType } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileVideo, Loader2, X } from 'lucide-react';

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const ACCEPTED_TYPES: Record<string, VideoFileType> = {
  'video/mp4': VideoFileType.mp4,
  'video/quicktime': VideoFileType.mov,
  'video/x-msvideo': VideoFileType.avi,
  'video/webm': VideoFileType.webm,
};

const categoryOptions = [
  { value: VideoCategory.indices, label: 'Índices' },
  { value: VideoCategory.divisas, label: 'Divisas' },
  { value: VideoCategory.acciones, label: 'Acciones' },
  { value: VideoCategory.materiasPrimas, label: 'Materias Primas' },
  { value: VideoCategory.activosDigitales, label: 'Activos Digitales' },
];

export default function ManualVideoUpload() {
  const { identity } = useInternetIdentity();
  const uploadMutation = useUploadManualVideo();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VideoCategory>(VideoCategory.indices);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setUploadSuccess(false);

    if (!ACCEPTED_TYPES[file.type]) {
      setErrorMessage('Formato no soportado. Use MP4, MOV, AVI o WebM.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('El archivo supera el límite de 2GB.');
      return;
    }

    setSelectedFile(file);
    // Do NOT auto-fill title from filename — title stays blank unless user types one
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      const fileType = ACCEPTED_TYPES[selectedFile.type] ?? VideoFileType.mp4;

      // Send title as-is (empty string allowed — no default substitution)
      const trimmedTitle = title.trim();

      await uploadMutation.mutateAsync({
        title: trimmedTitle,
        blob,
        fileSize: BigInt(selectedFile.size),
        category,
        fileType,
      });

      setUploadSuccess(true);
      setSelectedFile(null);
      setTitle('');
      setUploadProgress(100);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage('Error al subir el video: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setTitle('');
    setErrorMessage('');
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!identity) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-2">
        <FileVideo className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Subir Video Manual</h3>
      </div>

      {/* File selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Archivo de Video</Label>
        <div
          className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
              <FileVideo className="w-4 h-4 text-primary" />
              <span className="font-medium">{selectedFile.name}</span>
              <span className="text-muted-foreground">
                ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Hacé clic para seleccionar un video
              </p>
              <p className="text-xs text-muted-foreground">MP4, MOV, AVI, WebM — hasta 2GB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="manual-title" className="text-sm font-medium text-foreground">
          Título del Video
        </Label>
        <Input
          id="manual-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Análisis BTC/USD 25 Feb"
          className="bg-background"
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground">
          Opcional — dejá en blanco para guardar sin título.
        </p>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Categoría</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as VideoCategory)}
          disabled={isUploading}
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

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Subiendo video… {uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Success */}
      {uploadSuccess && (
        <Alert>
          <AlertDescription className="text-sm">
            ✅ Video subido correctamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Subir Video
            </>
          )}
        </Button>

        {(selectedFile || uploadSuccess) && !isUploading && (
          <Button onClick={handleClear} variant="ghost" className="gap-2">
            <X className="w-4 h-4" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
