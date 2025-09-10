import postgres from "postgres";

// Parse DATABASE_URL safely to handle special characters in password
function parseSupabaseUrl(url: string) {
  // Check if it's a valid postgresql:// URL
  if (!url.startsWith('postgresql://')) {
    throw new Error(`Invalid DATABASE_URL format. Expected postgresql://... but got: ${url.substring(0, 50)}...`);
  }
  
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error(`Cannot parse DATABASE_URL. Format should be: postgresql://user:pass@host:port/db`);
  }
  
  const [, username, password, host, port, database] = match;
  
  return {
    host,
    port: parseInt(port),
    database,
    username,
    password: decodeURIComponent(password), // Decode any URL-encoded characters
    ssl: { rejectUnauthorized: false },
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  };
}

export function createDbConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set');
  }
  
  const connectionConfig = parseSupabaseUrl(connectionString);
  return postgres(connectionConfig);
}

// Direct database operations that work
export class DirectStorage {
  async getCourses() {
    const sql = createDbConnection();
    try {
      const result = await sql`SELECT * FROM courses ORDER BY created_at DESC`;
      await sql.end();
      
      // Transform database response to match expected interface
      return result.map(course => ({
        ...course,
        tokenRequirement: typeof course.token_requirement === 'string' 
          ? JSON.parse(course.token_requirement) 
          : course.token_requirement,
        instructorName: course.instructor_name,
        isActive: course.is_active,
        lessonCount: course.lesson_count || 0,
        assignmentCount: course.assignment_count || 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at
      }));
    } catch (error) {
      console.error('Database error getting courses:', error);
      throw error;
    }
  }

  async getInstructorCourses(walletAddress: string) {
    const sql = createDbConnection();
    try {
      // First get the user ID from wallet address
      const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${walletAddress.toLowerCase()}`;
      if (userResult.length === 0) {
        await sql.end();
        return [];
      }
      
      const userId = userResult[0].id;
      const result = await sql`
        SELECT c.*, 
               COUNT(DISTINCT e.id) as student_count
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.instructor_id = ${userId}
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      await sql.end();
      
      // Transform the results to match expected interface
      return result.map(course => ({
        ...course,
        tokenRequirement: typeof course.token_requirement === 'string' 
          ? JSON.parse(course.token_requirement) 
          : course.token_requirement,
        instructorName: course.instructor_name,
        isActive: course.is_active,
        lessonCount: course.lesson_count || 0,
        assignmentCount: course.assignment_count || 0,
        studentCount: course.student_count || 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at
      }));
    } catch (error) {
      console.error('Database error fetching instructor courses:', error);
      throw error;
    }
  }

  async createCourse(courseData: any) {
    const sql = createDbConnection();
    try {
      // Handle undefined values by providing defaults
      const safeData = {
        title: courseData.title || 'Untitled Course',
        description: courseData.description || '',
        category: courseData.category || 'General',
        difficulty: courseData.difficulty || 'Beginner',
        duration: courseData.duration || 0,
        instructorName: courseData.instructorName || courseData.instructor || 'Unknown',
        instructorId: courseData.instructorId || null,
        tokenRequirement: courseData.tokenRequirement || {},
        isActive: courseData.isActive !== false
      };

      const result = await sql`
        INSERT INTO courses (title, description, category, difficulty, duration, instructor_name, instructor_id, token_requirement, is_active)
        VALUES (${safeData.title}, ${safeData.description}, ${safeData.category}, ${safeData.difficulty}, ${safeData.duration}, ${safeData.instructorName}, ${safeData.instructorId}, ${JSON.stringify(safeData.tokenRequirement)}, ${safeData.isActive})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating course:', error);
      throw error;
    }
  }

  async getCourseContent(courseId: number, contentType: 'lessons' | 'quizzes' | 'resources' | 'forums') {
    const sql = createDbConnection();
    try {
      let result: any[] = [];
      switch (contentType) {
        case 'lessons':
          result = await sql`
            SELECT * FROM lessons 
            WHERE course_id = ${courseId} 
            ORDER BY order_index ASC, created_at ASC
          `;
          break;
        case 'quizzes':
          result = await sql`
            SELECT * FROM quizzes 
            WHERE course_id = ${courseId} 
            ORDER BY order_index ASC, created_at ASC
          `;
          break;
        case 'resources':
          result = await sql`
            SELECT * FROM resources 
            WHERE course_id = ${courseId} 
            ORDER BY created_at ASC
          `;
          break;
        case 'forums':
          result = await sql`
            SELECT f.*, u.display_name as user_display_name
            FROM forums f
            LEFT JOIN users u ON f.user_id::text = u.id::text
            WHERE f.course_id::text = ${courseId.toString()}
            ORDER BY f.created_at DESC
          `;
          break;
        default:
          result = [];
      }
      await sql.end();
      return result;
    } catch (error) {
      console.error(`Database error getting ${contentType}:`, error);
      return []; // Return empty array instead of throwing
    }
  }

  async deleteEnrollment(enrollmentId: number) {
    const sql = createDbConnection();
    try {
      await sql`DELETE FROM enrollments WHERE id = ${enrollmentId}`;
      await sql.end();
    } catch (error) {
      console.error('Database error deleting enrollment:', error);
      throw error;
    }
  }

  // Course content management methods
  async createLesson(lessonData: any) {
    const sql = createDbConnection();
    try {
      const safeData = {
        courseId: lessonData.courseId,
        title: lessonData.title || 'Untitled Lesson',
        description: lessonData.description || '',
        content: lessonData.content || '',
        videoUrl: lessonData.videoUrl || null,
        order: lessonData.order || 0,
        duration: lessonData.duration || 0
      };

      const result = await sql`
        INSERT INTO lessons (course_id, title, description, content, video_url, order_index, duration)
        VALUES (${safeData.courseId}, ${safeData.title}, ${safeData.description}, ${safeData.content}, ${safeData.videoUrl}, ${safeData.order}, ${safeData.duration})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating lesson:', error);
      throw error;
    }
  }

  async createQuiz(quizData: any) {
    const sql = createDbConnection();
    try {
      const safeData = {
        courseId: quizData.courseId,
        title: quizData.title || 'Untitled Quiz',
        description: quizData.description || '',
        questions: quizData.questions || [],
        passingScore: quizData.passingScore || 70,
        timeLimit: quizData.timeLimit || null,
        order: quizData.order || 0
      };

      const result = await sql`
        INSERT INTO quizzes (course_id, title, description, questions, passing_score, time_limit, order_index)
        VALUES (${safeData.courseId}, ${safeData.title}, ${safeData.description}, ${JSON.stringify(safeData.questions)}, ${safeData.passingScore}, ${safeData.timeLimit}, ${safeData.order})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating quiz:', error);
      throw error;
    }
  }

  async createResource(resourceData: any) {
    const sql = createDbConnection();
    try {
      const safeData = {
        courseId: resourceData.courseId,
        title: resourceData.title || 'Untitled Resource',
        description: resourceData.description || '',
        type: resourceData.type || 'document',
        url: resourceData.url || null,
        fileSize: resourceData.fileSize || null,
        isPublic: resourceData.isPublic || false
      };

      const result = await sql`
        INSERT INTO resources (course_id, title, description, file_url, file_type, file_size, is_public)
        VALUES (${safeData.courseId}, ${safeData.title}, ${safeData.description}, ${safeData.url}, ${safeData.type}, ${safeData.fileSize}, ${safeData.isPublic || false})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating resource:', error);
      throw error;
    }
  }

  async updateLesson(lessonId: number, updates: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE lessons 
        SET title = COALESCE(${updates.title || null}, title),
            description = COALESCE(${updates.description || null}, description),
            content = COALESCE(${updates.content || null}, content),
            video_url = COALESCE(${updates.videoUrl || null}, video_url),
            order_index = COALESCE(${updates.order || null}, order_index),
            duration = COALESCE(${updates.duration || null}, duration),
            updated_at = NOW()
        WHERE id = ${lessonId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating lesson:', error);
      throw error;
    }
  }

  async deleteLesson(lessonId: number) {
    const sql = createDbConnection();
    try {
      await sql`DELETE FROM lessons WHERE id = ${lessonId}`;
      await sql.end();
    } catch (error) {
      console.error('Database error deleting lesson:', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: number) {
    const sql = createDbConnection();
    try {
      await sql`DELETE FROM quizzes WHERE id = ${quizId}`;
      await sql.end();
    } catch (error) {
      console.error('Database error deleting quiz:', error);
      throw error;
    }
  }

  async updateResource(resourceId: number, updates: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE resources 
        SET title = COALESCE(${updates.title || null}, title),
            description = COALESCE(${updates.description || null}, description),
            file_url = COALESCE(${updates.fileUrl || null}, file_url),
            file_type = COALESCE(${updates.fileType || null}, file_type),
            is_public = COALESCE(${updates.isPublic}, is_public),
            updated_at = NOW()
        WHERE id = ${resourceId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating resource:', error);
      throw error;
    }
  }

  async deleteResource(resourceId: number) {
    const sql = createDbConnection();
    try {
      await sql`DELETE FROM resources WHERE id = ${resourceId}`;
      await sql.end();
    } catch (error) {
      console.error('Database error deleting resource:', error);
      throw error;
    }
  }

  async updateQuiz(quizId: number, updates: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE quizzes 
        SET title = COALESCE(${updates.title || null}, title),
            description = COALESCE(${updates.description || null}, description),
            questions = COALESCE(${updates.questions ? JSON.stringify(updates.questions) : null}, questions),
            passing_score = COALESCE(${updates.passingScore || null}, passing_score),
            time_limit = COALESCE(${updates.timeLimit || null}, time_limit),
            order_index = COALESCE(${updates.order || null}, order_index),
            updated_at = NOW()
        WHERE id = ${quizId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating quiz:', error);
      throw error;
    }
  }

  async updateResource(resourceId: number, updates: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE resources 
        SET title = COALESCE(${updates.title || null}, title),
            description = COALESCE(${updates.description || null}, description),
            file_type = COALESCE(${updates.fileType || null}, file_type),
            file_url = COALESCE(${updates.fileUrl || null}, file_url),
            file_size = COALESCE(${updates.fileSize || null}, file_size),
            is_public = COALESCE(${updates.isPublic}, is_public)
        WHERE id = ${resourceId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating resource:', error);
      throw error;
    }
  }

  async getAnalytics() {
    const sql = createDbConnection();
    try {
      const totalStudentsResult = await sql`SELECT COUNT(*) as count FROM users`;
      const activeCoursesResult = await sql`SELECT COUNT(*) as count FROM courses WHERE is_active = true`;
      const totalEnrollmentsResult = await sql`SELECT COUNT(*) as count FROM enrollments`;
      const avgCompletionResult = await sql`SELECT AVG(progress_percentage) as avg FROM enrollments WHERE progress_percentage > 0`;

      await sql.end();

      return {
        totalStudents: parseInt(totalStudentsResult[0].count),
        activeCourses: parseInt(activeCoursesResult[0].count),
        totalEnrollments: parseInt(totalEnrollmentsResult[0].count),
        avgCompletionRate: Math.round(parseFloat(avgCompletionResult[0].avg) || 0),
      };
    } catch (error) {
      console.error('Database error getting analytics:', error);
      throw error;
    }
  }

  async getUser(walletAddress: string) {
    const sql = createDbConnection();
    try {
      const result = await sql`SELECT * FROM users WHERE wallet_address = ${walletAddress.toLowerCase()}`;
      await sql.end();
      return result[0] || null;
    } catch (error) {
      console.error('Database error getting user:', error);
      throw error;
    }
  }

  async createUser(userData: any) {
    const sql = createDbConnection();
    try {
      // First check what columns exist in the users table
      const result = await sql`
        INSERT INTO users (wallet_address, email, display_name, is_admin, is_instructor) 
        VALUES (
          ${userData.walletAddress?.toLowerCase()}, 
          ${userData.email || null}, 
          ${userData.displayName || userData.walletAddress?.slice(-8) || 'User'}, 
          ${userData.isAdmin || false}, 
          ${userData.isInstructor || false}
        ) RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating user:', error);
      throw error;
    }
  }

  async updateUserTokens(userId: string, tokenBalances: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE users 
        SET token_balances = ${JSON.stringify(tokenBalances)}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating user tokens:', error);
      throw error;
    }
  }

  async updateCourse(courseId: string, updates: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        UPDATE courses 
        SET title = COALESCE(${updates.title}, title),
            description = COALESCE(${updates.description}, description),
            category = COALESCE(${updates.category}, category),
            difficulty = COALESCE(${updates.difficulty}, difficulty),
            duration = COALESCE(${updates.duration}, duration),
            instructor_name = COALESCE(${updates.instructorName}, instructor_name),
            token_requirement = COALESCE(${updates.tokenRequirement ? JSON.stringify(updates.tokenRequirement) : null}, token_requirement),
            is_active = COALESCE(${updates.isActive}, is_active),
            lesson_count = COALESCE(${updates.lessonCount}, lesson_count),
            assignment_count = COALESCE(${updates.assignmentCount}, assignment_count),
            updated_at = NOW()
        WHERE id = ${courseId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating course:', error);
      throw error;
    }
  }

  async getLiveSessions() {
    const sql = createDbConnection();
    try {
      // Fix column name - it's scheduled_at not scheduled_for
      const result = await sql`SELECT * FROM live_sessions ORDER BY scheduled_at ASC`;
      await sql.end();
      return result;
    } catch (error) {
      console.error('Database error getting live sessions:', error);
      throw error;
    }
  }

  async getUserEnrollments(walletAddress: string) {
    const sql = createDbConnection();
    try {
      // First get the user ID from wallet address
      const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${walletAddress.toLowerCase()}`;
      if (userResult.length === 0) {
        await sql.end();
        return [];
      }
      
      const userId = userResult[0].id;
      const result = await sql`SELECT * FROM enrollments WHERE user_id = ${userId}`;
      await sql.end();
      return result;
    } catch (error) {
      console.error('Database error getting enrollments:', error);
      throw error;
    }
  }

  async createEnrollment(enrollmentData: any) {
    const sql = createDbConnection();
    try {
      // Convert wallet address to user ID if needed
      let userId = enrollmentData.userId;
      if (typeof userId === 'string' && userId.startsWith('0x')) {
        let userResult = await sql`SELECT id FROM users WHERE wallet_address = ${userId.toLowerCase()}`;
        if (userResult.length === 0) {
          // Create user if they don't exist
          console.log(`Creating new user for wallet: ${userId}`);
          const newUserResult = await sql`
            INSERT INTO users (wallet_address, display_name, email)
            VALUES (${userId.toLowerCase()}, ${`User ${userId.slice(-6)}`}, ${`${userId.slice(-6)}@example.com`})
            RETURNING id
          `;
          userId = newUserResult[0].id;
        } else {
          userId = userResult[0].id;
        }
      }
      
      const result = await sql`
        INSERT INTO enrollments (user_id, course_id, progress_percentage)
        VALUES (${userId}, ${enrollmentData.courseId}, ${enrollmentData.progress || 0})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating enrollment:', error);
      throw error;
    }
  }

  async checkEnrollment(userId: string, courseId: string) {
    const sql = createDbConnection();
    try {
      // Handle wallet address conversion if needed
      let actualUserId = userId;
      if (typeof userId === 'string' && userId.startsWith('0x')) {
        const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${userId.toLowerCase()}`;
        if (userResult.length === 0) {
          await sql.end();
          return null;
        }
        actualUserId = userResult[0].id;
      }
      
      const result = await sql`SELECT * FROM enrollments WHERE user_id = ${actualUserId} AND course_id = ${courseId}`;
      await sql.end();
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Database error checking enrollment:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: any) {
    const sql = createDbConnection();
    try {
      let actualUserId = userId;
      if (typeof userId === 'string' && userId.startsWith('0x')) {
        const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${userId.toLowerCase()}`;
        if (userResult.length === 0) {
          throw new Error('User not found');
        }
        actualUserId = userResult[0].id;
      }

      const result = await sql`
        UPDATE users 
        SET display_name = COALESCE(${updates.displayName}, display_name),
            email = COALESCE(${updates.email}, email),
            updated_at = NOW()
        WHERE id = ${actualUserId}
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating user:', error);
      throw error;
    }
  }

  async getInstructors() {
    const sql = createDbConnection();
    try {
      const result = await sql`
        SELECT id, display_name as "displayName", email, wallet_address as "walletAddress"
        FROM users 
        WHERE is_instructor = true OR is_admin = true
        ORDER BY display_name
      `;
      await sql.end();
      return result;
    } catch (error) {
      console.error('Database error fetching instructors:', error);
      throw error;
    }
  }

  async getCourse(courseId: number) {
    const sql = createDbConnection();
    try {
      const result = await sql`SELECT * FROM courses WHERE id = ${courseId}`;
      await sql.end();
      if (result.length === 0) {
        return null;
      }
      
      // Transform the result to match the expected format
      const course = result[0];
      return {
        ...course,
        tokenRequirement: typeof course.token_requirement === 'string' 
          ? JSON.parse(course.token_requirement) 
          : course.token_requirement,
        instructorName: course.instructor_name,
        isActive: course.is_active,
        lessonCount: course.lesson_count,
        assignmentCount: course.assignment_count,
        createdAt: course.created_at,
        updatedAt: course.updated_at
      };
    } catch (error) {
      console.error('Database error getting course:', error);
      throw error;
    }
  }

  // Forum methods
  async createForumPost(postData: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        INSERT INTO forums (course_id, user_id, title, content, category)
        VALUES (${postData.courseId}, ${postData.userId}, ${postData.title}, ${postData.content}, ${postData.category || 'Discussion'})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating forum post:', error);
      throw error;
    }
  }

  async createForumReply(replyData: any) {
    const sql = createDbConnection();
    try {
      // Create the reply
      const replyResult = await sql`
        INSERT INTO forum_replies (forum_id, user_id, content)
        VALUES (${replyData.forumId}, ${replyData.userId}, ${replyData.content})
        RETURNING *
      `;
      
      // Update the forum post reply count
      await sql`
        UPDATE forums 
        SET replies = replies + 1, last_reply_at = NOW()
        WHERE id = ${replyData.forumId}
      `;
      
      await sql.end();
      return replyResult[0];
    } catch (error) {
      console.error('Database error creating forum reply:', error);
      throw error;
    }
  }

  async getForumReplies(forumId: string) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        SELECT fr.*, u.display_name as user_display_name
        FROM forum_replies fr
        LEFT JOIN users u ON fr.user_id::text = u.id::text
        WHERE fr.forum_id = ${forumId}
        ORDER BY fr.created_at ASC
      `;
      await sql.end();
      return result;
    } catch (error) {
      console.error('Database error fetching forum replies:', error);
      throw error;
    }
  }

  // Lesson progress methods
  async getLessonProgress(userId: string, courseId: number) {
    const sql = createDbConnection();
    try {
      // Convert wallet address to user ID if needed
      let actualUserId = userId;
      if (typeof userId === 'string' && userId.startsWith('0x')) {
        const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${userId.toLowerCase()}`;
        if (userResult.length === 0) {
          await sql.end();
          return [];
        }
        actualUserId = userResult[0].id;
      }

      const result = await sql`
        SELECT lp.*, l.title as lesson_title
        FROM lesson_progress lp
        JOIN lessons l ON lp.lesson_id::text = l.id::text
        WHERE lp.user_id::text = ${actualUserId} AND l.course_id = ${courseId}
        ORDER BY l.order_index ASC
      `;
      await sql.end();
      return result;
    } catch (error) {
      console.error('Database error fetching lesson progress:', error);
      return [];
    }
  }

  async updateLessonProgress(lessonId: number, progressData: any) {
    const sql = createDbConnection();
    try {
      // Convert wallet address to user ID if needed
      let actualUserId = progressData.userId;
      if (typeof progressData.userId === 'string' && progressData.userId.startsWith('0x')) {
        const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${progressData.userId.toLowerCase()}`;
        if (userResult.length === 0) {
          throw new Error('User not found');
        }
        actualUserId = userResult[0].id;
      }

      // Check if progress record exists
      const existingProgress = await sql`
        SELECT * FROM lesson_progress 
        WHERE lesson_id = ${lessonId} AND user_id::text = ${actualUserId}
      `;

      let result;
      if (existingProgress.length > 0) {
        // Update existing progress
        result = await sql`
          UPDATE lesson_progress 
          SET is_completed = COALESCE(${progressData.isCompleted}, is_completed),
              watch_time = COALESCE(${progressData.watchTime}, watch_time),
              completed_at = COALESCE(${progressData.completedAt ? new Date(progressData.completedAt) : null}, completed_at),
              last_accessed_at = COALESCE(${progressData.lastAccessedAt ? new Date(progressData.lastAccessedAt) : null}, last_accessed_at)
          WHERE lesson_id = ${lessonId} AND user_id::text = ${actualUserId}
          RETURNING *
        `;
      } else {
        // Create new progress record
        result = await sql`
          INSERT INTO lesson_progress (lesson_id, user_id, is_completed, watch_time, completed_at, last_accessed_at)
          VALUES (${lessonId}, ${actualUserId}, ${progressData.isCompleted || false}, ${progressData.watchTime || 0}, 
                  ${progressData.completedAt ? new Date(progressData.completedAt) : null}, 
                  ${progressData.lastAccessedAt ? new Date(progressData.lastAccessedAt) : new Date()})
          RETURNING *
        `;
      }

      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error updating lesson progress:', error);
      throw error;
    }
  }
}