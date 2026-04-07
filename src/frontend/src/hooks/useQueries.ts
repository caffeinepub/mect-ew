import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ContactForm,
  FormType,
  StoredMessage,
  UserProfile,
  VideoCategory,
  VideoFileType,
  VideoViewRecord,
} from "../backend";
import { ImageFormat, ThumbnailType } from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Admin Check with immediate recognition after login
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalString = identity?.getPrincipal().toString();

  return useQuery<boolean>({
    queryKey: ["isAdmin", principalString],
    queryFn: async () => {
      if (!actor || !identity) {
        return false;
      }
      try {
        const result = await actor.isCallerAdmin();
        console.log(
          "Admin check result for principal",
          principalString,
          ":",
          result,
        );
        return result;
      } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 500,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Video Management Hooks
export function useGetAllVideos() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAdminVideos() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["adminVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdminVideos();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetVideosByCategory(category: VideoCategory) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ["videos", category],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetVideoViewCount(videoId: string, isAdmin: boolean) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<number>({
    queryKey: ["videoViewCount", videoId],
    queryFn: async () => {
      if (!actor) return 0;
      try {
        const count = await actor.getViewCount(videoId);
        return Number(count);
      } catch (error) {
        console.error("Error fetching view count:", error);
        return 0;
      }
    },
    enabled: !!actor && !actorFetching && isAdmin && !!videoId,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useGetVideoViewRecords(videoId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoViewRecord[]>({
    queryKey: ["videoViewRecords", videoId],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getViewRecords(videoId);
      } catch (error) {
        console.error("Error fetching view records:", error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!videoId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      fileSize: bigint;
      blob: any;
      category: VideoCategory;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // Title is already trimmed in the component, pass as-is
      return actor.uploadVideo(
        params.title,
        params.blob,
        params.fileSize,
        params.category,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useUploadManualVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      fileSize: bigint;
      blob: any;
      category: VideoCategory;
      fileType: VideoFileType;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // Title is already trimmed in the component, pass as-is
      return actor.uploadManualVideo(
        params.title,
        params.blob,
        params.fileSize,
        params.category,
        params.fileType,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useUploadThumbnail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      videoId: string;
      imageUrl: string;
      thumbnailType: "manualUpload" | "autoGenerated";
      dimensions: { width: bigint; height: bigint };
      fileSize: bigint;
      imageFormat: "jpg" | "png" | "webp";
    }) => {
      if (!actor) throw new Error("Actor not available");

      const thumbnailType =
        params.thumbnailType === "manualUpload"
          ? ThumbnailType.manualUpload
          : ThumbnailType.autoGenerated;

      let imageFormat: ImageFormat;
      if (params.imageFormat === "jpg") {
        imageFormat = ImageFormat.jpg;
      } else if (params.imageFormat === "png") {
        imageFormat = ImageFormat.png;
      } else {
        imageFormat = ImageFormat.webp;
      }

      return actor.uploadThumbnail(
        params.videoId,
        params.imageUrl,
        thumbnailType,
        params.dimensions,
        params.fileSize,
        imageFormat,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useUploadCustomThumbnail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      videoId: string;
      thumbnailBlob: ExternalBlob;
      imageFormat: "jpg" | "png" | "webp";
      dimensions: { width: bigint; height: bigint };
      fileSize: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");

      let imageFormat: ImageFormat;
      if (params.imageFormat === "jpg") {
        imageFormat = ImageFormat.jpg;
      } else if (params.imageFormat === "png") {
        imageFormat = ImageFormat.png;
      } else {
        imageFormat = ImageFormat.webp;
      }

      return actor.uploadCustomThumbnail(
        params.videoId,
        params.thumbnailBlob,
        imageFormat,
        params.dimensions,
        params.fileSize,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useRevertToAutoThumbnail() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.revertToAutoThumbnail(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useUpdateVideoTitle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { videoId: string; newTitle: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateVideoTitle(params.videoId, params.newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["adminVideos"] });
      queryClient.invalidateQueries({ queryKey: ["videoViewCount"] });
      queryClient.invalidateQueries({ queryKey: ["videoViewRecords"] });
    },
  });
}

export function useDownloadVideo() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { blob: any; title: string }) => {
      if (!actor) throw new Error("Actor not available");

      await actor.downloadBlob(params.blob);

      const videoBytes = await params.blob.getBytes();

      const blob = new Blob([videoBytes], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${params.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

// Contact Form Hooks
export function useSubmitContactForm() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { form: ContactForm; formType: FormType }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitContactForm(params.form, params.formType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Message Management Hooks
export function useGetAllMessages() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<StoredMessage[]>({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages(null);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetFormSpecificMessages(formType: FormType) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<StoredMessage[]>({
    queryKey: ["messages", formType],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages(formType);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useReplyToMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { messageId: string; replyContent: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.replyToMessage(params.messageId, params.replyContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

// Domain Management Hooks
export function useForceVerification() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.retryVerification();
    },
  });
}
