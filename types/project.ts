export type ProjectType = {
  id: string;
  name: string;
  theme: string;
  designSystemLocked: boolean;
  thumbnail?: string;
  frames: FrameType[];
  connections?: ConnectionType[];
  createdAt: Date;
  updatedAt?: Date;
};

export type FrameType = {
  id: string;
  title: string;
  htmlContent: string;
  projectId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  isLoading?: boolean;
};

export type ConnectionType = {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  label?: string;
  type?: string;
};

export type CanvasImageType = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
