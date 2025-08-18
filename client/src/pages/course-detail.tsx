import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { CourseManagement } from '@/components/CourseManagement';
import { StudentCourseView } from '@/components/StudentCourseView';
import { apiRequest } from '@/lib/queryClient';
import { useWallet } from '@/hooks/useWallet';
import type { Course } from '@shared/schema';

export default function CourseDetailPage() {
  const [match, params] = useRoute('/course/:id');
  const { user } = useWallet();
  
  const courseId = params?.id;

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => apiRequest(`/api/courses/${courseId}`),
    enabled: !!courseId,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment-check', user?.id, courseId],
    queryFn: () => apiRequest(`/api/enrollments/${user?.id}/${courseId}/check`),
    enabled: !!user?.id && !!courseId,
  });

  if (!match || !courseId) {
    return <div className="text-center p-8 text-black">Course not found</div>;
  }

  if (isLoading) {
    return <div className="text-center p-8 text-black">Loading course...</div>;
  }

  if (!course) {
    return <div className="text-center p-8 text-black">Course not found</div>;
  }

  // Determine user role
  const isInstructor = user?.isInstructor || user?.isAdmin;
  const isStudent = !isInstructor;

  // Show instructor management view if user is instructor/admin
  if (isInstructor) {
    return <CourseManagement course={course} userRole={user?.isAdmin ? 'admin' : 'instructor'} />;
  }

  // Show student view
  return (
    <StudentCourseView 
      course={course} 
      userId={user?.id?.toString() || ''} 
      enrollment={enrollment?.isEnrolled ? enrollment : undefined}
    />
  );
}