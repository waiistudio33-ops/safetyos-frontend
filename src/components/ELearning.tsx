import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Progress, Tabs, Badge, message, Divider, Spin, Modal } from 'antd';
import { 
  PlayCircleOutlined, CheckCircleOutlined, LockOutlined, 
  ClockCircleOutlined, BookOutlined, WarningOutlined, LeftOutlined, 
  PauseCircleOutlined, SafetyCertificateOutlined, CloseCircleOutlined, ReloadOutlined,
  DownOutlined, UpOutlined, FullscreenOutlined, FullscreenExitOutlined
} from '@ant-design/icons';
import axios from 'axios'; 

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function ELearning({ currentUser }: { currentUser: any }) {
  const [currentView, setCurrentView] = useState<'LIST' | 'PLAYER' | 'EXAM' | 'RESULT'>('LIST');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playedPercent, setPlayedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); 
  const [isFullscreen, setIsFullscreen] = useState(false); 
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null); 

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); 
  const [isSaving, setIsSaving] = useState(false); 
  const [isFetchingExam, setIsFetchingExam] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // 🚀 ดึงข้อมูลคอร์สเรียนทั้งหมดจาก Backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        // หมายเหตุ: ฝั่ง Backend ต้องมี API /courses ที่ return ค่าหน้าตาประมาณนี้
        // [ { id: 'c1', title: 'การทำงานในที่อับอากาศ', description: '...', video_url: '...', duration: '15 นาที', status: 'REQUIRED', thumbnail: '...' } ]
        const res = await axios.get(`${API_URL}/courses?user_id=${currentUser?.id}`);
        setCourses(res.data);
      } catch (error) {
        console.error('ไม่สามารถดึงข้อมูลคอร์สเรียนได้', error);
        
        // 🟢 Fallback (ข้อมูลจำลอง) กรณี Backend ยังไม่พร้อม
        setTimeout(() => {
          setCourses([
            { id: '1', title: 'ความปลอดภัยในการทำงานในที่อับอากาศ (Confined Space)', duration: '15 นาที', status: 'REQUIRED', thumbnail: 'https://images.unsplash.com/photo-1541888086925-920a0b724cc6?q=80&w=800&auto=format&fit=crop', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'หลักสูตรบังคับสำหรับผู้ที่ต้องปฏิบัติงานในพื้นที่อับอากาศ เรียนรู้ถึงอันตรายจากก๊าซพิษ การขาดออกซิเจน และขั้นตอนการขออนุญาต (Work Permit) อย่างถูกต้อง พร้อมวิธีการอพยพหนีภัยฉุกเฉินเมื่อเกิดเหตุไม่คาดฝัน' },
            { id: '2', title: 'การใช้งานอุปกรณ์ป้องกันส่วนบุคคล (PPE)', duration: '10 นาที', status: 'IN_PROGRESS', thumbnail: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800&auto=format&fit=crop', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'ทำความรู้จักกับอุปกรณ์ PPE พื้นฐานที่จำเป็นในโรงงานอุตสาหกรรม (หมวกนิรภัย, แว่นตานิรภัย, รองเท้าเซฟตี้) พร้อมวิธีการสวมใส่ การตรวจสอบสภาพก่อนใช้งาน และการบำรุงรักษาอย่างถูกวิธี' },
            { id: '3', title: 'อันตรายจากงานตัดเชื่อม (Hot Work Safety)', duration: '20 นาที', status: 'COMPLETED', thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=800&auto=format&fit=crop', video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'มาตรการความปลอดภัยในการทำงานที่มีประกายไฟ การจัดเตรียมพื้นที่ การกั้นม่านกันไฟ และหน้าที่ของผู้เฝ้าระวังไฟ (Fire Watch) เพื่อป้องกันการเกิดอัคคีภัยในโรงงาน' },
          ]);
          setIsLoadingCourses(false);
        }, 1000);
      }
    };

    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser]);

  // ==========================================
  // ⚙️ Logic วิดีโอ (HTML5 Video + Auto-pause + Resume)
  // ==========================================
  useEffect(() => {
    if (currentView !== 'PLAYER') return;
    const handleWindowBlur = () => {
      if (isPlaying && !isCompleted) {
        handlePlayPause(false);
        message.warning({ content: '⚠️ วิดีโอหยุดเล่น เนื่องจากคุณสลับหน้าต่างการทำงาน', key: 'blur-warning', duration: 4 });
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isPlaying, isCompleted, currentView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = (forceState?: boolean) => {
    if (!videoRef.current || isCompleted) return;
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

    if (!isCompleted && currentUser?.id && selectedCourse?.id && videoRef.current.currentTime > 5) {
      const storageKey = `course_progress_${currentUser.id}_${selectedCourse.id}`;
      localStorage.setItem(storageKey, videoRef.current.currentTime.toString());
    }
  };

  const handleVideoEnded = () => {
    setIsCompleted(true);
    setIsPlaying(false);
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    
    if (currentUser?.id && selectedCourse?.id) {
       localStorage.removeItem(`course_progress_${currentUser.id}_${selectedCourse.id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        message.warning('อุปกรณ์ของคุณไม่รองรับการขยายเต็มจอ');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleStartCourse = (course: any) => {
    setSelectedCourse(course);
    setPlayedPercent(0);
    setIsCompleted(false);
    setIsPlaying(false); 
    setIsDescriptionExpanded(false); 
    
    if (currentUser?.id) {
      const storageKey = `course_progress_${currentUser.id}_${course.id}`;
      const savedTime = localStorage.getItem(storageKey);

      if (savedTime && parseFloat(savedTime) > 10) { 
        Modal.confirm({
          title: 'ต้องการดูต่อจากเดิมหรือไม่?',
          content: 'ระบบพบว่าคุณเคยเรียนวิชานี้ค้างไว้',
          okText: 'ดูต่อจากเดิม',
          cancelText: 'เริ่มใหม่ตั้งแต่ต้น',
          icon: <PlayCircleOutlined className="text-blue-500" />,
          centered: true,
          onOk: () => {
            setCurrentView('PLAYER');
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.currentTime = parseFloat(savedTime);
                handlePlayPause(true); 
              }
            }, 500); 
          },
          onCancel: () => {
             localStorage.removeItem(storageKey);
             setCurrentView('PLAYER');
          }
        });
        return; 
      }
    }
    setCurrentView('PLAYER');
  };

  // ==========================================
  // ⚙️ Logic ห้องสอบ
  // ==========================================
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

  const handleStartExam = async () => {
    setIsFetchingExam(true);
    try {
      // 🟢 พยายามดึงข้อสอบจาก Backend
      const res = await axios.get(`${API_URL}/courses/${selectedCourse.id}/questions`);
      const dbQuestions = res.data;

      let rawQuestions = [];
      if (!dbQuestions || dbQuestions.length === 0) {
        // 🟢 Fallback (ข้อมูลจำลอง) กรณี Backend ยังไม่พร้อมส่งข้อสอบ
        console.warn('Backend ไม่ได้ส่งข้อสอบมา ใช้ข้อสอบจำลองแทน');
        rawQuestions = [
          { question: "ก่อนเข้าพื้นที่อับอากาศ สิ่งแรกที่ต้องทำคืออะไร?", choices: ["ตรวจวัดปริมาณก๊าซ", "เปิดพัดลมระบายอากาศ", "ตรวจสอบ Work Permit", "ถูกต้องทุกข้อ"], answer: "ถูกต้องทุกข้อ" },
          { question: "ปริมาณออกซิเจน (O2) ที่ปลอดภัยสำหรับการทำงานคือเท่าใด?", choices: ["15.0 - 18.0%", "19.5 - 23.5%", "25.0 - 30.0%", "มากกว่า 30.0%"], answer: "19.5 - 23.5%" },
          { question: "ใครมีหน้าที่เฝ้าระวังอยู่ปากทางเข้าออกพื้นที่อับอากาศตลอดเวลา?", choices: ["ผู้ควบคุมงาน", "ผู้ช่วยเหลือ (Standby Person)", "ผู้ปฏิบัติงาน", "ผู้อนุญาต"], answer: "ผู้ช่วยเหลือ (Standby Person)" }
        ];
      } else {
        rawQuestions = dbQuestions;
      }

      // เตรียมข้อสอบ: สลับตำแหน่ง Choice (เพื่อไม่ให้จำตำแหน่งคำตอบได้)
      const preparedQuestions = rawQuestions.map((q: any) => ({
        q: q.question,
        shuffledChoices: shuffleArray(q.choices), 
        ans: q.answer
      }));
      
      setQuestions(shuffleArray(preparedQuestions)); 
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

      // 🟢 ยิง API ไปบันทึกผลสอบ
      const res = await axios.post(`${API_URL}/training-records`, {
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
      // 🟢 จำลองพฤติกรรมบันทึกผลสอบสำเร็จ ถ้า Backend ไม่พร้อม
      setTimeout(() => {
        const isPassedLocally = finalPercentage >= 80;
        if (isPassedLocally) {
          message.success('🎉 จำลอง: สอบผ่าน (ได้ 80% ขึ้นไป)');
          setCourses(prev => prev.map(c => 
            c.id === selectedCourse.id ? { ...c, status: 'COMPLETED' } : c
          ));
        } else {
          message.warning(`จำลอง: สอบตก (ได้ ${finalPercentage}%) ต้อง 80% ขึ้นไป`);
        }
      }, 1000);
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
      <div className="w-full max-w-3xl mx-auto pt-8 md:pt-12 pb-16 px-4 animate-fade-in">
        {/* ✨ Tip: Soft Shadow & Balanced Radius (Outer 3rem, Inner 2rem) */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] text-center relative overflow-hidden border border-slate-50">
          
          {isSaving ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Spin size="large" />
              <h3 className="text-xl font-black text-slate-800 mt-6">กำลังบันทึกผลสอบ...</h3>
              <p className="text-sm text-slate-500 mt-2">กรุณารอสักครู่ ระบบกำลังสร้าง E-Certificate ให้คุณโดยอัตโนมัติ</p>
            </div>
          ) : (
            <>
              {isPassed ? (
                <div className="mb-8 animate-fade-in">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
                    <SafetyCertificateOutlined className="text-emerald-500 text-5xl md:text-6xl" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">ยินดีด้วย! คุณสอบผ่าน 🎉</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">ระบบได้สร้างใบ Certificate สาขา "{selectedCourse.title}" ให้คุณเรียบร้อยแล้ว</p>
                </div>
              ) : (
                // ✨ Tip: Negative Action Design (Clear red indication for failure)
                <div className="mb-8 animate-fade-in">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CloseCircleOutlined className="text-rose-500 text-5xl md:text-6xl" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">เสียใจด้วย คุณสอบไม่ผ่าน 😢</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">กรุณาทบทวนเนื้อหาและลองทำแบบทดสอบใหม่อีกครั้ง</p>
                </div>
              )}

              <div className="bg-slate-50/50 rounded-[2rem] p-6 md:p-8 mb-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-w-md mx-auto">
                <h3 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">คะแนนของคุณ</h3>
                <div className="text-5xl md:text-6xl font-black mb-3 tracking-tighter">
                  <span className={isPassed ? "text-emerald-500" : "text-rose-500"}>{score}</span> 
                  <span className="text-slate-300 text-3xl md:text-4xl"> / {questions.length}</span>
                </div>
                <p className="text-[11px] md:text-xs font-bold text-slate-500 m-0 bg-white inline-block px-4 py-1.5 rounded-full shadow-sm border border-slate-100">เกณฑ์การผ่าน: {passScore} คะแนน (80%)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                {isPassed ? (
                  <>
                    <Button size="large" onClick={handleBackToList} className="h-14 px-8 rounded-2xl text-base font-bold bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 w-full sm:w-auto shadow-sm">กลับหน้าหลัก</Button>
                    <Button size="large" type="primary" onClick={() => window.location.href = '?page=CERTS'} className="h-14 px-8 rounded-2xl text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_8px_24px_rgba(16,185,129,0.3)] w-full sm:w-auto">ดูใบรับรอง (Certificate)</Button>
                  </>
                ) : (
                  <>
                    <Button size="large" onClick={() => setCurrentView('PLAYER')} className="h-14 px-8 rounded-2xl text-base font-bold bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 w-full sm:w-auto shadow-sm">กลับไปดูวิดีโอ</Button>
                    <Button size="large" type="primary" onClick={handleStartExam} icon={<ReloadOutlined />} className="h-14 px-8 rounded-2xl text-base font-black bg-blue-600 hover:bg-blue-700 border-none shadow-[0_8px_24px_rgba(37,99,235,0.3)] w-full sm:w-auto">สอบใหม่อีกครั้ง</Button>
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
      <div className="w-full max-w-4xl mx-auto pt-6 md:pt-10 pb-16 px-4 animate-fade-in">
        <div className="flex justify-between items-end mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl md:text-3xl font-black text-slate-800 m-0 tracking-tight">Final Exam</h2>
            <p className="text-slate-500 text-xs md:text-sm font-bold m-0 mt-1 truncate w-full max-w-[250px] sm:max-w-md">{selectedCourse.title}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">คำถามที่</span>
            <span className="text-2xl md:text-3xl font-black text-[#2563eb]">{currentQIndex + 1} <span className="text-slate-300 text-lg">/ {questions.length}</span></span>
          </div>
        </div>

        {/* ✨ Tip: Soft Shadow on utility bar */}
        <div className="bg-white p-4 md:p-5 rounded-[1.5rem] shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 mb-6 md:mb-8 flex items-center gap-4">
          <ClockCircleOutlined className={`text-2xl md:text-3xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`} />
          <div className="flex-1">
            <Progress percent={timeRatio * 100} showInfo={false} strokeColor={timerColor} trailColor="#f1f5f9" className="m-0" />
          </div>
          <div className={`font-black text-xl md:text-2xl w-10 text-right ${timeLeft <= 5 ? 'text-rose-500' : 'text-slate-700'}`}>{timeLeft}s</div>
        </div>

        {/* ✨ Tip: Soft Shadow & Radius Math for the main question card */}
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.06)] border border-white">
          <h3 className="text-lg md:text-2xl font-black text-slate-800 leading-relaxed mb-8 md:mb-10">
            <span className="text-blue-600 mr-2">Q{currentQIndex + 1}.</span> 
            {currentQ.q}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ✨ Tip: Anatomy of Input - Clear padding, hover states, leading identifier */}
            {currentQ.shuffledChoices.map((choice: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => handleAnswerSubmit(choice)}
                className="w-full text-left p-5 md:p-6 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)] transition-all group focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98] flex items-center gap-4"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 text-slate-500 font-black flex items-center justify-center text-sm md:text-base group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 shadow-inner">
                  {String.fromCharCode(65 + idx)} 
                </div>
                <span className="font-extrabold text-slate-700 text-sm md:text-base leading-snug">{choice}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🎬 RENDER: หน้าจอห้องเรียน (PLAYER)
  // ==========================================
  if (currentView === 'PLAYER' && selectedCourse) {
    return (
      <div className="w-full max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8 animate-fade-in pt-4">
        
        <div className="mb-6 flex items-center gap-4">
          {/* ✨ Tip: Subtle secondary action button */}
          <Button 
            type="default" 
            icon={<LeftOutlined />} 
            onClick={handleBackToList} 
            className="rounded-2xl font-bold bg-white text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center h-12 px-4 shrink-0"
          >
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="w-px h-6 bg-slate-200"></div>
          <h2 className="text-lg md:text-2xl font-black text-slate-800 m-0 line-clamp-1 tracking-tight">
            {selectedCourse.title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full items-start">
          
          <div className="w-full lg:w-[65%] shrink-0">
            {/* ✨ Tip: Video Container with soft shadow and matching radius */}
            <div className="bg-slate-900 md:bg-white md:p-3 md:rounded-[2.5rem] md:shadow-[0_24px_50px_rgba(0,0,0,0.06)] md:border border-slate-100 w-full relative">
              
              <div ref={playerContainerRef} className={`bg-black md:rounded-[2rem] overflow-hidden relative aspect-video group w-full ${isFullscreen ? '!rounded-none' : ''}`}>
                
                <video 
                  ref={videoRef}
                  src={selectedCourse?.video_url || selectedCourse?.videoUrl} 
                  className={`w-full h-full object-contain absolute top-0 left-0 transition-all duration-700 ${isCompleted ? 'blur-md scale-105 opacity-50' : ''}`}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  disablePictureInPicture 
                  controlsList="nodownload nofullscreen noplaybackrate" 
                />
                
                {!isCompleted && (
                  <div 
                    className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-all duration-300 bg-black/40 hover:bg-black/20" 
                    onClick={() => handlePlayPause()}
                  >
                    {!isPlaying && (
                      <div className="bg-white/20 border border-white/30 backdrop-blur-md w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transform transition-transform hover:scale-105 active:scale-95">
                        <PlayCircleOutlined className="text-white text-5xl ml-1 drop-shadow-md" />
                      </div>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-fade-in bg-black/50 backdrop-blur-md px-6 text-center">
                     <div className="bg-emerald-500/20 p-4 rounded-full mb-4 border border-emerald-400/30 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircleOutlined className="text-5xl text-emerald-400" />
                     </div>
                     <h3 className="text-white font-black text-2xl md:text-3xl mb-2 drop-shadow-lg tracking-tight">รับชมวิดีโอจบแล้ว</h3>
                     <p className="text-slate-300 text-sm md:text-base mb-8 drop-shadow-md font-medium">กรุณาทำแบบทดสอบเพื่อรับ E-Certificate</p>
                     
                     <Button 
                        size="large" 
                        type="primary" 
                        loading={isFetchingExam} 
                        onClick={handleStartExam} 
                        className="h-14 px-10 rounded-2xl text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_12px_32px_rgba(16,185,129,0.4)] animate-bounce"
                     >
                        เริ่มทำข้อสอบทันที
                     </Button>
                  </div>
                )}

                {!isCompleted && (
                  <div className={`absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-4 pt-20 bg-gradient-to-t from-black via-black/50 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    <div className="flex justify-between items-center text-white/90 text-xs md:text-sm font-bold mb-3 uppercase tracking-wider drop-shadow-md">
                      
                      <span className="flex items-center gap-2">
                        {isPlaying ? <span className="text-emerald-400 flex items-center gap-1.5"><PlayCircleOutlined /> <span className="hidden sm:inline">กำลังเล่น</span></span> : <span className="text-amber-400 flex items-center gap-1.5"><PauseCircleOutlined /> <span className="hidden sm:inline">หยุดชั่วคราว</span></span>}
                      </span>
                      
                      <div className="flex items-center gap-4">
                        <span>ความคืบหน้า <span className="text-blue-400 text-sm md:text-base ml-1 font-black">{playedPercent}%</span></span>
                        <div className="w-px h-4 bg-white/20"></div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} 
                          className="pointer-events-auto bg-white/10 hover:bg-white/30 border border-white/20 p-2 rounded-xl text-white transition-all cursor-pointer flex items-center justify-center backdrop-blur-sm"
                        >
                          {isFullscreen ? <FullscreenExitOutlined className="text-lg" /> : <FullscreenOutlined className="text-lg" />}
                        </button>
                      </div>

                    </div>
                    <Progress percent={playedPercent} showInfo={false} strokeColor="#3b82f6" trailColor="rgba(255,255,255,0.2)" size={["100%", 6]} className="m-0" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[35%] flex flex-col gap-6 px-4 md:px-0">
            
            {/* ✨ Tip: Info Card with proper hierarchical padding and soft shadow */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.03)] border border-slate-50">
              <div className="flex items-center gap-2 text-slate-800 font-black text-base md:text-lg mb-4">
                <BookOutlined className="text-blue-600" /> ข้อมูลหลักสูตร
              </div>

              <div className="relative">
                <p className={`text-slate-500 text-sm leading-relaxed m-0 transition-all font-medium ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
                  {selectedCourse.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                </p>
                {selectedCourse.description && selectedCourse.description.length > 120 && (
                  <button 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-blue-600 text-xs font-black mt-2 flex items-center gap-1 hover:text-blue-800 bg-transparent border-none p-0 cursor-pointer uppercase tracking-widest"
                  >
                    {isDescriptionExpanded ? <>Show Less <UpOutlined className="text-[10px]" /></> : <>Read More <DownOutlined className="text-[10px]" /></>}
                  </button>
                )}
              </div>
              
              <Divider className="my-6 border-slate-100" />
              
              {/* ✨ Tip: Negative Action - Clearly styled strict rule box */}
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 shadow-inner">
                <div className="bg-white p-1.5 rounded-full shadow-sm shrink-0">
                   <WarningOutlined className="text-rose-500 text-base" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h4 className="text-rose-800 font-black text-xs uppercase tracking-widest m-0 mb-1">กฎการเรียนรู้ (Strict)</h4>
                  <p className="text-rose-600/90 text-xs m-0 leading-relaxed font-bold">
                    วิดีโอหยุดหากสลับหน้าจอ ต้องชมให้ครบ 100% จึงจะสามารถทำแบบทดสอบได้
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] shadow-inner border border-slate-200/50 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.03)] flex items-center justify-center mb-4 border border-slate-100">
                <SafetyCertificateOutlined className="text-2xl text-blue-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">ทำแบบทดสอบ</h3>
              <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-widest">เกณฑ์ผ่าน: 80% ขึ้นไป</p>

              {isCompleted ? (
                <Button size="large" type="primary" loading={isFetchingExam} onClick={handleStartExam} className="w-full h-14 rounded-2xl text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_8px_24px_rgba(16,185,129,0.4)] animate-pulse">
                  เริ่มทำข้อสอบ
                </Button>
              ) : (
                <Button size="large" disabled className="w-full h-14 rounded-2xl text-sm font-extrabold bg-white text-slate-400 border border-slate-200 flex items-center justify-center gap-2 shadow-sm">
                  <LockOutlined /> รอวิดีโอจบ 100%
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 📚 RENDER: หน้ารวมหลักสูตร (Dashboard Z-Pattern & Hierarchy)
  // ==========================================
  const filteredCourses = courses.filter(course => {
    if (activeTab === 'REQUIRED') return course.status === 'REQUIRED' || course.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return course.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUIRED': return <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest"><WarningOutlined /> บังคับเรียน</div>;
      case 'IN_PROGRESS': return <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest"><PlayCircleOutlined className="animate-pulse" /> กำลังเรียน</div>;
      case 'COMPLETED': return <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest"><CheckCircleOutlined /> สอบผ่านแล้ว</div>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* 🚀 Header */}
      <div className="mb-8 md:mb-10 text-left">
        <h2 className="text-2xl md:text-4xl font-black text-slate-800 m-0 flex items-center gap-3 tracking-tight">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.3)]"><BookOutlined /></div>
          E-Learning Center
        </h2>
        <p className="text-slate-500 mt-2 font-bold text-xs md:text-sm pl-[60px] md:pl-[70px] uppercase tracking-widest">ศูนย์อบรมและทดสอบ (SafetyOS)</p>
      </div>

      {isLoadingCourses ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spin size="large" />
          <p className="text-slate-400 mt-6 font-bold text-sm uppercase tracking-widest">กำลังโหลดรายวิชา...</p>
        </div>
      ) : (
        <>
          {/* ✨ Tip: Negative Action styled clearly as an alert */}
          {courses.some(c => c.status === 'REQUIRED') && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-8 flex flex-row items-center gap-4 shadow-sm md:max-w-lg">
              <div className="bg-white text-rose-500 p-3 rounded-full shadow-sm shrink-0">
                <LockOutlined className="text-xl" />
              </div>
              <div>
                <h4 className="text-rose-800 font-black text-sm m-0 mb-1 uppercase tracking-wide">มีวิชาที่ต้องเรียน!</h4>
                <p className="text-rose-600/90 text-xs font-bold m-0 leading-snug">
                  กรุณาสอบให้ผ่านเพื่อรับอนุญาตเข้าพื้นที่ปฏิบัติงาน
                </p>
              </div>
            </div>
          )}

          {/* ✨ Tip: Menu Sections - Clear Tab Hierarchy */}
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            className="custom-elearning-tabs mb-8"
            items={[
              { key: 'ALL', label: <span className="font-extrabold text-sm uppercase tracking-wider">📚 ทั้งหมด</span> },
              { key: 'REQUIRED', label: <span className="font-extrabold text-rose-500 text-sm uppercase tracking-wider flex items-center gap-2"><Badge dot color="red" offset={[8, 0]}>รอสอบ</Badge></span> },
              { key: 'COMPLETED', label: <span className="font-extrabold text-emerald-600 text-sm uppercase tracking-wider">✅ ผ่านแล้ว</span> },
            ]}
          />

          {/* ✨ Tip: Z-Pattern Card Layout + Soft Shadows + Radius Math */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-[2rem] p-2 overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.04)] border border-slate-50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(0,0,0,0.08)] group flex flex-col h-full">
                
                {/* Z-Pattern Step 1: Eye catches image first (Top-Left to Top-Right) */}
                <div className="h-40 md:h-48 w-full relative overflow-hidden bg-slate-100 rounded-[1.5rem] shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-40"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  {/* Status at Top-Right */}
                  {getStatusBadge(course.status)}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 text-white font-bold text-[10px] bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl">
                    <ClockCircleOutlined /> {course.duration}
                  </div>
                </div>

                {/* Z-Pattern Step 2 & 3: Scan down to title and description */}
                <div className="p-5 flex flex-col flex-1 bg-white relative z-20">
                  <h3 className="text-base font-black text-slate-800 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-6 line-clamp-2 flex-1 font-medium leading-relaxed">{course.description}</p>
                  
                  {/* Z-Pattern Step 4: Action at the bottom */}
                  <div className="mt-auto">
                    {course.status === 'COMPLETED' ? (
                      <Button block size="large" className="rounded-xl h-12 text-sm font-bold text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-500 hover:text-white transition-colors shadow-sm" onClick={() => window.location.href = '?page=CERTS'}>
                        ดูใบ Certificate
                      </Button>
                    ) : course.status === 'IN_PROGRESS' ? (
                      <Button block size="large" type="primary" onClick={() => handleStartCourse(course)} className="rounded-xl h-12 text-sm font-black bg-blue-600 border-none shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-lg transition-all">
                        เรียนต่อให้จบ
                      </Button>
                    ) : (
                      // Highlight required action with clear distinct UI
                      <Button block size="large" type="primary" danger onClick={() => handleStartCourse(course)} className="rounded-xl h-12 text-sm font-black bg-rose-500 border-none shadow-[0_4px_16px_rgba(244,63,94,0.3)] hover:bg-rose-600 hover:shadow-lg transition-all">
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
        /* ✨ Tip: Menu Sections applied to AntD Tabs */
        .custom-elearning-tabs .ant-tabs-nav::before { border-bottom: 2px solid #f1f5f9; }
        .custom-elearning-tabs .ant-tabs-tab { padding: 12px 0; margin-right: 32px; transition: all 0.3s; }
        .custom-elearning-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #1e293b !important; }
        .custom-elearning-tabs .ant-tabs-ink-bar { height: 4px !important; border-radius: 4px 4px 0 0; background: #2563eb; }
        
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        
        video::-webkit-media-controls { display: none !important; }
      `}</style>
    </div>
  );
}