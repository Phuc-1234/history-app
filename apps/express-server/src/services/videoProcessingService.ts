import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { prisma } from "@history-app/shared";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "../config/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Set ffmpeg path dynamically from installer package
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Bản đồ in-memory lưu trữ % tiến độ transcode của các video đang xử lý
export const activeTranscodes = new Map<string, number>();

export class VideoProcessingService {
    /**
     * Chạy xử lý chuyển đổi video MP4 sang HLS và tải lên R2 ở background
     */
    async processVideoInBackground(
        videoId: string,
        localMp4Path: string,
        title: string
    ): Promise<void> {
        const tempDir = path.resolve(__dirname, "../../temp/hls", videoId);
        const outputPlaylistPath = path.join(tempDir, "index.m3u8");

        console.log(`[VideoProcessing] Bắt đầu xử lý video "${title}" (ID: ${videoId})`);
        
        // Khởi tạo tiến trình là 0%
        activeTranscodes.set(videoId, 0);
        let lastLoggedPercent = -1;
        let simulationInterval: any = null;

        try {
            // 1. Tạo thư mục tạm thời để chứa kết quả HLS
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Thiết lập bộ giả lập tăng % mượt mà từ 0% tới tối đa 95% (tốc độ chậm dần đều)
            simulationInterval = setInterval(() => {
                const currentPercent = activeTranscodes.get(videoId) || 0;
                
                if (currentPercent < 95) {
                    let increment = 0;
                    if (currentPercent < 30) {
                        // Tăng nhanh hơn một chút ở giai đoạn đầu (1-3% mỗi giây)
                        increment = Math.floor(Math.random() * 3) + 1;
                    } else if (currentPercent < 60) {
                        // Giai đoạn giữa tăng chậm lại (1-2% mỗi giây)
                        increment = Math.floor(Math.random() * 2) + 1;
                    } else if (currentPercent < 85) {
                        // Giai đoạn sau tăng rất chậm (0-1% mỗi giây)
                        increment = Math.random() < 0.6 ? 1 : 0;
                    } else {
                        // Giai đoạn cận đích tăng cực kỳ chậm để tránh đứng im lâu (20% cơ hội tăng 1% mỗi giây)
                        increment = Math.random() < 0.2 ? 1 : 0;
                    }

                    if (increment > 0) {
                        const newPercent = Math.min(currentPercent + increment, 95);
                        activeTranscodes.set(videoId, newPercent);

                        // Chỉ log ra terminal khi chuyển giao các ngưỡng 10%
                        const loggedStep = Math.floor(newPercent / 10) * 10;
                        if (loggedStep !== lastLoggedPercent && loggedStep > 0) {
                            lastLoggedPercent = loggedStep;
                            console.log(`[VideoProcessing] Tiến trình transcode giả lập ID: ${videoId} - ~${loggedStep}%`);
                        }
                    }
                }
            }, 1000);

            // 2. Chạy FFmpeg chuyển đổi MP4 -> HLS
            await new Promise<void>((resolve, reject) => {
                ffmpeg(localMp4Path)
                    .addOptions([
                        "-profile:v baseline", // Khả năng tương thích tốt nhất
                        "-level 3.0",
                        "-start_number 0",
                        "-hls_time 6", // Mỗi segment .ts dài khoảng 6 giây
                        "-hls_list_size 0", // Lưu toàn bộ segment trong file index.m3u8
                        "-f hls"
                    ])
                    .output(outputPlaylistPath)
                    .on("start", (cmd) => {
                        console.log(`[VideoProcessing] Khởi động FFmpeg cho ID: ${videoId}`);
                    })
                    .on("progress", (progress) => {
                        const rawPercent = progress.percent;
                        if (rawPercent && !isNaN(rawPercent)) {
                            const percent = Math.round(rawPercent);
                            const currentSimulated = activeTranscodes.get(videoId) || 0;
                            
                            // Nếu tiến độ thực tế vượt qua tiến độ giả lập, chuyển sang dùng thực tế
                            if (percent > currentSimulated) {
                                activeTranscodes.set(videoId, percent);
                                
                                if (percent !== lastLoggedPercent && percent % 10 === 0) {
                                    lastLoggedPercent = percent;
                                    console.log(`[VideoProcessing] Đang transcode ID: ${videoId} - Tiến trình thực tế: ${percent}%`);
                                }
                            }
                        }
                    })
                    .on("end", () => {
                        console.log(`[VideoProcessing] Transcode thành công ID: ${videoId}`);
                        resolve();
                    })
                    .on("error", (err) => {
                        console.error(`[VideoProcessing] Lỗi FFmpeg cho ID: ${videoId}:`, err);
                        reject(err);
                    })
                    .run();
            });

            // Sau khi transcode thực tế thành công, set tiến độ lên 100% trước khi upload
            activeTranscodes.set(videoId, 100);

            // Tắt bộ giả lập khi đã transcode xong
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }

            // 3. Đọc toàn bộ các file tạm đã tạo (index.m3u8 và các file phân đoạn .ts)
            const files = fs.readdirSync(tempDir);
            console.log(`[VideoProcessing] Bắt đầu upload ${files.length} tệp lên R2 cho ID: ${videoId}`);

            // 4. Upload từng file lên Cloudflare R2
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const fileStream = fs.createReadStream(filePath);
                
                // Xác định ContentType tương ứng
                let contentType = "application/octet-stream";
                if (file.endsWith(".m3u8")) {
                    contentType = "application/x-mpegURL";
                } else if (file.endsWith(".ts")) {
                    contentType = "video/MP2T";
                }

                const s3Key = `videos/${videoId}/${file}`;

                await r2Client.send(
                    new PutObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: s3Key,
                        Body: fileStream,
                        ContentType: contentType,
                    })
                );
            }

            console.log(`[VideoProcessing] Đã upload toàn bộ tệp của ID: ${videoId} lên R2.`);

            // 5. Cập nhật Database thành công
            const cleanPublicUrl = R2_PUBLIC_URL.endsWith("/")
                ? R2_PUBLIC_URL.slice(0, -1)
                : R2_PUBLIC_URL;
            const hlsUrl = `${cleanPublicUrl}/videos/${videoId}/index.m3u8`;

            await prisma.video.update({
                where: { id: videoId },
                data: {
                    hlsUrl: hlsUrl,
                    status: "READY",
                },
            });

            console.log(`[VideoProcessing] Đã hoàn thành lưu DB cho ID: ${videoId}. Link phát: ${hlsUrl}`);

        } catch (err: any) {
            console.error(`[VideoProcessing] Xử lý video thất bại cho ID: ${videoId}:`, err);

            // Cập nhật trạng thái database là FAILED
            try {
                await prisma.video.update({
                    where: { id: videoId },
                    data: {
                        status: "FAILED",
                    },
                });
            } catch (dbErr) {
                console.error(`[VideoProcessing] Không thể cập nhật trạng thái lỗi vào DB cho ID: ${videoId}:`, dbErr);
            }
        } finally {
            // Đảm bảo tắt bộ giả lập trong mọi trường hợp
            if (simulationInterval) {
                clearInterval(simulationInterval);
            }
            
            // Xóa khỏi danh sách theo dõi tiến trình
            activeTranscodes.delete(videoId);

            // 6. Dọn dẹp tệp tạm thời
            try {
                // Xóa file MP4 gốc được tải lên
                if (fs.existsSync(localMp4Path)) {
                    fs.unlinkSync(localMp4Path);
                }
                // Xóa thư mục HLS tạm thời
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                console.log(`[VideoProcessing] Đã dọn dẹp các tệp tạm của ID: ${videoId}`);
            } catch (cleanupErr) {
                console.error(`[VideoProcessing] Lỗi dọn dẹp tệp tạm của ID: ${videoId}:`, cleanupErr);
            }
        }
    }
}

export const videoProcessingService = new VideoProcessingService();
