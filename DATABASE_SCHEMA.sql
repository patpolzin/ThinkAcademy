-- UTHINK Educational Platform Database Schema
-- Complete schema for fresh Supabase project setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core user management)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    email TEXT UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_instructor BOOLEAN DEFAULT FALSE,
    token_balances JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table (course management)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    thumbnail TEXT,
    instructor_name TEXT,
    instructor_id INTEGER REFERENCES users(id),
    token_requirement JSONB DEFAULT '{"type": "NONE"}',
    is_active BOOLEAN DEFAULT TRUE,
    duration INTEGER DEFAULT 0, -- in hours
    lesson_count INTEGER DEFAULT 0,
    assignment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table (student progress tracking)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- percentage 0-100
    progress_percentage INTEGER DEFAULT 0, -- alias for progress
    total_lessons INTEGER DEFAULT 0,
    total_assignments INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    completed_assignments INTEGER DEFAULT 0,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, course_id)
);

-- Lessons table (course content)
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    video_url TEXT,
    order_index INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0, -- in minutes
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes table (assessments)
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB DEFAULT '[]',
    passing_score INTEGER DEFAULT 70,
    time_limit INTEGER, -- in minutes
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table (course materials)
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT CHECK (resource_type IN ('document', 'video', 'link', 'file')),
    resource_url TEXT NOT NULL,
    file_size INTEGER,
    is_downloadable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live sessions table (scheduled events)
CREATE TABLE live_sessions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 60, -- in minutes
    meeting_url TEXT,
    token_requirement JSONB DEFAULT '{"type": "NONE"}',
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_is_active ON courses(is_active);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_resources_course_id ON resources(course_id);
CREATE INDEX idx_live_sessions_scheduled_at ON live_sessions(scheduled_at);

-- Insert sample data for testing
INSERT INTO users (wallet_address, display_name, email, is_admin, is_instructor) VALUES
('0x021bf842672bcd02ebc3765d911d09af216f2f1c', 'Admin User', 'admin@uthink.edu', true, true),
('0x1234567890123456789012345678901234567890', 'John Instructor', 'john@uthink.edu', false, true),
('0x0987654321098765432109876543210987654321', 'Jane Student', 'jane@uthink.edu', false, false);

INSERT INTO courses (title, description, category, difficulty, instructor_name, instructor_id, token_requirement, lesson_count, assignment_count) VALUES
('Introduction to Web3', 'Learn the fundamentals of blockchain and Web3 technologies', 'Web3', 'Beginner', 'John Instructor', 2, '{"type": "NONE"}', 5, 3),
('Advanced Smart Contracts', 'Deep dive into Solidity and smart contract development', 'Web3', 'Advanced', 'John Instructor', 2, '{"type": "ERC20", "amount": "100"}', 8, 5),
('DeFi Fundamentals', 'Understanding decentralized finance protocols', 'DeFi', 'Intermediate', 'Admin User', 1, '{"type": "NFT", "collection": "THINK_AGENT"}', 6, 4);

INSERT INTO lessons (course_id, title, description, content, order_index, duration) VALUES
(1, 'What is Blockchain?', 'Introduction to blockchain technology', 'Blockchain is a distributed ledger technology...', 1, 30),
(1, 'Cryptocurrency Basics', 'Understanding digital currencies', 'Cryptocurrencies are digital or virtual currencies...', 2, 25),
(2, 'Solidity Fundamentals', 'Learn Solidity programming language', 'Solidity is a contract-oriented programming language...', 1, 45),
(3, 'DeFi Protocols Overview', 'Introduction to major DeFi protocols', 'DeFi protocols enable financial services...', 1, 35);

INSERT INTO live_sessions (title, description, instructor_id, scheduled_at, duration, token_requirement) VALUES
('Web3 Office Hours', 'Weekly Q&A session for Web3 learners', 2, NOW() + INTERVAL '1 day', 60, '{"type": "NONE"}'),
('Smart Contract Workshop', 'Hands-on smart contract development', 1, NOW() + INTERVAL '3 days', 120, '{"type": "ERC20", "amount": "50"}');

-- Update course lesson counts based on actual lessons
UPDATE courses SET lesson_count = (
    SELECT COUNT(*) FROM lessons WHERE lessons.course_id = courses.id
);