/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HierachyState" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('CHOOSE', 'FILL', 'MATCH');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('FRAME', 'BOOST_XP_TIME', 'BOOST_GOLD_TIME', 'BOOST_XP_PASS', 'BOOST_GOLD_PASS');

-- CreateEnum
CREATE TYPE "RewardSourceType" AS ENUM ('STREAK', 'TIER');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "grades" (
    "id" INTEGER NOT NULL,
    "state" "HierachyState" NOT NULL DEFAULT 'PUBLIC',

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "grade_id" INTEGER NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "position" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "lesson_id" INTEGER,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "summary" TEXT,
    "hls_url" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "position" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "parent_section_id" INTEGER,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" SERIAL NOT NULL,
    "position" INTEGER NOT NULL,
    "header" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "img_url" TEXT,
    "section_id" INTEGER NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flashcards" (
    "id" SERIAL NOT NULL,
    "front_text" TEXT NOT NULL,
    "back_text" TEXT NOT NULL,
    "lesson_id" INTEGER,
    "section_id" INTEGER,
    "node_id" INTEGER,

    CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_flashcards" (
    "id" SERIAL NOT NULL,
    "remaining_reviews" INTEGER NOT NULL DEFAULT 2,
    "position" INTEGER NOT NULL,
    "front_text" TEXT NOT NULL,
    "back_text" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "flashcard_id" INTEGER NOT NULL,

    CONSTRAINT "user_flashcards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "is_national_test" BOOLEAN NOT NULL DEFAULT false,
    "question_number" INTEGER NOT NULL,
    "time_limit" INTEGER,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "gold_reward" INTEGER NOT NULL DEFAULT 0,
    "pass_threshold" INTEGER NOT NULL DEFAULT 70,
    "grade_id" INTEGER,
    "topic_id" INTEGER,
    "lesson_id" INTEGER,
    "section_id" INTEGER,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "prompt_text" TEXT NOT NULL,
    "grade_id" INTEGER,
    "topic_id" INTEGER,
    "lesson_id" INTEGER,
    "section_id" INTEGER,
    "node_id" INTEGER,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_answers" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "is_correct" BOOLEAN,
    "left_text" TEXT,
    "right_text" TEXT,
    "correct_answer" TEXT,
    "question_id" INTEGER NOT NULL,

    CONSTRAINT "question_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "test_id" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("test_id","question_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "refresh_token_hash" TEXT,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "total_gold" INTEGER NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_img_url" TEXT,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "highest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_test_passed_at" TIMESTAMP(3),
    "current_tier_index" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiers" (
    "index" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "badge_img_url" TEXT,
    "description" TEXT,
    "xp_threshold" INTEGER NOT NULL,

    CONSTRAINT "tiers_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "user_social_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_test_logs" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "is_passed" BOOLEAN NOT NULL,
    "gold_earned" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "attempt_number" INTEGER NOT NULL,
    "test_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_test_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_answer_logs" (
    "id" SERIAL NOT NULL,
    "user_test_log_id" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "answer_data_json" JSONB NOT NULL,

    CONSTRAINT "user_answer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "cost" INTEGER DEFAULT 0,
    "is_consumable" BOOLEAN NOT NULL,
    "is_purchaseable" BOOLEAN NOT NULL,
    "img_url" TEXT,
    "description" TEXT,
    "type" "ItemType" NOT NULL,
    "value" DOUBLE PRECISION,
    "test_limit" INTEGER,
    "time_limit" INTEGER,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "user_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "activate_at" TIMESTAMP(3),

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("user_id","item_id")
);

-- CreateTable
CREATE TABLE "pending_rewards" (
    "id" SERIAL NOT NULL,
    "gold_amount" INTEGER NOT NULL DEFAULT 0,
    "xp_amount" INTEGER NOT NULL DEFAULT 0,
    "item_quantity" INTEGER NOT NULL DEFAULT 0,
    "source_type" "RewardSourceType" NOT NULL,
    "source_value" INTEGER NOT NULL,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "item_id" INTEGER,

    CONSTRAINT "pending_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_rewards" (
    "id" SERIAL NOT NULL,
    "gold_amount" INTEGER NOT NULL DEFAULT 0,
    "xp_amount" INTEGER NOT NULL DEFAULT 0,
    "item_quantity" INTEGER NOT NULL DEFAULT 1,
    "source_type" "RewardSourceType" NOT NULL,
    "source_value" INTEGER NOT NULL,
    "item_id" INTEGER,

    CONSTRAINT "milestone_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_accounts_provider_name_provider_user_id_key" ON "user_social_accounts"("provider_name", "provider_user_id");

-- CreateIndex
CREATE INDEX "user_test_logs_user_id_idx" ON "user_test_logs"("user_id");

-- CreateIndex
CREATE INDEX "user_answer_logs_user_test_log_id_idx" ON "user_answer_logs"("user_test_log_id");

-- CreateIndex
CREATE INDEX "user_answer_logs_question_id_idx" ON "user_answer_logs"("question_id");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_parent_section_id_fkey" FOREIGN KEY ("parent_section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flashcards" ADD CONSTRAINT "user_flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_flashcards" ADD CONSTRAINT "user_flashcards_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_tier_index_fkey" FOREIGN KEY ("current_tier_index") REFERENCES "tiers"("index") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_accounts" ADD CONSTRAINT "user_social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_test_logs" ADD CONSTRAINT "user_test_logs_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_test_logs" ADD CONSTRAINT "user_test_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer_logs" ADD CONSTRAINT "user_answer_logs_user_test_log_id_fkey" FOREIGN KEY ("user_test_log_id") REFERENCES "user_test_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answer_logs" ADD CONSTRAINT "user_answer_logs_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_rewards" ADD CONSTRAINT "pending_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_rewards" ADD CONSTRAINT "pending_rewards_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_rewards" ADD CONSTRAINT "milestone_rewards_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
