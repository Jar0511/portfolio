export type Preset = { savedAt: string; command: string };
export type CameraPresets = Partial<Record<number, (Preset | null)[]>>;
