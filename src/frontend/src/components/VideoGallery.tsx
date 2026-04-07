import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Play, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PublicVideoMeta } from "../backend";
import { useActor } from "../hooks/useActor";
import { useDeleteVideo, useIsCallerAdmin } from "../hooks/useQueries";

const SITE_URL = "https://mectelliottwave.com";
const SITE_TITLE = "MECT EW - Análisis Técnico de Mercados Financieros";

function WhatsAppIcon() {
  return (
    <svg
      role="img"
      aria-label="WhatsApp"
      className="w-4 h-4 mr-2 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="#25D366"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      role="img"
      aria-label="Telegram"
      className="w-4 h-4 mr-2 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="#26A5E4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

interface VideoGalleryProps {
  videos: PublicVideoMeta[];
  isLoading: boolean;
  autoOpenVideoId?: string;
  currentCategory?: string;
}

export default function VideoGallery({
  videos,
  isLoading,
  autoOpenVideoId,
  currentCategory: _currentCategory,
}: VideoGalleryProps) {
  const [selectedVideo, setSelectedVideo] = useState<PublicVideoMeta | null>(
    null,
  );
  const [videoBlob, setVideoBlob] = useState<any>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [thumbnailCache, setThumbnailCache] = useState<Map<string, string>>(
    new Map(),
  );
  const { data: isAdmin } = useIsCallerAdmin();
  const { actor } = useActor();
  const deleteVideoMutation = useDeleteVideo();
  const queryClient = useQueryClient();

  // Auto-open video from URL param
  useEffect(() => {
    if (autoOpenVideoId && videos.length > 0) {
      const target = videos.find((v) => v.id === autoOpenVideoId);
      if (target) {
        setSelectedVideo(target);
      }
    }
  }, [autoOpenVideoId, videos]);

  useEffect(() => {
    if (selectedVideo && actor) {
      setLoadingBlob(true);
      actor
        .streamVideo(selectedVideo.id, null)
        .then((blob) => {
          setVideoBlob(blob);
          if (isAdmin) {
            queryClient.invalidateQueries({
              queryKey: ["videoViewCount", selectedVideo.id],
            });
          }
        })
        .catch((error) => {
          console.error("Error loading video:", error);
          toast.error("Error al cargar el video");
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

    (async () => {
      for (const video of videos) {
        if (video.thumbnailUrl && !thumbnailCache.has(video.id)) {
          try {
            const thumbnailBlob = await actor.getVideoThumbnailBlob(video.id);
            if (thumbnailBlob) {
              const url = thumbnailBlob.getDirectURL();
              setThumbnailCache((prev) => new Map(prev).set(video.id, url));
            }
          } catch (error) {
            console.error(
              "Error loading thumbnail for video:",
              video.id,
              error,
            );
          }
        }
      }
    })();
  }, [videos, actor, thumbnailCache]);

  const handleDelete = async (videoId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este video?")) {
      return;
    }

    try {
      await deleteVideoMutation.mutateAsync(videoId);
      toast.success("Video eliminado exitosamente");
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Error al eliminar el video");
    }
  };

  const handleShare = (
    channel: "whatsapp" | "telegram" | "email",
    _video: PublicVideoMeta,
  ) => {
    const message = `${SITE_TITLE}\n${SITE_URL}`;

    let url: string;
    if (channel === "whatsapp") {
      url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    } else if (channel === "telegram") {
      url = `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(SITE_TITLE)}`;
    } else {
      url = `mailto:?subject=${encodeURIComponent(SITE_TITLE)}&body=${encodeURIComponent(message)}`;
    }

    window.open(url, "_blank");
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSelectedVideo(video);
                  }}
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

                    {/* Share button - visible to all visitors */}
                    <div className="mt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-border text-foreground hover:bg-muted"
                            onClick={(e) => e.stopPropagation()}
                            data-ocid="analysis.share_button"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="bg-background border-border"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-muted"
                            onSelect={() => handleShare("whatsapp", video)}
                          >
                            <WhatsAppIcon />
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-muted"
                            onSelect={() => handleShare("telegram", video)}
                          >
                            <TelegramIcon />
                            Telegram
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-muted"
                            onSelect={() => handleShare("email", video)}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Delete button - admin only */}
                    {isAdmin && (
                      <div className="mt-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(video.id);
                          }}
                          disabled={deleteVideoMutation.isPending}
                          data-ocid="analysis.delete_button"
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedVideo}
        onOpenChange={() => setSelectedVideo(null)}
      >
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
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Error al cargar el video
                    </p>
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
