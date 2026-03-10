import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Progress, Tabs, Badge, message, Divider, Spin } from 'antd';
import { 
  PlayCircleOutlined, CheckCircleOutlined, LockOutlined, 
  ClockCircleOutlined, BookOutlined, WarningOutlined, LeftOutlined, 
  PauseCircleOutlined, SafetyCertificateOutlined, CloseCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios'; 

const { Title, Text } = Typography;

export default function ELearning({ currentUser }: { currentUser: any }) {
  const [currentView, setCurrentView] = useState<'LIST' | 'PLAYER' | 'EXAM' | 'RESULT'>('LIST');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playedPercent, setPlayedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); 
  const [isSaving, setIsSaving] = useState(false); 
  const [isFetchingExam, setIsFetchingExam] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const res = await axios.get(`https://safetyos-backend.onrender.com/courses?user_id=${currentUser?.id}`);
        setCourses(res.data);
      } catch (error) {
        console.error('ไม่สามารถดึงข้อมูลคอร์สเรียนได้', error);
        message.error('ระบบขัดข้อง: ดึงข้อมูลวิชาเรียนไม่สำเร็จ');
      } finally {
        setIsLoadingCourses(false);
      }
    };

    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentView !== 'PLAYER') return;
    const handleWindowBlur = () => {
      if (isPlaying) {
        handlePlayPause(false);
        message.warning({ content: '⚠️ วิดีโอหยุดเล่น เนื่องจากคุณสลับหน้าต่างการทำงาน', key: 'blur-warning', duration: 4 });
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isPlaying, currentView]);

  const handlePlayPause = (forceState?: boolean) => {
    if (!videoRef.current) return;
    const nextState = forceState !== undefined ? forceState : !isPlaying;
    
    if (nextState) {
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    } else {
      videoRef.current.pause();
    }
    setIsPlaying(nextState);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setPlayedPercent(Math.floor(progress) || 0);
  };

  const handleVideoEnded = () => {
    setIsCompleted(true);
    setIsPlaying(false);
  };

  const handleStartCourse = (course: any) => {
    setSelectedCourse(course);
    setPlayedPercent(0);
    setIsCompleted(false);
    setIsPlaying(false); 
    setCurrentView('PLAYER');
  };

  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

  // 🟢 ดึงข้อสอบจาก Database ของจริง
  const handleStartExam = async () => {
    setIsFetchingExam(true);
    try {
      // ยิง API ไปขอข้อสอบของวิชานี้
      const res = await axios.get(`https://safetyos-backend.onrender.com/courses/${selectedCourse.id}/questions`);
      const dbQuestions = res.data;

      // ถ้าแอดมินยังไม่ได้ใส่ข้อสอบในระบบ
      if (!dbQuestions || dbQuestions.length === 0) {
        message.warning('ยังไม่มีข้อสอบสำหรับวิชานี้ในระบบ');
        setIsFetchingExam(false);
        return;
      }

      // จัดเตรียมข้อสอบและสุ่มชอยส์ ก, ข, ค, ง
      const preparedQuestions = dbQuestions.map((q: any) => ({
        q: q.question,
        shuffledChoices: shuffleArray(q.choices), // สลับตำแหน่งตัวเลือก
        ans: q.answer
      }));
      
      setQuestions(shuffleArray(preparedQuestions)); // สลับลำดับข้อสอบ
      setCurrentQIndex(0);
      setScore(0);
      setTimeLeft(30);
      setCurrentView('EXAM');

    } catch (error) {
      console.error("Fetch exam error:", error);
      message.error('ไม่สามารถดึงข้อสอบได้ กรุณาลองใหม่');
    } finally {
      setIsFetchingExam(false);
    }
  };

  useEffect(() => {
    if (currentView === 'EXAM' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (currentView === 'EXAM' && timeLeft === 0) {
      message.error('หมดเวลา! ถือว่าตอบผิด');
      handleNextQuestion(false);
    }
  }, [timeLeft, currentView]);

  const handleAnswerSubmit = (selectedChoice: string) => {
    const isCorrect = selectedChoice === questions[currentQIndex].ans;
    if (isCorrect) {
      setScore(prev => prev + 1);
      message.success('✅ ตอบถูกต้อง!');
    } else {
      message.error('❌ ตอบผิด!');
    }
    handleNextQuestion(isCorrect);
  };

  const handleNextQuestion = (isCorrect: boolean) => {
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(currentQIndex + 1);
      setTimeLeft(30); 
    } else {
      processExamResult(score + (isCorrect ? 1 : 0));
    }
  };

  const processExamResult = async (finalScore: number) => {
    setCurrentView('RESULT');
    setIsSaving(true);
    
    try {
      const finalPercentage = Math.floor((finalScore / questions.length) * 100);

      const res = await axios.post('https://safetyos-backend.onrender.com/training-records', {
        user_id: currentUser.id,
        course_id: selectedCourse.id,
        score: finalPercentage
      });
      
      if (res.data.isPassed) {
        message.success('🎉 บันทึกผลการสอบสำเร็จ! คุณได้รับใบ Certificate แล้ว');
        setCourses(prev => prev.map(c => 
          c.id === selectedCourse.id ? { ...c, status: 'COMPLETED', progress: 100 } : c
        ));
      } else {
        message.warning('บันทึกผลสอบแล้ว แต่คะแนนยังไม่ผ่านเกณฑ์ 80%');
      }
    } catch (error) {
      console.error("Save Exam Error:", error);
      message.error('เกิดข้อผิดพลาดในการบันทึกผลสอบ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setIsPlaying(false);
    setCurrentView('LIST');
  };

  // ==========================================
  // 🎬 RENDER: หน้าจอแสดงผลสอบ (RESULT)
  // ==========================================
  if (currentView === 'RESULT') {
    const passScore = Math.ceil(questions.length * 0.8); 
    const isPassed = score >= passScore;

    return (
      <div className="w-full max-w-2xl mx-auto pt-8 md:pt-10 pb-16 px-4 animate-fade-in">
        <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          
          {isSaving ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Spin size="large" />
              <h3 className="text-lg md:text-xl font-bold text-slate-700 mt-6">กำลังบันทึกผลสอบ...</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1">กรุณารอสักครู่ ระบบกำลังอัปเดต E-Passport ของคุณ</p>
            </div>
          ) : (
            <>
              {isPassed ? (
                <div className="mb-6 animate-fade-in">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <SafetyCertificateOutlined className="text-emerald-500 text-4xl md:text-5xl" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">ยินดีด้วย! คุณสอบผ่าน 🎉</h2>
                  <p className="text-slate-500 mt-1 text-xs md:text-sm">คุณผ่านการทดสอบหลักสูตร "{selectedCourse.title}" เรียบร้อยแล้ว</p>
                </div>
              ) : (
                <div className="mb-6 animate-fade-in">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloseCircleOutlined className="text-rose-500 text-4xl md:text-5xl" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">เสียใจด้วย คุณสอบไม่ผ่าน 😢</h2>
                  <p className="text-slate-500 mt-1 text-xs md:text-sm">กรุณาทบทวนเนื้อหาและลองทำแบบทดสอบใหม่อีกครั้ง</p>
                </div>
              )}

              <div className="bg-slate-50/80 rounded-2xl p-5 md:p-6 mb-6 md:mb-8 border border-slate-200/60">
                <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">คะแนนของคุณ</h3>
                <div className="text-4xl md:text-5xl font-black mb-2">
                  <span className={isPassed ? "text-emerald-500" : "text-rose-500"}>{score}</span> 
                  <span className="text-slate-300 text-2xl md:text-3xl"> / {questions.length}</span>
                </div>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 m-0 bg-white inline-block px-3 py-1 rounded-full shadow-sm border border-slate-100">เกณฑ์การผ่าน: {passScore} คะแนน (80%)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                {isPassed ? (
                  <>
                    <Button size="large" onClick={handleBackToList} className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-sm md:text-base font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">กลับหน้าหลัก</Button>
                    <Button size="large" type="primary" onClick={() => window.location.href = '?page=E_PASSPORT'} className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-sm md:text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_8px_20px_rgba(16,185,129,0.3)]">ตรวจสอบ E-Passport</Button>
                  </>
                ) : (
                  <>
                    <Button size="large" onClick={() => setCurrentView('PLAYER')} className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-sm md:text-base font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">กลับไปดูวิดีโอ</Button>
                    <Button size="large" type="primary" onClick={handleStartExam} icon={<ReloadOutlined />} className="h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl text-sm md:text-base font-black bg-blue-600 hover:bg-blue-700 border-none shadow-[0_8px_20px_rgba(37,99,235,0.3)]">สอบใหม่อีกครั้ง</Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎬 RENDER: หน้าจอห้องสอบ (EXAM)
  // ==========================================
  if (currentView === 'EXAM' && questions.length > 0) {
    const currentQ = questions[currentQIndex];
    const timeRatio = timeLeft / 30; 
    let timerColor = '#10b981'; 
    if (timeRatio < 0.5) timerColor = '#f59e0b'; 
    if (timeRatio < 0.2) timerColor = '#e11d48'; 

    return (
      <div className="w-full max-w-3xl mx-auto pt-4 md:pt-6 pb-16 px-4 animate-fade-in">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg md:text-2xl font-black text-slate-800 m-0">Final Exam</h2>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium m-0 truncate max-w-[180px] md:max-w-md">{selectedCourse.title}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5 md:mb-1">คำถามที่</span>
            <span className="text-lg md:text-xl font-black text-indigo-600">{currentQIndex + 1} <span className="text-slate-300">/ {questions.length}</span></span>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 mb-4 md:mb-6 flex items-center gap-3 md:gap-4">
          <ClockCircleOutlined className={`text-xl md:text-2xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <div className="flex-1">
            <Progress percent={timeRatio * 100} showInfo={false} strokeColor={timerColor} trailColor="#f1f5f9" className="m-0" />
          </div>
          <div className={`font-black text-lg md:text-xl w-8 md:w-10 text-right ${timeLeft <= 5 ? 'text-rose-500' : 'text-slate-700'}`}>{timeLeft}s</div>
        </div>

        <div className="bg-white p-5 md:p-10 rounded-2xl md:rounded-[2rem] shadow-lg border border-slate-100">
          <h3 className="text-base md:text-xl font-bold text-slate-800 leading-relaxed mb-6 md:mb-8">
            <span className="text-indigo-500 mr-2">Q{currentQIndex + 1}.</span> 
            {currentQ.q}
          </h3>

          <div className="flex flex-col gap-2.5 md:gap-3">
            {currentQ.shuffledChoices.map((choice: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => handleAnswerSubmit(choice)}
                className="w-full text-left p-3.5 md:p-5 rounded-xl md:rounded-2xl border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs md:text-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    {String.fromCharCode(65 + idx)} 
                  </div>
                  <span className="font-semibold text-slate-700 text-xs md:text-base leading-tight">{choice}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎬 RENDER: หน้าจอห้องเรียน (PLAYER) - 🌟 อัปเกรด UI ให้ดูหรูหราขึ้น
  // ==========================================
  if (currentView === 'PLAYER' && selectedCourse) {
    return (
      <div className="w-full max-w-5xl mx-auto pb-16 px-0 md:px-4 animate-fade-in">
        
        {/* Header - กระชับขึ้นบนมือถือ */}
        <div className="mb-3 md:mb-6 flex items-center gap-3 px-4 md:px-0 pt-2 md:pt-0">
          <Button 
            type="default" 
            icon={<LeftOutlined />} 
            onClick={handleBackToList} 
            className="rounded-xl font-bold bg-white text-slate-600 border-slate-200 shadow-sm hover:border-slate-300 flex items-center justify-center h-9 md:h-10 text-xs md:text-sm px-3"
          >
            <span className="hidden sm:inline">กลับ</span>
          </Button>
          <div className="hidden sm:block w-px h-5 bg-slate-300"></div>
          <h2 className="text-sm md:text-xl font-black text-slate-800 m-0 truncate leading-none pt-1">
            {selectedCourse.title}
          </h2>
        </div>

        {/* 📺 Cinematic Player: กรอบซ้อน 2 ชั้น + Glassmorphism Play Button */}
        <div className="bg-slate-900 md:bg-white md:p-2 md:rounded-[2rem] md:shadow-2xl md:shadow-slate-200/50 md:border border-slate-100 mb-5 md:mb-8 w-full">
          <div className="bg-black md:rounded-[1.5rem] overflow-hidden relative aspect-video group w-full">
            
            <video 
              ref={videoRef}
              src={selectedCourse?.video_url || selectedCourse?.videoUrl} 
              className="w-full h-full object-contain absolute top-0 left-0"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              disablePictureInPicture 
              controlsList="nodownload nofullscreen" 
            />
            
            {/* 🌟 Glassmorphism Overlay Button */}
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-all duration-300 bg-black/40 hover:bg-black/20" 
              onClick={() => handlePlayPause()}
            >
              {!isPlaying && (
                <div className="bg-white/20 border border-white/30 backdrop-blur-md w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transform transition-transform hover:scale-105 active:scale-95">
                  <PlayCircleOutlined className="text-white text-3xl md:text-4xl ml-1 drop-shadow-md" />
                </div>
              )}
            </div>

            {/* Progress Bar ด้านล่าง */}
            <div className={`absolute bottom-0 left-0 right-0 px-3 md:px-5 pb-2 md:pb-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              <div className="flex justify-between items-center text-white/90 text-[10px] md:text-xs font-bold mb-1.5 md:mb-2 uppercase tracking-wider drop-shadow-md">
                <span className="flex items-center gap-1 md:gap-2">
                  {isPlaying ? <span className="text-emerald-400 flex items-center gap-1"><PlayCircleOutlined /> <span className="hidden sm:inline">กำลังเล่น</span></span> : <span className="text-amber-400 flex items-center gap-1"><PauseCircleOutlined /> <span className="hidden sm:inline">หยุดชั่วคราว</span></span>}
                </span>
                <span>ความคืบหน้า <span className="text-blue-400 text-xs md:text-sm ml-1 font-black">{playedPercent}%</span></span>
              </div>
              <Progress percent={playedPercent} showInfo={false} strokeColor="#3b82f6" trailColor="rgba(255,255,255,0.2)" size={["100%", 4]} className="m-0 md:!h-1.5" />
            </div>
          </div>
        </div>

        {/* ข้อมูลคอร์สและปุ่มสอบ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
          
          <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-500 font-bold mb-2 md:mb-4 text-xs md:text-sm">
              <BookOutlined className="text-blue-500 text-base" /> รายละเอียดหลักสูตร
            </div>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed m-0">{selectedCourse.description}</p>
            
            <Divider className="my-4 md:my-6 border-slate-100" />
            
            <div className="bg-rose-50/50 border border-rose-100 p-3 md:p-4 rounded-xl flex items-start gap-2.5 md:gap-3">
              <WarningOutlined className="text-rose-500 text-base md:text-xl mt-0.5" />
              <div>
                <h4 className="text-rose-700 font-bold text-xs md:text-sm m-0 mb-0.5 md:mb-1">กฎการเรียนรู้ (Strict Mode)</h4>
                <p className="text-rose-600/80 text-[10px] md:text-xs m-0 leading-relaxed font-medium">
                  1. ห้ามกดกรอวิดีโอข้าม<br/>
                  2. วิดีโอจะหยุดอัตโนมัติหากสลับหน้าจอ<br/>
                  3. ต้องรับชมครบ 100% เพื่อปลดล็อกข้อสอบ
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50/80 p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-inner border border-slate-200/60 flex flex-col justify-center items-center text-center h-full">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 md:mb-4 border border-slate-100">
              <SafetyCertificateOutlined className="text-2xl md:text-3xl text-slate-400" />
            </div>
            <h3 className="text-sm md:text-lg font-black text-slate-700 mb-1">ทำแบบทดสอบ</h3>
            <p className="text-[10px] md:text-xs text-slate-500 mb-4 md:mb-6 font-medium">เกณฑ์ผ่าน: 80% ขึ้นไป</p>

            {isCompleted ? (
              <Button size="large" type="primary" loading={isFetchingExam} onClick={handleStartExam} className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_10px_20px_rgba(16,185,129,0.3)] animate-bounce">
                เริ่มทำข้อสอบทันที
              </Button>
            ) : (
              <Button size="large" disabled className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold bg-slate-200/50 text-slate-400 border border-slate-200 flex items-center justify-center gap-2">
                <LockOutlined /> รอวิดีโอจบ 100%
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 📚 RENDER: หน้ารวมหลักสูตร (Dashboard) - 🌟 กระชับขึ้น
  // ==========================================
  const filteredCourses = courses.filter(course => {
    if (activeTab === 'REQUIRED') return course.status === 'REQUIRED' || course.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return course.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUIRED': return <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[9px] md:text-xs font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-full shadow-md flex items-center gap-1 border border-rose-400/50"><WarningOutlined /> บังคับเรียน</div>;
      case 'IN_PROGRESS': return <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] md:text-xs font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-full shadow-md flex items-center gap-1 border border-amber-300/50"><PlayCircleOutlined className="animate-pulse" /> กำลังเรียน</div>;
      case 'COMPLETED': return <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] md:text-xs font-black px-2.5 md:px-3 py-1 md:py-1.5 rounded-full shadow-md flex items-center gap-1 border border-emerald-400/50"><CheckCircleOutlined /> สอบผ่านแล้ว</div>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 px-3 md:px-6 lg:px-8">
      
      {/* 🚀 Header ปรับให้เล็กกะทัดรัดขึ้นบนมือถือ */}
      <div className="mb-5 md:mb-8 text-left">
        <h2 className="text-xl md:text-3xl font-black text-slate-800 m-0 flex items-center gap-2.5 md:gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-2 md:p-2.5 rounded-xl md:rounded-2xl shadow-md"><BookOutlined /></div>
          E-Learning Center
        </h2>
        <p className="text-slate-500 mt-1.5 md:mt-2 font-medium text-xs md:text-sm pl-[42px] md:pl-[52px]">ศูนย์อบรมและทดสอบ (SafetyOS)</p>
      </div>

      {isLoadingCourses ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spin size="large" />
          <p className="text-slate-500 mt-4 font-bold text-sm">กำลังโหลดรายวิชา...</p>
        </div>
      ) : (
        <>
          {/* 🔴 กล่องแดงแจ้งเตือน (ลดขนาดลงให้สมส่วน) */}
          {courses.some(c => c.status === 'REQUIRED') && (
            <div className="bg-gradient-to-r from-rose-50 to-red-50 border-l-4 border-rose-500 p-3 md:p-5 rounded-r-xl md:rounded-r-2xl rounded-l-sm mb-6 md:mb-8 flex flex-row items-center gap-3 md:gap-4 shadow-sm">
              <div className="bg-white text-rose-500 p-2 md:p-3 rounded-full shadow-sm shrink-0">
                <LockOutlined className="text-lg md:text-2xl" />
              </div>
              <div>
                <h4 className="text-rose-800 font-black text-sm md:text-lg m-0 leading-tight">คุณมีวิชาที่ต้องเรียน!</h4>
                <p className="text-rose-600/90 text-[10px] md:text-sm font-medium m-0 mt-0.5 md:mt-1 leading-snug">
                  กรุณาสอบให้ผ่าน เพื่อปลดล็อก Work Permit
                </p>
              </div>
            </div>
          )}

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="small"
            className="custom-elearning-tabs mb-4 md:mb-8"
            items={[
              { key: 'ALL', label: <span className="font-bold text-xs md:text-base">📚 ทั้งหมด</span> },
              { key: 'REQUIRED', label: <span className="font-bold text-rose-500 text-xs md:text-base flex items-center gap-1.5"><Badge dot color="red" offset={[5, 0]}>รอสอบ</Badge></span> },
              { key: 'COMPLETED', label: <span className="font-bold text-emerald-600 text-xs md:text-base"> ผ่านแล้ว</span> },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group flex flex-col h-full">
                
                <div className="h-40 md:h-52 w-full relative overflow-hidden bg-slate-200 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-70"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {getStatusBadge(course.status)}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 text-white/90 text-[10px] md:text-xs font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                    <ClockCircleOutlined /> {course.duration}
                  </div>
                </div>

                <div className="p-4 md:p-6 flex flex-col flex-1 bg-white relative z-20">
                  <h3 className="text-sm md:text-lg font-black text-slate-800 leading-tight mb-1.5 md:mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                  <p className="text-[11px] md:text-xs text-slate-500 mb-4 md:mb-6 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                  
                  <div className="mt-auto">
                    {course.status === 'COMPLETED' ? (
                      <Button block size="large" className="rounded-xl md:rounded-2xl h-10 md:h-12 text-xs md:text-sm font-black text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors" onClick={() => window.location.href = '?page=E_PASSPORT'}>
                        ดูใบ Certificate ของฉัน
                      </Button>
                    ) : course.status === 'IN_PROGRESS' ? (
                      <Button block size="large" type="primary" onClick={() => handleStartCourse(course)} className="rounded-xl md:rounded-2xl h-10 md:h-12 text-xs md:text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-md hover:shadow-lg transition-all">
                        เรียนต่อให้จบ
                      </Button>
                    ) : (
                      <Button block size="large" type="primary" danger onClick={() => handleStartCourse(course)} className="rounded-xl md:rounded-2xl h-10 md:h-12 text-xs md:text-sm font-black bg-gradient-to-r from-rose-500 to-red-600 border-none shadow-md hover:shadow-lg transition-all">
                        เริ่มเรียนทันที
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .custom-elearning-tabs .ant-tabs-nav::before { border-bottom: 1px solid #e2e8f0; }
        .custom-elearning-tabs .ant-tabs-tab { padding: 12px 0; margin-right: 24px; transition: all 0.3s; }
        .custom-elearning-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #1e293b !important; transform: scale(1.02); }
        .custom-elearning-tabs .ant-tabs-ink-bar { height: 3px !important; border-radius: 3px 3px 0 0; background: #4f46e5; }
        @media (max-width: 768px) { .custom-elearning-tabs .ant-tabs-tab { margin-right: 16px; padding: 8px 0;} }
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}