import { useState, useRef } from 'react';
import { Trash2, Loader2, FolderOpen, Search, Play, Download, Image as ImageIcon, Upload, Video as VideoIcon, RotateCcw, Edit2, Check, X, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useGetAdminVideos, useDeleteVideo, useDownloadVideo, useUploadThumbnail, useUploadCustomThumbnail, useRevertToAutoThumbnail, useUpdateVideoTitle, useGetVideoViewCount, useIsCallerAdmin } from '../hooks/useQueries';
import { toast } from 'sonner';
import { VideoCategory, Variant_recorded_uploaded, ExternalBlob } from '../backend';

const categories = [
  { value: VideoCategory.divisas, label: 'Divisas' },
  { value: VideoCategory.indices, label: 'Índices' },
  { value: VideoCategory.acciones, label: 'Acciones' },
  { value: VideoCategory.materiasPrimas, label: 'Materias Primas' },
  { value: VideoCategory.activosDigitales, label: 'Activos Digitales' },
];

interface VideoData {
  id: string;
  title: string;
  timestamp: bigint;
  fileSize: bigint;
  blob: any;
  category: VideoCategory;
  sourceType: Variant_recorded_uploaded;
  thumbnail?: any;
  thumbnailUrl?: string;
  customThumbnail?: any;
}

function VideoViewCount({ videoId, isAdmin }: { videoId: string; isAdmin: boolean }) {
  const { data: viewCount = 0, isLoading } = useGetVideoViewCount(videoId, isAdmin);

  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="w-3.5 h-3.5" />
      <span>
        {isLoading ? '...' : viewCount} {viewCount === 1 ? 'vista' : 'vistas'}
      </span>
    </div>
  );
}

export default function VideoManagementPanel() {
  const { data: videos = [], isLoading } = useGetAdminVideos();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const deleteVideoMutation = useDeleteVideo();
  const downloadVideoMutation = useDownloadVideo();
  const uploadThumbnailMutation = useUploadThumbnail();
  const uploadCustomThumbnailMutation = useUploadCustomThumbnail();
  const revertToAutoThumbnailMutation = useRevertToAutoThumbnail();
  const updateVideoTitleMutation = useUpdateVideoTitle();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [videoForThumbnail, setVideoForThumbnail] = useState<VideoData | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: bigint) => {
    const mb = Number(bytes) / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getCategoryLabel = (category: VideoCategory) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  const getSourceTypeLabel = (sourceType: Variant_recorded_uploaded) => {
    return sourceType === Variant_recorded_uploaded.recorded ? 'Grabado' : 'Subido';
  };

  const getThumbnailUrl = (video: VideoData): string | null => {
    if (video.customThumbnail) {
      return video.customThumbnail.getDirectURL();
    }
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }
    if (video.thumbnail) {
      return video.thumbnail.getDirectURL();
    }
    return null;
  };

  const hasCustomThumbnail = (video: VideoData): boolean => {
    return !!video.customThumbnail;
  };

  const handleDelete = async (video: VideoData) => {
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideoMutation.mutateAsync(videoToDelete.id);
      toast.success('Video eliminado exitosamente');
      setShowDeleteDialog(false);
      setVideoToDelete(null);
      if (selectedVideo?.id === videoToDelete.id) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error al eliminar el video');
    }
  };

  const handleDownload = async (video: VideoData) => {
    try {
      await downloadVideoMutation.mutateAsync({
        blob: video.blob,
        title: video.title,
      });
      toast.success('Video descargado exitosamente');
    } catch (error: any) {
      console.error('Error downloading video:', error);
      if (error.message?.includes('Acceso no autorizado')) {
        toast.error('Acceso no autorizado: Solo administradores pueden descargar videos');
      } else {
        toast.error('Error al descargar el video');
      }
    }
  };

  const handleThumbnailUpload = (video: VideoData) => {
    setVideoForThumbnail(video);
    setShowThumbnailDialog(true);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleThumbnailFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no soportado. Use JPG, PNG o WebP');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Archivo demasiado grande. Máximo permitido: 5MB');
      return;
    }

    setThumbnailFile(file);
    const url = URL.createObjectURL(file);
    setThumbnailPreview(url);
  };

  const generateThumbnailFromVideo = async (video: VideoData) => {
    try {
      setIsGeneratingThumbnail(true);
      
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.src = video.blob.getDirectURL();
      
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.currentTime = 1;
        };
        videoElement.onseeked = resolve;
        videoElement.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear el contexto del canvas');
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No se pudo generar la miniatura'));
        }, 'image/jpeg', 0.9);
      });

      const thumbnailUrl = URL.createObjectURL(blob);

      await uploadThumbnailMutation.mutateAsync({
        videoId: video.id,
        imageUrl: thumbnailUrl,
        thumbnailType: 'autoGenerated',
        dimensions: {
          width: BigInt(canvas.width),
          height: BigInt(canvas.height),
        },
        fileSize: BigInt(blob.size),
        imageFormat: 'jpg',
      });

      toast.success('Miniatura generada automáticamente');
      setShowThumbnailDialog(false);
      setVideoForThumbnail(null);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error('Error al generar la miniatura automáticamente');
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const handleUploadCustomThumbnail = async () => {
    if (!thumbnailFile || !videoForThumbnail) return;

    try {
      setIsUploadingThumbnail(true);
      
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const thumbnailBlob = ExternalBlob.fromBytes(uint8Array);
      
      const img = new Image();
      const imageUrl = URL.createObjectURL(thumbnailFile);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      let imageFormat: 'jpg' | 'png' | 'webp' = 'jpg';
      if (thumbnailFile.type === 'image/png') {
        imageFormat = 'png';
      } else if (thumbnailFile.type === 'image/webp') {
        imageFormat = 'webp';
      }

      await uploadCustomThumbnailMutation.mutateAsync({
        videoId: videoForThumbnail.id,
        thumbnailBlob: thumbnailBlob,
        imageFormat: imageFormat,
        dimensions: {
          width: BigInt(img.width),
          height: BigInt(img.height),
        },
        fileSize: BigInt(thumbnailFile.size),
      });

      URL.revokeObjectURL(imageUrl);
      toast.success('Miniatura personalizada subida exitosamente');
      setShowThumbnailDialog(false);
      setVideoForThumbnail(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
    } catch (error) {
      console.error('Error uploading custom thumbnail:', error);
      toast.error('Error al subir la miniatura personalizada');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleRevertToAutoThumbnail = async (video: VideoData) => {
    try {
      await revertToAutoThumbnailMutation.mutateAsync(video.id);
      toast.success('Miniatura revertida a automática');
    } catch (error) {
      console.error('Error reverting thumbnail:', error);
      toast.error('Error al revertir la miniatura');
    }
  };

  const startEditingTitle = (video: VideoData) => {
    setEditingVideoId(video.id);
    setEditingTitle(video.title);
  };

  const cancelEditingTitle = () => {
    setEditingVideoId(null);
    setEditingTitle('');
  };

  // Title is optional: empty string is allowed and the backend will auto-generate a default title.
  const saveEditedTitle = async (videoId: string) => {
    try {
      await updateVideoTitleMutation.mutateAsync({
        videoId,
        newTitle: editingTitle.trim(),
      });
      toast.success('Título actualizado exitosamente');
      setEditingVideoId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating video title:', error);
      toast.error('Error al actualizar el título');
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || video.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando videos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Administración de Videos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="py-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterCategory !== 'all'
                  ? 'No se encontraron videos con los filtros aplicados'
                  : 'No hay videos. Use el panel de grabación o subida manual para agregar videos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} encontrado{filteredVideos.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {filteredVideos.map((video) => {
                  const thumbnailUrl = getThumbnailUrl(video);
                  const isCustom = hasCustomThumbnail(video);
                  const isEditing = editingVideoId === video.id;
                  
                  return (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border"
                    >
                      <div className="w-32 h-20 flex-shrink-0 bg-background rounded overflow-hidden border border-border relative">
                        {thumbnailUrl ? (
                          <>
                            <img
                              src={thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover grayscale"
                            />
                            {isCustom && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                Personalizada
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  placeholder="Dejar vacío para título automático"
                                  className="flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveEditedTitle(video.id);
                                    } else if (e.key === 'Escape') {
                                      cancelEditingTitle();
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveEditedTitle(video.id)}
                                  disabled={updateVideoTitleMutation.isPending}
                                >
                                  {updateVideoTitleMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEditingTitle}
                                  disabled={updateVideoTitleMutation.isPending}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground pl-1">
                                Opcional – dejar vacío para generar un título automático.
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-sm truncate">{video.title}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="flex-shrink-0 h-6 w-6 p-0"
                                onClick={() => startEditingTitle(video)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(video.category)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getSourceTypeLabel(video.sourceType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(video.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(video.fileSize)}
                          </span>
                          <VideoViewCount videoId={video.id} isAdmin={isAdmin} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedVideo(video)}
                          title="Ver video"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownload(video)}
                          disabled={downloadVideoMutation.isPending}
                          title="Descargar video"
                        >
                          {downloadVideoMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleThumbnailUpload(video)}
                          title="Gestionar miniatura"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                        {hasCustomThumbnail(video) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRevertToAutoThumbnail(video)}
                            disabled={revertToAutoThumbnailMutation.isPending}
                            title="Revertir a miniatura automática"
                          >
                            {revertToAutoThumbnailMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(video)}
                          title="Eliminar video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Preview Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>
              {selectedVideo && (
                <span>
                  {getCategoryLabel(selectedVideo.category)} · {formatDate(selectedVideo.timestamp)} · {formatFileSize(selectedVideo.fileSize)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video bg-black rounded overflow-hidden">
              <video
                src={selectedVideo.blob.getDirectURL()}
                controls
                className="w-full h-full"
                autoPlay={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Thumbnail Management Dialog */}
      <Dialog open={showThumbnailDialog} onOpenChange={(open) => {
        if (!open) {
          setShowThumbnailDialog(false);
          setVideoForThumbnail(null);
          setThumbnailFile(null);
          setThumbnailPreview(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Gestionar Miniatura
            </DialogTitle>
            <DialogDescription>
              {videoForThumbnail?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {thumbnailPreview && (
              <div className="aspect-video bg-muted rounded overflow-hidden">
                <img
                  src={thumbnailPreview}
                  alt="Vista previa de miniatura"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Subir miniatura personalizada</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar imagen
                </Button>
                {thumbnailFile && (
                  <Button
                    size="sm"
                    onClick={handleUploadCustomThumbnail}
                    disabled={isUploadingThumbnail}
                  >
                    {isUploadingThumbnail ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Subir
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos: JPG, PNG, WebP · Máximo: 5MB
              </p>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleThumbnailFileSelect}
                className="hidden"
              />
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <p className="text-sm font-medium">Generar desde el video</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => videoForThumbnail && generateThumbnailFromVideo(videoForThumbnail)}
                disabled={isGeneratingThumbnail}
                className="w-full"
              >
                {isGeneratingThumbnail ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <VideoIcon className="w-4 h-4 mr-2" />
                )}
                Generar miniatura automáticamente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El video "{videoToDelete?.title}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setVideoToDelete(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVideoMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
