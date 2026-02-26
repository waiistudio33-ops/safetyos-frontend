import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message, Row, Col, Progress, Result, Alert } from 'antd';
import { PlayCircleOutlined, FormOutlined, CheckCircleOutlined, BookOutlined, VideoCameraOutlined, ArrowLeftOutlined, TrophyOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "ข้อใดคืออุปกรณ์ป้องกันอันตรายส่วนบุคคล (PPE) พื้นฐานที่ต้องใส่ก่อนเข้าพื้นที่โรงงาน?",
    options: ["หมวกนิรภัย แว่นตา รองเท้าเซฟตี้", "เสื้อยืด กางเกงขาสั้น รองเท้าแตะ", "หมวกกันน็อค ถุงมือผ้า", "แว่นตากันแดด รองเท้าผ้าใบ"],
    correctAnswer: 0
  },
  {
    id: 2,
    question: "หากพบเห็นผู้บาดเจ็บจากไฟฟ้าช็อต สิ่งแรกที่ควรทำคืออะไร?",
    options: ["รีบวิ่งเข้าไปดึงตัวผู้บาดเจ็บออกมา", "โทรเรียกพยาบาลทันที", "ตัดกระแสไฟฟ้าที่แหล่งกำเนิดก่อน", "เอาน้ำสาดเพื่อดับไฟ"],
    correctAnswer: 2
  },
  {
    id: 3,
    question: "Permit to Work (PTW) ชนิดใดที่ใช้สำหรับงานที่มีประกายไฟ?",
    options: ["Cold Work Permit", "Hot Work Permit", "Confined Space Permit", "Excavation Permit"],
    correctAnswer: 1
  }
];

export default function ELearning({ currentUser }: { currentUser: any }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  const [step, setStep] = useState<'SELECT_COURSE' | 'WATCH_VIDEO' | 'TAKE_QUIZ' | 'RESULT'>('SELECT_COURSE');
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [scoreResult, setScoreResult] = useState<{score: number, passed: boolean} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('https://safetyos-backend.onrender.com/courses');
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลหลักสูตรได้');
    }
  };

  const handleStartCourse = (course: any) => {
    setSelectedCourse(course);
    setStep('WATCH_VIDEO');
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length < MOCK_QUESTIONS.length) {
      return message.warning('กรุณาทำแบบทดสอบให้ครบทุกข้อครับ');
    }

    setIsSubmitting(true);
    
    let correctCount = 0;
    MOCK_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correctCount++;
    });
    
    const finalScore = Math.round((correctCount / MOCK_QUESTIONS.length) * 100);

    try {
      const res = await fetch('https://safetyos-backend.onrender.com/training-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          course_id: selectedCourse.id,
          score: finalScore
        })
      });
      
      const data = await res.json();
      setScoreResult({ score: finalScore, passed: data.record.passed });
      setStep('RESULT');
      
    } catch (error) {
      message.error('บันทึกคะแนนไม่สำเร็จ');
    }
    setIsSubmitting(false);
  };

  const resetState = () => {
    setSelectedCourse(null);
    setStep('SELECT_COURSE');
    setAnswers({});
    setScoreResult(null);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url; 
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url; 
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="w-full pb-10">
      
      {/* Header หลัก (จะซ่อนเมื่อเข้าสู่หน้าดูวิดีโอหรือสอบ เพื่อประหยัดพื้นที่) */}
      {step === 'SELECT_COURSE' && (
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-blue-600 p-3 md:p-4 rounded-2xl shadow-sm text-white">
            <BookOutlined className="text-2xl md:text-3xl" />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">ระบบอบรมความปลอดภัย</h2>
            <p className="text-slate-500 text-xs md:text-sm m-0 mt-1">E-Learning & Examination System</p>
          </div>
        </div>
      )}

      {/* --- สเต็ปที่ 1: เลือกวิชา --- */}
      {step === 'SELECT_COURSE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="h-2 bg-indigo-500 w-full"></div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">หลักสูตรบังคับ</span>
                  <VideoCameraOutlined className="text-slate-300 text-xl" />
                </div>
                
                <h2 className="text-lg font-bold text-slate-800 leading-tight mb-2">
                  {course.title}
                </h2>
                <p className="text-slate-500 text-sm line-clamp-2 flex-grow mb-4">
                  {course.description || 'ไม่มีคำอธิบายสำหรับหลักสูตรนี้'}
                </p>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-5 flex items-center gap-2">
                  <TrophyOutlined className="text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-600">เกณฑ์ผ่าน: <span className="text-indigo-600">{course.passing_score}%</span></span>
                </div>
                
                <button 
                  onClick={() => handleStartCourse(course)}
                  disabled={currentUser?.role !== 'CONTRACTOR'}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors
                    ${currentUser?.role === 'CONTRACTOR' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <PlayCircleOutlined /> {currentUser?.role === 'CONTRACTOR' ? 'เริ่มเรียนเลย' : 'เฉพาะผู้รับเหมา'}
                </button>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
              <BookOutlined className="text-5xl mb-3 opacity-30" />
              <p className="text-lg font-medium">ยังไม่มีหลักสูตรในระบบ...</p>
            </div>
          )}
        </div>
      )}

      {/* --- สเต็ปที่ 2: ดูวิดีโอ (ดีไซน์ใหม่ คลีน นิ่ง ไม่เด้ง) --- */}
      {step === 'WATCH_VIDEO' && selectedCourse && (
        <div className="max-w-4xl mx-auto">
          {/* Top Navigation */}
          <div className="mb-6 flex items-center">
            <button onClick={resetState} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 transition-colors">
              <ArrowLeftOutlined /> กลับไปเลือกวิชา
            </button>
          </div>

          {/* Title Area */}
          <div className="mb-6 px-2 md:px-0">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-2">{selectedCourse.title}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <InfoCircleOutlined className="text-indigo-500" />
              <span>กรุณารับชมวิดีโอให้จบก่อนเริ่มทำแบบทดสอบ</span>
            </div>
          </div>
          
          {/* Video Container (ขยายเต็มในมือถือ) */}
          <div className="w-full bg-black md:rounded-2xl overflow-hidden shadow-md aspect-video flex items-center justify-center -mx-4 md:mx-0 w-[calc(100%+2rem)] md:w-full">
            {selectedCourse.video_url ? (
              <iframe 
                className="w-full h-full"
                src={getEmbedUrl(selectedCourse.video_url)} 
                title="Training Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-center text-slate-400 p-6 flex flex-col items-center">
                <VideoCameraOutlined className="text-4xl md:text-6xl mb-3 opacity-40" />
                <span className="text-sm md:text-base">พื้นที่สำหรับวิดีโอประกอบการอบรม</span>
              </div>
            )}
          </div>

          {/* Action Area (กล่องเตรียมตัวสอบแบบนิ่งๆ คลีนๆ) */}
          <div className="mt-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-1">พร้อมทำแบบทดสอบหรือยัง?</h3>
            <p className="text-slate-500 text-sm mb-6">มีคำถามทั้งหมด {MOCK_QUESTIONS.length} ข้อ | เกณฑ์ผ่าน {selectedCourse.passing_score}%</p>
            
            <button 
              onClick={() => setStep('TAKE_QUIZ')} 
              className="w-full md:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <FormOutlined /> เริ่มทำแบบทดสอบ
            </button>
          </div>
        </div>
      )}

      {/* --- สเต็ปที่ 3: ทำแบบทดสอบ --- */}
      {step === 'TAKE_QUIZ' && selectedCourse && (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Quiz Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
                  <FormOutlined className="text-indigo-500" /> แบบทดสอบ
                </h3>
                <button onClick={() => setStep('WATCH_VIDEO')} className="text-sm font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <ArrowLeftOutlined /> กลับไปดูคลิป
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                  <span>ความคืบหน้า</span>
                  <span>{Object.keys(answers).length} / {MOCK_QUESTIONS.length} ข้อ</span>
                </div>
                <Progress 
                  percent={Math.round((Object.keys(answers).length / MOCK_QUESTIONS.length) * 100)} 
                  showInfo={false} 
                  strokeColor="#4f46e5" 
                  trailColor="#e2e8f0"
                  className="m-0"
                />
              </div>
            </div>
            
            {/* Questions List */}
            <div className="p-6 md:p-8 space-y-8">
              {MOCK_QUESTIONS.map((q, index) => (
                <div key={q.id}>
                  <h4 className="text-base md:text-lg font-bold text-slate-800 mb-4 leading-relaxed">
                    <span className="text-indigo-500 mr-1">{index + 1}.</span> {q.question}
                  </h4>
                  
                  {/* Selectable Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[q.id] === optIdx;
                      return (
                        <div 
                          key={optIdx}
                          onClick={() => handleAnswer(q.id, optIdx)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-colors flex items-start gap-3 select-none
                            ${isSelected 
                              ? 'border-indigo-500 bg-indigo-50/50' 
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                            ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                          </div>
                          <span className={`text-sm md:text-base font-medium leading-tight ${isSelected ? 'text-indigo-800' : 'text-slate-600'}`}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Section */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center">
              <button 
                onClick={handleSubmitQuiz} 
                disabled={isSubmitting}
                className="w-full md:w-auto px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? 'กำลังตรวจคำตอบ...' : <><CheckCircleOutlined /> ส่งคำตอบ</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- สเต็ปที่ 4: ผลการสอบ --- */}
      {step === 'RESULT' && scoreResult && (
        <div className="max-w-2xl mx-auto">
          <div className={`border border-slate-200 shadow-xl rounded-3xl overflow-hidden bg-white`}>
            <Result
              status={scoreResult.passed ? 'success' : 'error'}
              icon={
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-2
                  ${scoreResult.passed ? 'bg-emerald-100 text-emerald-500' : 'bg-red-100 text-red-500'}`}>
                  {scoreResult.passed ? <TrophyOutlined /> : <InfoCircleOutlined />}
                </div>
              }
              title={<span className="text-2xl md:text-3xl font-black text-slate-800">{scoreResult.passed ? 'สอบผ่าน! ยอดเยี่ยมมาก 🎉' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}</span>}
              subTitle={
                <div className="mt-4">
                  <p className="text-slate-500 font-medium mb-1">คะแนนของคุณ</p>
                  <div className={`text-5xl md:text-6xl font-black mb-3 ${scoreResult.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                    {scoreResult.score}<span className="text-2xl">%</span>
                  </div>
                  <p className="text-sm text-slate-500 bg-slate-100 inline-block px-4 py-1.5 rounded-full">
                    เกณฑ์ผ่านคือ {selectedCourse?.passing_score}%
                  </p>
                </div>
              }
              extra={[
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6 px-6 pb-6" key="actions">
                  <button onClick={resetState} className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    กลับหน้าหลัก
                  </button>
                  {!scoreResult.passed && (
                    <button onClick={() => setStep('TAKE_QUIZ')} className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">
                      สอบใหม่อีกครั้ง
                    </button>
                  )}
                </div>
              ]}
            />
          </div>
        </div>
      )}
      
    </div>
  );
}