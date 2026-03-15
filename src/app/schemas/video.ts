// 对应 app/schemas/video.py

export interface VideoSnippet {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
}

export interface VideoStatus {
  privacyStatus: string;
  embeddable: boolean; // default=True
  license: string; // default="youtube"
  publicStatsViewable: boolean; // default=True
  selfDeclaredMadeForKids: boolean; // default=False
}

export interface VideoInfo {
  video_file_path: string;
  snippet: VideoSnippet;
  status: VideoStatus;
  recording_location?: Record<string, unknown> | null; // Optional[dict]
}
