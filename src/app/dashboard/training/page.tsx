'use client';

import { useState, useEffect } from 'react';
import { useSession, getCachedData, setCachedData } from '../session-provider';
import { BookOpen, Award, Plus, UserPlus, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

const categories = ['All', 'Technical', 'Compliance', 'Soft Skills', 'Leadership', 'Other'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

function markdownToHtml(raw: string) {
  if (!raw) return '';
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;

  lines.forEach((line) => {
    if (/^###\s+/.test(line)) {
      html += `<h3>${line.replace(/^###\s+/, '')}</h3>`;
    } else if (/^##\s+/.test(line)) {
      html += `<h2>${line.replace(/^##\s+/, '')}</h2>`;
    } else if (/^#\s+/.test(line)) {
      html += `<h1>${line.replace(/^#\s+/, '')}</h1>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        if (inUl) {
          html += '</ul>';
          inUl = false;
        }
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
    } else if (/^-\s+/.test(line)) {
      if (!inUl) {
        if (inOl) {
          html += '</ol>';
          inOl = false;
        }
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${line.replace(/^-\s+/, '')}</li>`;
    } else if (!line.trim()) {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      html += '<br/>';
    } else {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
      html += `<p>${line}</p>`;
    }
  });

  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';

  return html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function downloadCertificate(certificate: any) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Workforcely Certificate of Completion</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Montserrat:wght@400;600;700&display=swap');
  
  body {
    margin: 0;
    padding: 20px;
    background-color: #f1f5f9;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    font-family: 'Montserrat', sans-serif;
  }
  
  .certificate-container {
    width: 842px;
    height: 595px;
    background: #ffffff;
    padding: 30px;
    box-sizing: border-box;
    position: relative;
    border: 15px solid #0f172a;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background-image: 
      radial-gradient(circle at 100% 150%, #fef08a 24%, #ffffff 25%),
      radial-gradient(circle at 0% -50%, #dbeafe 24%, #ffffff 25%);
  }
  
  .inner-border {
    border: 2px solid #e2e8f0;
    width: 100%;
    height: 100%;
    padding: 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-org {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #475569;
    text-transform: uppercase;
    margin-top: 10px;
  }
  
  .title {
    font-family: 'Cinzel', serif;
    font-size: 38px;
    font-weight: 800;
    color: #0f172a;
    margin: 15px 0 5px 0;
    letter-spacing: 2px;
    text-align: center;
  }
  
  .subtitle {
    font-size: 14px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 20px;
  }
  
  .recipient-name {
    font-family: 'Cinzel', serif;
    font-size: 32px;
    font-weight: 700;
    color: #3b82f6;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
    min-width: 350px;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .course-intro {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 5px;
  }
  
  .course-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    text-align: center;
    max-width: 600px;
    margin-bottom: 25px;
  }
  
  .meta-grid {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 40px;
    box-sizing: border-box;
    align-items: flex-end;
  }
  
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 150px;
  }
  
  .meta-value {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    width: 100%;
    text-align: center;
    margin-bottom: 4px;
  }
  
  .meta-label {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .signature-line {
    font-family: 'Cinzel', serif;
    font-style: italic;
    font-size: 16px;
    color: #0f172a;
  }
  
  .seal {
    width: 70px;
    height: 70px;
    position: relative;
  }
  
  @media print {
    body {
      background: none;
      padding: 0;
    }
    .certificate-container {
      box-shadow: none;
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
  <div class="certificate-container">
    <div class="inner-border">
      <div class="header-org">WORKFORCELY</div>
      
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">This certifies that</div>
        
        <div class="recipient-name">${certificate.employeeName}</div>
        
        <div class="course-intro">has successfully completed the training course</div>
        <div class="course-title">${certificate.courseName}</div>
      </div>
      
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-value">${certificate.issueDate}</div>
          <div class="meta-label">Date Issued</div>
        </div>
        
        <div class="meta-item" style="align-self: center;">
          <div class="seal">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <circle cx="50" cy="50" r="45" fill="#fef08a" stroke="#ca8a04" stroke-width="2" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#ca8a04" stroke-width="1" stroke-dasharray="3, 3" />
              <path d="M50,15 L58,38 L82,38 L62,52 L70,75 L50,60 L30,75 L38,52 L18,38 L42,38 Z" fill="#ca8a04" />
            </svg>
          </div>
        </div>
        
        <div class="meta-item">
          <div class="meta-value signature-line" style="font-family: 'Cinzel', serif;">Olumide Sowore</div>
          <div class="meta-label">HR Executive Director</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${certificate.courseName.replace(/\s+/g, '_')}_certificate.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function TrainingPage() {
  const { user, refreshFlag, triggerRefresh } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrollForm, setEnrollForm] = useState({ employeeId: '', courseId: '' });
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [courseBuilder, setCourseBuilder] = useState({ title: '', description: '', category: 'Technical', difficulty: 'Beginner', duration: '', thumbnail: '', provider: '', link: '', external: false });
  const [builderModules, setBuilderModules] = useState<any[]>([]);
  const [builderModuleForm, setBuilderModuleForm] = useState({ title: '', content: '', duration: '', videoUrl: '' });
  const [builderQuiz, setBuilderQuiz] = useState({ title: 'Course Quiz', passMark: 70, maxAttempts: 3, questions: [] as any[] });
  const [quizQuestionForm, setQuizQuestionForm] = useState({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
  const [builderMessage, setBuilderMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [activeEnrollmentId, setActiveEnrollmentId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizError, setQuizError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const cached = getCachedData('/api/training-dashboard');
      if (cached) {
        setData(cached);
        setLoading(false);
      }
      try {
        if (!cached) {
          setLoading(true);
        }
        const [empRes, trainRes] = await Promise.all([fetch('/api/employees'), fetch('/api/training')]);
        const empData = await empRes.json();
        const trainData = await trainRes.json();
        const result = { employees: empData.employees, departments: empData.departments, courses: trainData.courses, enrollments: trainData.enrollments };
        setData(result);
        setCachedData('/api/training-dashboard', result);
        if (empData.employees.length > 0 && trainData.courses.length > 0) {
          setEnrollForm({ employeeId: empData.employees[0].id, courseId: trainData.courses[0].id });
        }
      } catch (err) {
        console.error('Failed to load training details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshFlag]);

  const resetBuilder = () => {
    setCourseBuilder({ title: '', description: '', category: 'Technical', difficulty: 'Beginner', duration: '', thumbnail: '', provider: '', link: '', external: false });
    setBuilderModules([]);
    setBuilderModuleForm({ title: '', content: '', duration: '', videoUrl: '' });
    setBuilderQuiz({ title: 'Course Quiz', passMark: 70, maxAttempts: 3, questions: [] });
    setQuizQuestionForm({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
    setBuilderMessage(null);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollSuccess(null);
    setEnrollError(null);

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enroll', employeeId: enrollForm.employeeId, courseId: enrollForm.courseId })
      });
      const result = await res.json();
      if (result.success) {
        setEnrollSuccess('Employee enrolled successfully.');
        triggerRefresh();
      } else {
        setEnrollError(result.error || 'Failed to enroll employee.');
      }
    } catch (err) {
      setEnrollError('Network error, please try again.');
    }
  };

  const handleAddModule = () => {
    if (!builderModuleForm.title || !builderModuleForm.duration) {
      setBuilderMessage('Module title and duration are required.');
      return;
    }
    setBuilderModules(prev => [...prev, { ...builderModuleForm, id: `mod-${Date.now()}` }]);
    setBuilderModuleForm({ title: '', content: '', duration: '', videoUrl: '' });
    setBuilderMessage(null);
  };

  const handleRemoveModule = (id: string) => {
    setBuilderModules(prev => prev.filter((module) => module.id !== id));
  };

  const handleAddQuizQuestion = () => {
    if (!quizQuestionForm.question || !quizQuestionForm.correctAnswer) {
      setBuilderMessage('Question text and correct answer are required.');
      return;
    }
    const options = quizQuestionForm.type === 'multiple-choice'
      ? quizQuestionForm.options.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    if (quizQuestionForm.type === 'multiple-choice' && (!options || options.length < 2)) {
      setBuilderMessage('Multiple choice questions require at least two answer options.');
      return;
    }

    setBuilderQuiz(prev => ({ ...prev, questions: [...prev.questions, { id: `q-${Date.now()}`, type: quizQuestionForm.type, question: quizQuestionForm.question, options, correctAnswer: quizQuestionForm.correctAnswer }] }));
    setQuizQuestionForm({ type: 'multiple-choice', question: '', options: '', correctAnswer: '' });
    setBuilderMessage(null);
  };

  const handleRemoveQuizQuestion = (id: string) => {
    setBuilderQuiz(prev => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderMessage(null);
    if (courseBuilder.external) {
      if (!courseBuilder.title || !courseBuilder.description || !courseBuilder.duration || !courseBuilder.provider || !courseBuilder.link) {
        setBuilderMessage('Course title, description, duration, provider, and link are required for external courses.');
        return;
      }
    } else {
      if (!courseBuilder.title || !courseBuilder.description || !courseBuilder.duration) {
        setBuilderMessage('Course title, description, and duration are required.');
        return;
      }
    }

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCourse',
          course: {
            ...courseBuilder,
            modules: courseBuilder.external ? [] : builderModules,
            quiz: (!courseBuilder.external && builderQuiz.questions.length > 0) ? builderQuiz : undefined
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        setBuilderMessage('Course created successfully.');
        resetBuilder();
        triggerRefresh();
      } else {
        setBuilderMessage(result.error || 'Failed to create course.');
      }
    } catch (err) {
      setBuilderMessage('Network error, please try again.');
    }
  };

  const handleStartTraining = async (enrollmentId: string) => {
    setSimulatingId(enrollmentId);
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startTraining', enrollmentId })
      });
      const result = await res.json();
      if (result.success) {
        setActiveEnrollmentId(enrollmentId);
        setQuizAnswers({});
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to start training', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleCompleteLesson = async (enrollmentId: string, moduleId: string) => {
    setSimulatingId(enrollmentId);
    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeLesson', enrollmentId, moduleId })
      });
      const result = await res.json();
      if (result.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleSubmitQuiz = async (enrollmentId: string, quiz: any) => {
    setQuizError(null);
    const missingAnswers = quiz.questions.some((question: any) => !quizAnswers[question.id]);
    if (missingAnswers) {
      setQuizError('Please answer every quiz question before submitting.');
      return;
    }

    try {
      const res = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submitQuiz', enrollmentId, answers: quizAnswers })
      });
      const result = await res.json();
      if (!result.success) {
        setQuizError(result.error || 'Quiz submission failed.');
      } else {
        setQuizError(null);
        triggerRefresh();
      }
    } catch (err) {
      setQuizError('Network error, please try again.');
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)' }}>
        Loading training LMS...
      </div>
    );
  }

  const { employees, courses, enrollments } = data;
  const isAdmin = user?.role === 'HR Admin';
  const myEnrollments = enrollments.filter((e: any) => e.employeeId === user?.id).map((e: any) => ({ ...e, course: courses.find((c: any) => c.id === e.courseId) }));
  const availableCourses = courses.filter((course: any) => !enrollments.some((enrollment: any) => enrollment.courseId === course.id && enrollment.employeeId === user?.id));
  const filteredCourses = availableCourses.filter((course: any) => (filterCategory === 'All' || course.category === filterCategory) && (filterDifficulty === 'All' || course.difficulty === filterDifficulty));
  const totalEnrollments = enrollments.length;
  const completedCount = enrollments.filter((e: any) => e.status === 'Completed').length;
  const completionRate = totalEnrollments ? Math.round((completedCount / totalEnrollments) * 100) : 0;
  const quizScores = enrollments.filter((e: any) => e.quizScore !== undefined).map((e: any) => e.quizScore);
  const averageQuizScore = quizScores.length ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length) : 0;
  const stopPoints = enrollments.filter((e: any) => e.status !== 'Completed').reduce((memo: Record<string, number>, enrollment: any) => {
    const course = courses.find((c: any) => c.id === enrollment.courseId);
    const stopLesson = course?.modules?.[enrollment.completedLessons?.length ?? 0]?.title || (course?.quiz ? 'Quiz' : 'Start');
    memo[stopLesson] = (memo[stopLesson] || 0) + 1;
    return memo;
  }, {} as Record<string, number>);
  const dropOffPoint = Object.entries(stopPoints as Record<string, number>).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const totalCourses = courses.length;
  const enrolledCount = enrollments.length;

  return (
    <div className="page-container">
      {isAdmin ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            <div className="table-card">
              <div className="table-header-area">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={18} color="var(--primary)" />
                  <h2 className="chart-title">Training LMS Overview</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', padding: '20px' }}>
                <div className="metric-card"><strong>{totalCourses}</strong><p>Courses Available</p></div>
                <div className="metric-card"><strong>{enrolledCount}</strong><p>Total Enrollments</p></div>
                <div className="metric-card"><strong>{completionRate}%</strong><p>Completion Rate</p></div>
                <div className="metric-card"><strong>{averageQuizScore}%</strong><p>Average Quiz Score</p></div>
                <div className="metric-card" style={{ gridColumn: 'span 2' }}><strong>{dropOffPoint}</strong><p>Most Common Drop-off Point</p></div>
              </div>
            </div>

            <div className="card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Plus size={18} color="var(--primary)" />Create a New Course</h3>
              {builderMessage && <div style={{ color: 'var(--text)', backgroundColor: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '12px' }}>{builderMessage}</div>}
              <form onSubmit={handleCreateCourse} style={{ display: 'grid', gap: '16px' }}>
                <div className="form-group"><label className="form-label">Course Title</label><input className="form-control" value={courseBuilder.title} onChange={(e) => setCourseBuilder(prev => ({ ...prev, title: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={courseBuilder.description} onChange={(e) => setCourseBuilder(prev => ({ ...prev, description: e.target.value }))} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group"><label className="form-label">Category</label><select className="form-control" value={courseBuilder.category} onChange={(e) => setCourseBuilder(prev => ({ ...prev, category: e.target.value }))}>{categories.filter((c) => c !== 'All').map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Difficulty</label><select className="form-control" value={courseBuilder.difficulty} onChange={(e) => setCourseBuilder(prev => ({ ...prev, difficulty: e.target.value }))}>{difficulties.filter((d) => d !== 'All').map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}</select></div>
                </div>
                <div className="form-group"><label className="form-label">Estimated Duration</label><input className="form-control" value={courseBuilder.duration} onChange={(e) => setCourseBuilder(prev => ({ ...prev, duration: e.target.value }))} placeholder="e.g. 3 hours" /></div>
                <div className="form-group"><label className="form-label">Thumbnail URL</label><input className="form-control" value={courseBuilder.thumbnail} onChange={(e) => setCourseBuilder(prev => ({ ...prev, thumbnail: e.target.value }))} placeholder="Paste image URL" /></div>

                {/* External Course Toggle */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <input
                    type="checkbox"
                    id="external-toggle"
                    checked={courseBuilder.external}
                    onChange={(e) => setCourseBuilder(prev => ({ ...prev, external: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="external-toggle" style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                    External Course (e.g. Udemy, Coursera)
                  </label>
                </div>

                {courseBuilder.external ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Provider Name</label>
                      <input
                        className="form-control"
                        placeholder="e.g. Udemy, Coursera"
                        value={courseBuilder.provider}
                        onChange={(e) => setCourseBuilder(prev => ({ ...prev, provider: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Course Link / URL</label>
                      <input
                        className="form-control"
                        placeholder="e.g. https://www.udemy.com/course/..."
                        value={courseBuilder.link}
                        onChange={(e) => setCourseBuilder(prev => ({ ...prev, link: e.target.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Course Lessons</strong><button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px' }} onClick={handleAddModule}>Add Lesson</button></div>
                      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                        <input className="form-control" placeholder="Lesson title" value={builderModuleForm.title} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, title: e.target.value }))} />
                        <input className="form-control" placeholder="Lesson duration" value={builderModuleForm.duration} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, duration: e.target.value }))} />
                        <textarea className="form-control" rows={3} placeholder="Lesson content (supports markdown)" value={builderModuleForm.content} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, content: e.target.value }))} />
                        <input className="form-control" placeholder="Optional YouTube embed URL" value={builderModuleForm.videoUrl} onChange={(e) => setBuilderModuleForm(prev => ({ ...prev, videoUrl: e.target.value }))} />
                      </div>
                      {builderModules.length > 0 && (<div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>{builderModules.map((module) => (<div key={module.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}><div><div style={{ fontWeight: 700 }}>{module.title}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{module.duration}</div></div><button type="button" className="btn-secondary" onClick={() => handleRemoveModule(module.id)}>Remove</button></div>))}</div>)}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong>Course Quiz (optional)</strong><button type="button" className="btn-secondary" style={{ fontSize: '12px', padding: '8px 10px' }} onClick={handleAddQuizQuestion}>Add Question</button></div>
                      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                        <input className="form-control" placeholder="Question text" value={quizQuestionForm.question} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, question: e.target.value }))} />
                        <select className="form-control" value={quizQuestionForm.type} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, type: e.target.value }))}>
                          <option value="multiple-choice">Multiple Choice</option>
                          <option value="true-false">True / False</option>
                        </select>
                        {quizQuestionForm.type === 'multiple-choice' && (<input className="form-control" placeholder="Options, comma separated" value={quizQuestionForm.options} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, options: e.target.value }))} />)}
                        <input className="form-control" placeholder="Correct answer" value={quizQuestionForm.correctAnswer} onChange={(e) => setQuizQuestionForm(prev => ({ ...prev, correctAnswer: e.target.value }))} />
                      </div>
                      {builderQuiz.questions.length > 0 && (<div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>{builderQuiz.questions.map((question) => (<div key={question.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', backgroundColor: 'var(--bg-primary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}><div><div style={{ fontWeight: 700 }}>{question.question}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{question.type === 'true-false' ? 'True / False' : 'Multiple choice'}</div></div><button type="button" className="btn-secondary" onClick={() => handleRemoveQuizQuestion(question.id)}>Remove</button></div>))}</div>)}
                      <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                        <div className="form-group"><label className="form-label">Quiz Pass Mark</label><input className="form-control" type="number" min={0} max={100} value={builderQuiz.passMark} onChange={(e) => setBuilderQuiz(prev => ({ ...prev, passMark: Number(e.target.value) }))} /></div>
                        <div className="form-group"><label className="form-label">Max Retake Attempts</label><input className="form-control" type="number" min={1} value={builderQuiz.maxAttempts} onChange={(e) => setBuilderQuiz(prev => ({ ...prev, maxAttempts: Number(e.target.value) }))} /></div>
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Publish Course
                </button>
              </form>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header-area"><h3 className="chart-title">Course Catalog & Employee Training Summary</h3></div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Lessons</th><th>Quiz</th></tr></thead>
                <tbody>{courses.map((course: any) => (<tr key={course.id}><td><strong>{course.title}</strong><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{course.description}</div></td><td>{course.category || 'Other'}</td><td>{course.difficulty || 'Beginner'}</td><td>{course.modules?.length ?? 0}</td><td>{course.quiz ? 'Yes' : 'No'}</td></tr>))}</tbody>
              </table>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header-area"><h3 className="chart-title">Per Employee Training Status</h3></div>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead><tr><th>Employee</th><th>Course</th><th>Status</th><th>Progress</th><th>Quiz Score</th><th>Certificate</th></tr></thead>
                <tbody>{enrollments.map((enrollment: any) => {
                  const employee = employees.find((emp: any) => emp.id === enrollment.employeeId);
                  const course = courses.find((course: any) => course.id === enrollment.courseId);
                  return (<tr key={enrollment.id}><td>{employee?.name || 'Unknown'}</td><td>{course?.title || 'Unknown Course'}</td><td>{enrollment.status}</td><td>{enrollment.progress}%</td><td>{enrollment.quizScore !== undefined ? `${enrollment.quizScore}%` : 'N/A'}</td><td>{enrollment.certificate ? 'Issued' : 'Pending'}</td></tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div>
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18} color="var(--primary)" />Available Training Courses</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Browse the course catalog, filter by category and difficulty, then enroll in any course to begin learning.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
              <select className="form-control" style={{ width: '220px' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>{categories.map((category) => (<option key={category} value={category}>{category}</option>))}</select>
              <select className="form-control" style={{ width: '220px' }} value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>{difficulties.map((difficulty) => (<option key={difficulty} value={difficulty}>{difficulty}</option>))}</select>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
              {filteredCourses.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No matching courses available.</div>
              ) : (
                filteredCourses.map((course: any) => (
                  <div key={course.id} style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: course.external ? '1px solid var(--primary-light)' : '1px solid var(--border-color)',
                    boxShadow: course.external ? '0 0 12px var(--primary-light)' : 'none',
                    borderRadius: 'var(--radius-lg)',
                    display: 'grid',
                    gap: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0 }}>{course.title}</h4>
                          <span className="badge badge-applied" style={{ fontSize: '11px' }}>{course.category}</span>
                          {course.external && (
                            <span className="badge badge-inprogress" style={{ fontSize: '11px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                              External • {course.provider}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{course.description}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Difficulty: {course.difficulty}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration: {course.duration}</span>
                        <button className="btn-primary" onClick={async () => {
                          if (!user) return;
                          const res = await fetch('/api/training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enroll', employeeId: user.id, courseId: course.id }) });
                          const result = await res.json();
                          if (result.success) {
                            triggerRefresh();
                          } else {
                            setActionMessage(result.error || 'Unable to enroll.');
                          }
                        }} style={{ justifyContent: 'center', minWidth: '180px' }}>
                          {course.external ? `Enroll Externally (${course.provider})` : 'Enroll in Course'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {actionMessage && <div style={{ color: 'var(--success)', fontSize: '13px', marginTop: '12px' }}>{actionMessage}</div>}
          </div>

          <div className="card">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={18} color="var(--primary)" />Your Enrolled Courses</h3>
            {myEnrollments.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>You have no active enrollments yet. Enroll in a course from the catalog above.</div>
            ) : (
              <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                {myEnrollments.map((enr: any) => {
                  const course = enr.course;
                  const isActive = activeEnrollmentId === enr.id;
                  const completedLessons = enr.completedLessons || [];
                  const quizReady = course?.quiz && course.modules?.length === completedLessons.length;
                  return (
                    <div
                      key={enr.id}
                      onClick={() => {
                        if (enr.status === 'Enrolled') {
                          fetch('/api/training', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'startTraining', enrollmentId: enr.id })
                          }).then(() => triggerRefresh());
                        }
                        router.push(`/dashboard/training/course/${enr.id}`);
                      }}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        display: 'grid',
                        gap: '16px',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      className="hover-card-raise"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{course?.title}</h4>
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{course?.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${enr.status === 'Completed' ? 'badge-completed' : enr.status === 'In Progress' ? 'badge-inprogress' : 'badge-absent'}`}>{enr.status}</span>
                          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>Progress: {enr.progress}%</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                        {enr.status !== 'Completed' ? (
                          <button
                            className="btn-primary"
                            onClick={() => {
                              if (enr.status === 'Enrolled') {
                                fetch('/api/training', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'startTraining', enrollmentId: enr.id })
                                }).then(() => triggerRefresh());
                              }
                              router.push(`/dashboard/training/course/${enr.id}`);
                            }}
                          >
                            <Play size={12} fill="#fff" /> {enr.status === 'Enrolled' ? 'Start Course' : 'Resume Course'}
                          </button>
                        ) : (
                          enr.certificate && (
                            <button
                              className="btn-primary"
                              onClick={() => {
                                downloadCertificate(enr.certificate);
                              }}
                            >
                              Download Certificate
                            </button>
                          )
                        )}
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            router.push(`/dashboard/training/course/${enr.id}`);
                          }}
                        >
                          Open Course Page
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
