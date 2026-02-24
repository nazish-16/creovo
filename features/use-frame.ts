/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

export const useRegenerateFrame = (projectId: string) => {
  return useMutation({
    mutationFn: async ({
      frameId,
      prompt,
    }: {
      frameId: string;
      prompt: string;
    }) => {
      const res = await axios.post(
        `/api/project/${projectId}/frame/regenerate`,
        {
          frameId,
          prompt,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Frame regeneration started");
    },
    onError: () => {
      toast.error("Failed to regenerate frame");
    },
  });
};

export const useDeleteFrame = (projectId: string) => {
  return useMutation({
    mutationFn: async (frameId: string) => {
      const res = await axios.delete(`/api/project/${projectId}/frame/delete`, {
        data: { frameId },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Frame deleted successfully");
    },
    onError: (error: any) => {
      console.log("Delete frame failed", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to delete frame";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateFrame = (projectId: string) => {
  return useMutation({
    mutationFn: async ({
      frameId,
      htmlContent,
      isSilent = false,
    }: {
      frameId: string;
      htmlContent: string;
      isSilent?: boolean;
    }) => {
      const res = await axios.patch(`/api/project/${projectId}/frame/update`, {
        frameId,
        htmlContent,
      });
      return { ...res.data, isSilent };
    },
    onSuccess: (data) => {
      if (!data.isSilent) {
        toast.success("Design saved successfully");
      }
    },
    onError: () => {
      toast.error("Failed to save design");
    },
  });
};
export const useAnalyzeDesign = (projectId: string) => {
  return useMutation({
    mutationFn: async (frameId: string) => {
      const res = await axios.post(`/api/project/${projectId}/frame/analyze`, {
        frameId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Design analysis started");
    },
    onError: () => {
      toast.error("Failed to analyze design");
    },
  });
};

export const useRefactorUX = (projectId: string) => {
  return useMutation({
    mutationFn: async (frameId: string) => {
      const res = await axios.post(`/api/project/${projectId}/frame/refactor`, {
        frameId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("UX refactoring started");
    },
    onError: () => {
      toast.error("Failed to refactor UX");
    },
  });
};

export const useApplyCritiqueFix = (projectId: string) => {
  return useMutation({
    mutationFn: async ({
      frameId,
      actionableFixes,
    }: {
      frameId: string;
      actionableFixes: string;
    }) => {
      const res = await axios.post(`/api/project/${projectId}/frame/apply-fix`, {
        frameId,
        actionableFixes,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Applying recommended fixes...");
    },
    onError: () => {
      toast.error("Failed to apply fixes");
    },
  });
};

export const useCreateConnection = (projectId: string) => {
  return useMutation({
    mutationFn: async ({
      fromId,
      toId,
      label = "On Tap",
    }: {
      fromId: string;
      toId: string;
      label?: string;
    }) => {
      const res = await axios.post(`/api/project/${projectId}/connection/create`, {
        fromId,
        toId,
        label,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Flow connection created");
    },
    onError: () => {
      toast.error("Failed to create connection");
    },
  });
};
export const useDeleteConnection = (projectId: string) => {
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await axios.delete(
        `/api/project/${projectId}/connection/${connectionId}`
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Connection deleted");
    },
    onError: () => {
      toast.error("Failed to delete connection");
    },
  });
};
