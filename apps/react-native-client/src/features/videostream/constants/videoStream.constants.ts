import { LessonVideo } from '../types/videoStream.type';

export const LESSON_VIDEOS: LessonVideo[] = [
  {
    id: "1",
    title: 'Bài 1: Khởi nghĩa Hai Bà Trưng',
    description: 'Tìm hiểu nguyên nhân, diễn biến và ý nghĩa lịch sử.',
    duration: '08:30',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: "2",
    title: 'Bài 2: Chiến thắng Bạch Đằng',
    description: 'Bài học về chiến thuật và tinh thần chống ngoại xâm.',
    duration: '10:15',
    url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
  },
  {
    id: "3",
    title: 'Bài 3: Nhà Lý và kinh đô Thăng Long',
    description: 'Khám phá sự hình thành và phát triển của nhà Lý.',
    duration: '12:00',
    url: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
  },
];