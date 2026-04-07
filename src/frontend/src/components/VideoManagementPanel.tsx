import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart2,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Globe,
  HelpCircle,
  Image,
  Loader2,
  MoveRight,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  ExternalBlob,
  ImageFormat,
  VideoCategory,
  type VideoMeta,
  type VideoViewRecord,
} from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteVideo,
  useGetAdminVideos,
  useGetVideoViewCount,
  useGetVideoViewRecords,
  useUpdateVideoTitle,
  useUploadCustomThumbnail,
} from "../hooks/useQueries";

const categoryLabels: Record<VideoCategory, string> = {
  [VideoCategory.indices]: "Índices",
  [VideoCategory.divisas]: "Divisas",
  [VideoCategory.acciones]: "Acciones",
  [VideoCategory.materiasPrimas]: "Materias Primas",
  [VideoCategory.activosDigitales]: "Activos Digitales",
};

const categoryOptions = Object.entries(categoryLabels).map(
  ([value, label]) => ({
    value: value as VideoCategory,
    label,
  }),
);

// ── useMoveVideoToCategory (local hook) ───────────────────────────────────────
function useMoveVideoToCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      videoId: string;
      newCategoryText: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.moveVideoToCategory(params.videoId, params.newCategoryText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

// ── Geographic breakdown helpers ──────────────────────────────────────────────
interface CountryCount {
  code: string;
  name: string;
  count: number;
  isUnknown: boolean;
}

const UNKNOWN_SENTINEL = "__unknown__";

function aggregateByCountry(records: VideoViewRecord[]): CountryCount[] {
  const map = new Map<string, CountryCount>();

  for (const record of records) {
    // Treat missing, empty, or whitespace-only country code/name as "Unknown"
    const rawCode = record.country[0]?.code?.trim() ?? "";
    const rawName = record.country[0]?.name?.trim() ?? "";
    const isUnknown = rawCode === "" || rawName === "";

    const key = isUnknown ? UNKNOWN_SENTINEL : rawCode;
    const existing = map.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        code: isUnknown ? UNKNOWN_SENTINEL : rawCode,
        name: isUnknown ? "Desconocido" : rawName,
        count: 1,
        isUnknown,
      });
    }
  }

  // Sort by count descending; "Unknown" entries participate in the same sort
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ── GeoBreakdown sub-component ────────────────────────────────────────────────
function GeoBreakdown({ videoId }: { videoId: string }) {
  const { data: records, isLoading, error } = useGetVideoViewRecords(videoId);

  if (isLoading) {
    return (
      <div className="space-y-1 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-destructive pt-1">
        Error al cargar datos geográficos.
      </p>
    );
  }

  if (!records || records.length === 0) {
    return (
      <p className="text-xs text-muted-foreground pt-1 italic">
        Sin vistas registradas aún.
      </p>
    );
  }

  const countries = aggregateByCountry(records);
  const total = records.length;

  return (
    <div className="pt-1 space-y-1">
      <p className="text-xs text-muted-foreground mb-2">
        Total: <span className="font-semibold text-foreground">{total}</span>{" "}
        vista{total !== 1 ? "s" : ""}
      </p>
      {countries.map((c) => {
        const pct = Math.round((c.count / total) * 100);
        return (
          <div key={c.code} className="flex items-center gap-2">
            <span
              className={`text-xs font-medium w-32 truncate flex items-center gap-1 ${
                c.isUnknown ? "text-muted-foreground italic" : "text-foreground"
              }`}
              title={
                c.isUnknown
                  ? "País no registrado (vista anterior al seguimiento geográfico)"
                  : c.name
              }
            >
              {c.isUnknown && <HelpCircle className="w-3 h-3 flex-shrink-0" />}
              {c.name}
            </span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${c.isUnknown ? "bg-muted-foreground/40" : "bg-foreground/60"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-16 text-right">
              {c.count} ({pct}%)
            </span>
          </div>
        );
      })}
      {countries.some((c) => c.isUnknown) && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          * Las vistas "Desconocido" corresponden a registros anteriores al
          seguimiento geográfico.
        </p>
      )}
    </div>
  );
}

// ── VideoViewCount sub-component ──────────────────────────────────────────────
function VideoViewCount({ videoId }: { videoId: string }) {
  const { data: count, isLoading } = useGetVideoViewCount(videoId, true);
  const [geoOpen, setGeoOpen] = useState(false);

  return (
    <div className="w-full">
      <Collapsible open={geoOpen} onOpenChange={setGeoOpen}>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart2 className="w-3 h-3" />
            {isLoading ? "…" : (count?.toString() ?? "0")} vistas
          </span>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-xs gap-0.5 text-muted-foreground hover:text-foreground"
              title="Ver desglose geográfico"
            >
              <Globe className="w-3 h-3" />
              {geoOpen ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-2 border border-border rounded-md p-3 bg-muted/30">
            <div className="flex items-center gap-1 mb-2">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Vistas por país
              </span>
            </div>
            <GeoBreakdown videoId={videoId} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ── VideoRow sub-component ────────────────────────────────────────────────────
interface VideoRowProps {
  video: VideoMeta;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function VideoRow({ video, onDelete, isDeleting }: VideoRowProps) {
  const updateTitleMutation = useUpdateVideoTitle();
  const moveCategoryMutation = useMoveVideoToCategory();
  const uploadThumbnailMutation = useUploadCustomThumbnail();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(video.title);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  const handleTitleSave = async () => {
    const newTitle = titleInput.trim();
    try {
      await updateTitleMutation.mutateAsync({ videoId: video.id, newTitle });
      setEditingTitle(false);
    } catch {
      // keep editing open on error
    }
  };

  const handleTitleCancel = () => {
    setTitleInput(video.title);
    setEditingTitle(false);
  };

  const handleCategoryChange = async (newCategory: string) => {
    try {
      await moveCategoryMutation.mutateAsync({
        videoId: video.id,
        newCategoryText: newCategory,
      });
    } catch {
      // ignore
    }
  };

  const handlePreview = async () => {
    try {
      const blob = await video.blob.getBytes();
      const blobObj = new Blob([blob], { type: "video/webm" });
      const url = URL.createObjectURL(blobObj);
      setPreviewUrl(url);
    } catch {
      // ignore
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await video.blob.getBytes();
      const blobObj = new Blob([blob], { type: "video/webm" });
      const url = URL.createObjectURL(blobObj);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title || video.id}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const extBlob = ExternalBlob.fromBytes(uint8Array);

      const ext = file.name.split(".").pop()?.toLowerCase();
      const fmt: ImageFormat =
        ext === "png"
          ? ImageFormat.png
          : ext === "webp"
            ? ImageFormat.webp
            : ImageFormat.jpg;

      await uploadThumbnailMutation.mutateAsync({
        videoId: video.id,
        thumbnailBlob: extBlob,
        imageFormat: fmt,
        dimensions: { width: BigInt(1280), height: BigInt(720) },
        fileSize: BigInt(file.size),
      });

      const previewObjectUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewObjectUrl);
    } catch {
      // ignore
    }
  };

  const thumbnailSrc = video.customThumbnail
    ? video.customThumbnail.getDirectURL()
    : thumbnailPreview;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      {/* Thumbnail + title row */}
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center cursor-pointer relative group"
          onClick={() => thumbnailInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter") thumbnailInputRef.current?.click();
          }}
        >
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt="thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <Image className="w-6 h-6 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Image className="w-4 h-4 text-white" />
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleThumbnailUpload}
            className="hidden"
          />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 space-y-1">
          {editingTitle ? (
            <div className="space-y-1">
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="h-8 text-sm bg-background"
                placeholder="Sin título"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") handleTitleCancel();
                }}
              />
              <p className="text-xs text-muted-foreground">
                Opcional — dejá en blanco para guardar sin título.
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={handleTitleSave}
                  disabled={updateTitleMutation.isPending}
                >
                  {updateTitleMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={handleTitleCancel}
                >
                  <X className="w-3 h-3" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1">
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {video.title ? (
                  video.title
                ) : (
                  <span className="text-muted-foreground italic">
                    Sin título
                  </span>
                )}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 flex-shrink-0"
                onClick={() => {
                  setTitleInput(video.title);
                  setEditingTitle(true);
                }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[video.category]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {video.sourceType === "recorded" ? "Grabado" : "Subido"}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            {new Date(Number(video.timestamp) / 1_000_000).toLocaleDateString(
              "es-AR",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              },
            )}
            {" · "}
            {(Number(video.fileSize) / (1024 * 1024)).toFixed(1)} MB
          </p>

          {/* View count + geographic breakdown */}
          <VideoViewCount videoId={video.id} />
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-1">
          <video
            src={previewUrl}
            controls
            className="w-full rounded border border-border bg-black"
            style={{ maxHeight: "240px" }}
          >
            <track kind="captions" />
          </video>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-6"
            onClick={() => {
              URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
          >
            Cerrar vista previa
          </Button>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Move category */}
        <Select value={video.category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="h-7 text-xs w-44 bg-background">
            <MoveRight className="w-3 h-3 mr-1 flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={handlePreview}
        >
          <Eye className="w-3 h-3" />
          Ver
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={handleDownload}
        >
          <Download className="w-3 h-3" />
          Descargar
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs gap-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El video será eliminado
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(video.id)}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function VideoManagementPanel() {
  const { identity } = useInternetIdentity();
  const { data: videos, isLoading, error } = useGetAdminVideos();
  const deleteVideoMutation = useDeleteVideo();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<VideoCategory | "all">(
    "all",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!videos) return [];
    return videos.filter((v) => {
      const matchesSearch =
        !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || v.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, search, filterCategory]);

  const handleDelete = async (videoId: string) => {
    setDeletingId(videoId);
    try {
      await deleteVideoMutation.mutateAsync(videoId);
    } finally {
      setDeletingId(null);
    }
  };

  if (!identity) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          Gestión de Videos
        </h3>
        {videos && (
          <Badge variant="secondary" className="text-xs">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(v) => setFilterCategory(v as VideoCategory | "all")}
        >
          <SelectTrigger className="h-8 text-xs w-44 bg-background">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              Todas las categorías
            </SelectItem>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar videos: {String(error)}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8 italic">
          {videos?.length === 0
            ? "No hay videos publicados aún."
            : "No se encontraron videos con los filtros aplicados."}
        </p>
      )}

      {/* Video list */}
      <div className="space-y-3">
        {filtered.map((video) => (
          <VideoRow
            key={video.id}
            video={video}
            onDelete={handleDelete}
            isDeleting={deletingId === video.id}
          />
        ))}
      </div>
    </div>
  );
}
