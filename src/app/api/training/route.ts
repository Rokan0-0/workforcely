import { NextRequest, NextResponse } from 'next/server';
import { db, TrainingCourse, TrainingEnrollment, TrainingQuiz } from '@/lib/db';

function evaluateQuiz(course: TrainingCourse, answers: Record<string, string>) {
  const quiz = course.quiz;
  if (!quiz) {
    return { score: 0, passed: false };
  }
  const correctCount = quiz.questions.reduce((count, question) => {
    const answer = answers[question.id];
    if (answer === question.correctAnswer) {
      return count + 1;
    }
    return count;
  }, 0);

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passMark;
  return { score, passed };
}

function buildCertificate(enrollment: TrainingEnrollment, course: TrainingCourse, employeeName: string) {
  return {
    issueDate: new Date().toISOString().split('T')[0],
    score: enrollment.quizScore ?? 0,
    employeeName,
    courseName: course.title,
    passMark: course.quiz?.passMark ?? 0
  };
}

export async function GET(request: NextRequest) {
  const courses = db.getTrainingCourses();
  const enrollments = db.getTrainingEnrollments();
  return NextResponse.json({ courses, enrollments });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, employeeId, courseId, enrollmentId, progress, moduleId, answers, course } = body;

    const courses = db.getTrainingCourses();
    const enrollments = db.getTrainingEnrollments();

    if (action === 'createCourse') {
      if (!course || !course.title || !course.description) {
        return NextResponse.json({ success: false, error: 'Course title and description are required' }, { status: 400 });
      }

      const newCourse: TrainingCourse = {
        id: `tr-${Date.now()}`,
        title: course.title,
        description: course.description,
        duration: course.duration || '2 hours',
        category: course.category || 'Other',
        difficulty: course.difficulty || 'Beginner',
        thumbnail: course.thumbnail || '',
        modules: course.modules || [],
        quiz: course.quiz || undefined,
        provider: course.provider || '',
        link: course.link || '',
        external: !!course.external
      };

      courses.push(newCourse);
      db.updateTrainingCourses(courses);

      return NextResponse.json({ success: true, course: newCourse });
    }

    if (action === 'enroll') {
      if (!employeeId || !courseId) {
        return NextResponse.json({ success: false, error: 'Employee ID and Course ID are required' }, { status: 400 });
      }
      const exists = enrollments.find(e => e.employeeId === employeeId && e.courseId === courseId);
      if (exists) {
        return NextResponse.json({ success: false, error: 'Employee already enrolled in this course' }, { status: 400 });
      }

      const newEnrollment: TrainingEnrollment = {
        id: `te-${Date.now()}`,
        courseId,
        employeeId,
        status: 'Enrolled',
        progress: 0,
        currentLessonIndex: 0,
        completedLessons: [],
        quizAttempts: 0,
        quizPassed: false
      };
      enrollments.push(newEnrollment);
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment: newEnrollment });
    }

    const enrollmentIndex = enrollmentId ? enrollments.findIndex(e => e.id === enrollmentId) : -1;
    if (enrollmentId && enrollmentIndex === -1) {
      return NextResponse.json({ success: false, error: 'Enrollment not found' }, { status: 404 });
    }

    if (action === 'startTraining') {
      if (!enrollmentId) {
        return NextResponse.json({ success: false, error: 'Enrollment ID is required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      if (enrollment.status === 'Enrolled') {
        enrollment.status = 'In Progress';
        enrollment.progress = Math.max(enrollment.progress, 5);
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    if (action === 'completeLesson') {
      if (!enrollmentId || !moduleId) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and module ID are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const courseItem = courses.find(c => c.id === enrollment.courseId);
      if (!courseItem) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      const moduleCount = courseItem.modules?.length ?? 0;
      if (!enrollment.completedLessons.includes(moduleId)) {
        enrollment.completedLessons.push(moduleId);
      }
      const completedCount = enrollment.completedLessons.length;
      enrollment.currentLessonIndex = Math.min(moduleCount, completedCount);
      enrollment.progress = moduleCount > 0 ? Math.round((completedCount / moduleCount) * 100) : 0;
      if (completedCount === moduleCount && !courseItem.quiz) {
        enrollment.status = 'Completed';
        enrollment.quizPassed = true;
      } else if (completedCount > 0) {
        enrollment.status = 'In Progress';
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    if (action === 'submitQuiz') {
      if (!enrollmentId || !answers) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and quiz answers are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const courseItem = courses.find(c => c.id === enrollment.courseId);
      if (!courseItem) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      if (!courseItem.quiz) {
        return NextResponse.json({ success: false, error: 'No quiz is attached to this course' }, { status: 400 });
      }
      if (enrollment.quizAttempts >= (courseItem.quiz.maxAttempts ?? 0)) {
        return NextResponse.json({ success: false, error: 'Maximum quiz attempts exceeded' }, { status: 400 });
      }
      const { score, passed } = evaluateQuiz(courseItem, answers);
      enrollment.quizAttempts = (enrollment.quizAttempts || 0) + 1;
      enrollment.quizScore = score;
      enrollment.quizPassed = passed;
      if (passed && (courseItem.modules?.length ?? 0) === enrollment.completedLessons.length) {
        enrollment.status = 'Completed';
        enrollment.certificate = buildCertificate(enrollment, courseItem, 'Employee');
      } else {
        enrollment.status = 'In Progress';
      }
      if (passed) {
        const employee = db.getEmployees().find(emp => emp.id === enrollment.employeeId);
        if (employee) {
          enrollment.certificate = buildCertificate(enrollment, courseItem, employee.name);
        }
      }
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment, score, passed });
    }

    if (action === 'updateProgress') {
      if (!enrollmentId || progress === undefined) {
        return NextResponse.json({ success: false, error: 'Enrollment ID and progress value are required' }, { status: 400 });
      }
      const enrollment = enrollments[enrollmentIndex];
      const prog = Math.min(100, Math.max(0, Number(progress)));
      enrollment.progress = prog;
      enrollment.status = prog === 100 ? 'Completed' : prog === 0 ? 'Enrolled' : 'In Progress';
      db.updateTrainingEnrollments(enrollments);
      return NextResponse.json({ success: true, enrollment });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
