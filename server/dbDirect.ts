import postgres from "postgres";

// Working Supabase connection configuration
const connectionConfig = {
  host: 'aws-0-us-west-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  username: 'postgres.rllawlhkzzcxmwdrmdku',
  password: 'OgSdWlCclGhWfZ3T',
  ssl: true,
};

export function createDbConnection() {
  return postgres({
    host: connectionConfig.host,
    port: connectionConfig.port,
    database: connectionConfig.database,
    username: connectionConfig.username,
    password: connectionConfig.password,
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });
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

  async createCourse(courseData: any) {
    const sql = createDbConnection();
    try {
      const result = await sql`
        INSERT INTO courses (title, description, category, difficulty, instructor_name, token_requirement, is_active)
        VALUES (${courseData.title}, ${courseData.description}, ${courseData.category}, ${courseData.difficulty}, ${courseData.instructorName}, ${JSON.stringify(courseData.tokenRequirement)}, ${courseData.isActive})
        RETURNING *
      `;
      await sql.end();
      return result[0];
    } catch (error) {
      console.error('Database error creating course:', error);
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
        const userResult = await sql`SELECT id FROM users WHERE wallet_address = ${userId.toLowerCase()}`;
        if (userResult.length === 0) {
          throw new Error('User not found');
        }
        userId = userResult[0].id;
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
      const result = await sql`SELECT * FROM enrollments WHERE user_id = ${userId} AND course_id = ${courseId}`;
      await sql.end();
      return result.length > 0;
    } catch (error) {
      console.error('Database error checking enrollment:', error);
      throw error;
    }
  }
}