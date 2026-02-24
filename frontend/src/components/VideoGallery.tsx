import { Play, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useDeleteVideo } from '../hooks/useQueries';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PublicVideoMeta } from '../backend';

interface VideoGalleryProps {
  videos: PublicVideoMeta[];
  isLoading: boolean;
}

export default function VideoGallery({ videos, isLoading }: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<PublicVideoMeta | null>(null);
  const [videoBlob, setVideoBlob] = useState<any>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(new Map());
  const { data: isAdmin } = useIsCallerAdmin();
  const { actor } = useActor();
  const deleteVideoMutation = useDeleteVideo();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (selectedVideo && actor) {
      setLoadingBlob(true);
      actor.streamVideo(selectedVideo.id)
        .then((blob) => {
          setVideoBlob(blob);
          // Invalidate view count queries after streaming completes (for admin)
          if (isAdmin) {
            queryClient.invalidateQueries({ queryKey: ['videoViewCount', selectedVideo.id] });
          }
        })
        .catch((error) => {
          console.error('Error loading video:', error);
          toast.error('Error al cargar el video');
        })
        .finally(() => {
          setLoadingBlob(false);
        });
    } else {
      setVideoBlob(null);
    }
  }, [selectedVideo, actor, isAdmin, queryClient]);

  useEffect(() => {
    if (!actor) return;

    videos.forEach(async (video) => {
      if (video.thumbnailUrl && !thumbnailCache.has(video.id)) {
        try {
          const thumbnailBlob = await actor.getVideoThumbnailBlob(video.id);
          if (thumbnailBlob) {
            const url = thumbnailBlob.getDirectURL();
            setThumbnailCache((prev) => new Map(prev).set(video.id, url));
          }
        } catch (error) {
          console.error('Error loading thumbnail for video:', video.id, error);
        }
      }
    });
  }, [videos, actor, thumbnailCache]);

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este video?')) {
      return;
    }

    try {
      await deleteVideoMutation.mutateAsync(videoId);
      toast.success('Video eliminado exitosamente');
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error al eliminar el video');
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getThumbnailUrl = (video: PublicVideoMeta): string | null => {
    if (video.thumbnailUrl && thumbnailCache.has(video.id)) {
      return thumbnailCache.get(video.id) || null;
    }
    return null;
  };

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

  if (videos.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Galería de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No hay videos de análisis disponibles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Galería de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => {
              const thumbnailUrl = getThumbnailUrl(video);
              
              return (
                <div
                  key={video.id}
                  className="group relative bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="aspect-video bg-background relative overflow-hidden">
                    {thumbnailUrl ? (
                      <>
                        <img
                          src={thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-foreground ml-1" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Play className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatDate(video.timestamp)}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(video.id);
                        }}
                        disabled={deleteVideoMutation.isPending}
                      >
                        {deleteVideoMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {loadingBlob ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                  </div>
                ) : videoBlob ? (
                  <video
                    src={videoBlob.getDirectURL()}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Error al cargar el video</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatDate(selectedVideo.timestamp)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
