import { LESSON_VIDEOS } from '../constants/videoStream.constants';
import { LessonVideo } from '../types/videoStream.type';

export const videoStreamService = {
  async getLessonVideos(): Promise<LessonVideo[]> {
    return LESSON_VIDEOS;
  },
};
// ví dụ
// const response = await fetch('https://api-cua-ban.com/lesson-videos');
// return await response.json();