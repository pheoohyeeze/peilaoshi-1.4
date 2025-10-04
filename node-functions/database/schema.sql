-- HSK Vocabulary Database Schema
-- This file contains the SQL schema for the HSK vocabulary application

-- Create database (run this separately)
-- CREATE DATABASE hsk_vocabulary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE hsk_vocabulary;

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chinese VARCHAR(50) NOT NULL COMMENT 'Chinese characters',
    pinyin VARCHAR(100) NOT NULL COMMENT 'Pinyin pronunciation',
    english TEXT NOT NULL COMMENT 'English translation',
    hsk_level TINYINT NOT NULL COMMENT 'HSK level (1-6)',
    lesson_id VARCHAR(20) COMMENT 'Lesson identifier',
    difficulty TINYINT DEFAULT 1 COMMENT 'Difficulty level (1-5)',
    notes TEXT COMMENT 'Additional notes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hsk_level (hsk_level),
    INDEX idx_lesson_id (lesson_id),
    INDEX idx_chinese (chinese),
    UNIQUE KEY unique_vocab_level (chinese, hsk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User progress table
CREATE TABLE IF NOT EXISTS progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL COMMENT 'User identifier',
    vocabulary_id INT NOT NULL COMMENT 'Vocabulary ID',
    mastery_level TINYINT DEFAULT 0 COMMENT 'Mastery level (0-5)',
    study_time INT DEFAULT 0 COMMENT 'Total study time in seconds',
    correct_count INT DEFAULT 0 COMMENT 'Number of correct answers',
    incorrect_count INT DEFAULT 0 COMMENT 'Number of incorrect answers',
    last_studied TIMESTAMP NULL COMMENT 'Last study time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_vocab (user_id, vocabulary_id),
    INDEX idx_user_id (user_id),
    INDEX idx_mastery_level (mastery_level),
    INDEX idx_last_studied (last_studied),
    FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table (for tracking study sessions)
CREATE TABLE IF NOT EXISTS study_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL COMMENT 'User identifier',
    session_type ENUM('practice', 'review', 'test') NOT NULL COMMENT 'Type of study session',
    hsk_level TINYINT COMMENT 'HSK level studied',
    lesson_id VARCHAR(20) COMMENT 'Lesson studied',
    vocabulary_count INT DEFAULT 0 COMMENT 'Number of vocabulary items studied',
    correct_count INT DEFAULT 0 COMMENT 'Number of correct answers',
    incorrect_count INT DEFAULT 0 COMMENT 'Number of incorrect answers',
    session_duration INT DEFAULT 0 COMMENT 'Session duration in seconds',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL COMMENT 'Session end time',
    
    INDEX idx_user_id (user_id),
    INDEX idx_session_type (session_type),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table (for tracking user activities)
CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL COMMENT 'User identifier',
    activity_type ENUM('login', 'study', 'review', 'test', 'progress') NOT NULL COMMENT 'Type of activity',
    vocabulary_id INT NULL COMMENT 'Vocabulary ID if applicable',
    details JSON COMMENT 'Additional activity details',
    ip_address VARCHAR(45) COMMENT 'User IP address',
    user_agent TEXT COMMENT 'User agent string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional - for testing)
INSERT IGNORE INTO vocabulary (chinese, pinyin, english, hsk_level, lesson_id, difficulty) VALUES
('你好', 'nǐ hǎo', 'hello', 1, 'H1-01', 1),
('谢谢', 'xiè xie', 'thank you', 1, 'H1-01', 1),
('再见', 'zài jiàn', 'goodbye', 1, 'H1-01', 1),
('老师', 'lǎo shī', 'teacher', 1, 'H1-02', 2),
('学生', 'xué sheng', 'student', 1, 'H1-02', 2),
('学校', 'xué xiào', 'school', 1, 'H1-02', 2),
('中国', 'zhōng guó', 'China', 1, 'H1-03', 2),
('北京', 'běi jīng', 'Beijing', 1, 'H1-03', 2),
('上海', 'shàng hǎi', 'Shanghai', 1, 'H1-03', 2),
('朋友', 'péng yǒu', 'friend', 1, 'H1-04', 2);

-- Create views for easier querying
CREATE OR REPLACE VIEW vocabulary_with_progress AS
SELECT 
    v.*,
    p.user_id,
    p.mastery_level,
    p.study_time,
    p.correct_count,
    p.incorrect_count,
    p.last_studied
FROM vocabulary v
LEFT JOIN progress p ON v.id = p.vocabulary_id;

CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    user_id,
    COUNT(DISTINCT vocabulary_id) as studied_vocabulary,
    COUNT(CASE WHEN mastery_level >= 3 THEN 1 END) as mastered_vocabulary,
    AVG(mastery_level) as avg_mastery_level,
    SUM(study_time) as total_study_time,
    SUM(correct_count) as total_correct,
    SUM(incorrect_count) as total_incorrect,
    MAX(last_studied) as last_activity
FROM progress
GROUP BY user_id;
