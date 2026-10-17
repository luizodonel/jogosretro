export interface Game {
  id: number;
  title: string;
  systemCore: string;
  systemName: string;
  releaseYear: number;
  genre: string;
  description: string;
  romFileName: string;
  romSizeBytes: number;
  coverUrl: string;
  hasSaveState: boolean;
  createdAt: string;
  lastPlayedAt?: string;
}

export interface SystemInfo {
  core: string;
  name: string;
  extensions: string[];
  color: string;
  icon: string;
  gameCount: number;
}
