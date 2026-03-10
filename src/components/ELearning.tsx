import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Progress, Tabs, Badge, message, Divider, Spin } from 'antd';
import { 
  PlayCircleOutlined, CheckCircleOutlined, LockOutlined, 
  ClockCircleOutlined, BookOutlined, WarningOutlined, LeftOutlined, 
  PauseCircleOutlined, SafetyCertificateOutlined, CloseCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import ReactPlayer from 'react-player';
import axios from 'axios';

const { Title, Text } = Typography;

export default function ELearning({ currentUser }: { currentUser: any }) {
  const [currentView, setCurrentView] = useState<'LIST' | 'PLAYER' | 'EXAM' | 'RESULT'>('LIST');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playedPercent, setPlayedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); 
  const [isSaving, setIsSaving] = useState(false); 

  // 🟢 State สำหรับเก็บข้อมูลคอร์สเรียนที่ดึงมาจาก API
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // 🧪 [Mock Data] คลังข้อสอบ (ในอนาคตสามารถดึงจาก DB ได้เช่นกัน)
  const mockExamPool = [
    { q: "อุปกรณ์ PPE ใดที่จำเป็นที่สุดเมื่อทำงานบนที่สูง?", choices: ["เข็มขัดนิรภัยแบบเต็มตัว (Full Body Harness)", "แว่นตานิรภัย", "ถุงมือหนัง", "ที่อุดหู"], ans: "เข็มขัดนิรภัยแบบเต็มตัว (Full Body Harness)" },
    { q: "ระดับก๊าซออกซิเจน (O2) ที่ปลอดภัยสำหรับการทำงานคือเท่าใด?", choices: ["19.5% - 23.5%", "15.0% - 18.0%", "25.0% - 30.0%", "ต่ำกว่า 19.5%"], ans: "19.5% - 23.5%" },
    { q: "เมื่อได้ยินเสียงสัญญาณแจ้งเตือนอพยพ (Evacuation Alarm) สิ่งแรกที่ต้องทำคืออะไร?", choices: ["หยุดงาน ปิดเครื่องจักร และไปที่จุดรวมพลทันที", "เก็บเครื่องมือให้เรียบร้อยก่อน", "โทรหาหัวหน้างานเพื่อสอบถาม", "วิ่งหนีกลับบ้านทันที"], ans: "หยุดงาน ปิดเครื่องจักร และไปที่จุดรวมพลทันที" },
    { q: "ใครคือผู้ที่มีอำนาจในการสั่งหยุดงาน (Stop Work Authority) หากพบเห็นอันตรายรุนแรง?", choices: ["พนักงานทุกคน", "เฉพาะ จป. วิชาชีพ", "เฉพาะผู้จัดการโรงงาน", "เฉพาะเจ้าของพื้นที่ (Area Owner)"], ans: "พนักงานทุกคน" },
    { q: "ใบอนุญาตทำงาน (Work Permit) ประเภทงานร้อน (Hot Work) มีอายุการใช้งานสูงสุดกี่ชั่วโมงต่อกะ?", choices: ["ไม่เกิน 1 กะการทำงาน (ปกติ 8-12 ชม.)", "24 ชั่วโมง", "7 วัน", "จนกว่างานจะเสร็จ"], ans: "ไม่เกิน 1 กะการทำงาน (ปกติ 8-12 ชม.)" },
  ];

  // 🚀 ดึงข้อมูลคอร์สเรียนทั้งหมดจาก Backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        
        // 🟢 ไฮไลท์: ยิง API พร้อมแนบ user_id ของคนที่ล็อกอินไปบอกหลังบ้าน
        const res = await axios.get(`https://safetyos-backend.onrender.com/courses?user_id=${currentUser.id}`);
        
        // ข้อมูลที่ตอบกลับมาจะกลายเป็น Data จริงๆ จาก Supabase พร้อมบอกสถานะว่า ผ่านหรือยัง!
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
  // ==========================================
  // ⚙️ Logic วิดีโอ (Auto-pause)
  // ==========================================
  useEffect(() => {
    if (currentView !== 'PLAYER') return;
    const handleWindowBlur = () => {
      if (isPlaying) {
        setIsPlaying(false);
        message.warning({ content: '⚠️ วิดีโอหยุดเล่น เนื่องจากคุณสลับหน้าต่างการทำงาน', key: 'blur-warning', duration: 4 });
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [isPlaying, currentView]);

  const handleStartCourse = (course: any) => {
    setSelectedCourse(course);
    setPlayedPercent(0);
    setIsCompleted(false);
    setIsPlaying(false); 
    setCurrentView('PLAYER');
  };

  // ==========================================
  // ⚙️ Logic ห้องสอบ
  // ==========================================
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

  const handleStartExam = () => {
    const preparedQuestions = mockExamPool.map(q => ({
      ...q,
      shuffledChoices: shuffleArray(q.choices) 
    }));
    
    setQuestions(shuffleArray(preparedQuestions)); 
    setCurrentQIndex(0);
    setScore(0);
    setTimeLeft(30);
    setCurrentView('EXAM');
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

  // 🟢 ฟังก์ชันประมวลผลหลังสอบเสร็จ (ยิง API เซฟลง DB จริง)
  const processExamResult = async (finalScore: number) => {
    setCurrentView('RESULT');
    setIsSaving(true);
    
    try {
      // แปลงคะแนนเป็นเปอร์เซ็นต์
      const finalPercentage = Math.floor((finalScore / questions.length) * 100);

      // 🚀 ยิง API ส่งคะแนนไปที่ Backend
      const res = await axios.post('https://safetyos-backend.onrender.com/training-records', {
        user_id: currentUser.id,
        course_id: selectedCourse.id,
        score: finalPercentage
      });
      
      // ถ้า API ตอบกลับว่าผ่าน ระบบจะสร้าง Certificate ให้ที่หลังบ้านอัตโนมัติ
      if (res.data.isPassed) {
        message.success('🎉 บันทึกผลการสอบสำเร็จ! คุณได้รับใบ Certificate แล้ว');
        
        // อัปเดตสถานะในหน้าบ้านให้เป็นผ่านแล้ว (ชั่วคราว ไม่ต้องดึง API ใหม่)
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
      <div className="w-full max-w-2xl mx-auto pt-10 pb-16 px-4 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          
          {isSaving ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Spin size="large" />
              <h3 className="text-xl font-bold text-slate-700 mt-6">กำลังบันทึกผลสอบ...</h3>
              <p className="text-slate-400">กรุณารอสักครู่ ระบบกำลังอัปเดต E-Passport ของคุณ</p>
            </div>
          ) : (
            <>
              {isPassed ? (
                <div className="mb-6 animate-fade-in">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <SafetyCertificateOutlined className="text-emerald-500 text-5xl" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">ยินดีด้วย! คุณสอบผ่าน 🎉</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">คุณผ่านการทดสอบหลักสูตร "{selectedCourse.title}" เรียบร้อยแล้ว</p>
                </div>
              ) : (
                <div className="mb-6 animate-fade-in">
                  <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloseCircleOutlined className="text-rose-500 text-5xl" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800">เสียใจด้วย คุณสอบไม่ผ่าน 😢</h2>
                  <p className="text-slate-500 mt-2 text-sm md:text-base">กรุณาทบทวนเนื้อหาและลองทำแบบทดสอบใหม่อีกครั้ง</p>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">คะแนนของคุณ</h3>
                <div className="text-5xl font-black mb-2">
                  <span className={isPassed ? "text-emerald-500" : "text-rose-500"}>{score}</span> 
                  <span className="text-slate-300 text-3xl"> / {questions.length}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 m-0 bg-white inline-block px-3 py-1 rounded-full shadow-sm">เกณฑ์การผ่าน: {passScore} คะแนน (80%)</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isPassed ? (
                  <>
                    <Button size="large" onClick={handleBackToList} className="h-14 px-8 rounded-2xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">กลับหน้าหลัก</Button>
                    <Button size="large" type="primary" onClick={() => window.location.href = '?page=E_PASSPORT'} className="h-14 px-8 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_8px_20px_rgba(16,185,129,0.3)]">ตรวจสอบ E-Passport</Button>
                  </>
                ) : (
                  <>
                    <Button size="large" onClick={() => setCurrentView('PLAYER')} className="h-14 px-8 rounded-2xl font-bold bg-slate-100 border-none text-slate-600 hover:bg-slate-200">กลับไปดูวิดีโอ</Button>
                    <Button size="large" type="primary" onClick={handleStartExam} icon={<ReloadOutlined />} className="h-14 px-8 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 border-none shadow-[0_8px_20px_rgba(37,99,235,0.3)]">สอบใหม่อีกครั้ง</Button>
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
      <div className="w-full max-w-3xl mx-auto pt-6 pb-16 px-4 animate-fade-in">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 m-0">Final Exam</h2>
            <p className="text-slate-500 text-sm font-medium m-0 truncate max-w-[200px] md:max-w-md">{selectedCourse.title}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">คำถามที่</span>
            <span className="text-xl font-black text-indigo-600">{currentQIndex + 1} <span className="text-slate-300">/ {questions.length}</span></span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
          <ClockCircleOutlined className={`text-2xl ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <div className="flex-1">
            <Progress percent={timeRatio * 100} showInfo={false} strokeColor={timerColor} trailColor="#f1f5f9" className="m-0" />
          </div>
          <div className={`font-black text-xl w-10 text-right ${timeLeft <= 5 ? 'text-rose-500' : 'text-slate-700'}`}>{timeLeft}s</div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-8">
            <span className="text-indigo-500 mr-2">Q{currentQIndex + 1}.</span> 
            {currentQ.q}
          </h3>

          <div className="flex flex-col gap-3">
            {currentQ.shuffledChoices.map((choice: string, idx: number) => (
              <button 
                key={idx}
                onClick={() => handleAnswerSubmit(choice)}
                className="w-full text-left p-4 md:p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all group focus:outline-none focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    {String.fromCharCode(65 + idx)} 
                  </div>
                  <span className="font-semibold text-slate-700 text-sm md:text-base">{choice}</span>
                </div>
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
      <div className="w-full max-w-5xl mx-auto pb-16 px-4 md:px-0 animate-fade-in">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <Button type="default" icon={<LeftOutlined />} onClick={handleBackToList} className="rounded-xl font-bold bg-white text-slate-600 border-slate-200 shadow-sm hover:border-slate-300 w-fit">
            กลับหน้ารวมวิชา
          </Button>
          <div className="hidden md:block w-px h-6 bg-slate-300"></div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 m-0 truncate">{selectedCourse.title}</h2>
        </div>

        <div className="bg-white p-2 md:p-3 rounded-3xl shadow-xl border border-slate-100 mb-8">
          <div className="bg-black rounded-2xl overflow-hidden relative aspect-video group">
            
            <div className="w-full h-full relative">
              <ReactPlayer
                ref={playerRef}
                url={selectedCourse.videoUrl} 
                playing={isPlaying}
                controls={false} 
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
                onProgress={(state) => setPlayedPercent(Math.floor(state.played * 100))}
                onEnded={() => setIsCompleted(true)}
              />
            </div>
            
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-colors hover:bg-black/10" 
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {!isPlaying && (
                <div className="bg-blue-600/80 backdrop-blur-md w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.6)] transform transition-transform hover:scale-110">
                  <PlayCircleOutlined className="text-white text-4xl md:text-5xl ml-1" />
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none transition-opacity duration-300">
              <div className="flex justify-between items-center text-white/90 text-xs font-bold mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  {isPlaying ? <span className="text-emerald-400 flex items-center gap-1"><PlayCircleOutlined /> กำลังเล่น</span> : <span className="text-amber-400 flex items-center gap-1"><PauseCircleOutlined /> หยุดชั่วคราว</span>}
                </span>
                <span>ความคืบหน้า <span className="text-blue-400 text-sm ml-1">{playedPercent}%</span></span>
              </div>
              <Progress percent={playedPercent} showInfo={false} strokeColor="#3b82f6" trailColor="rgba(255,255,255,0.2)" size={["100%", 6]} className="m-0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 font-bold mb-3">
              <BookOutlined className="text-blue-500" /> รายละเอียดหลักสูตร
            </div>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed m-0">{selectedCourse.description}</p>
            <Divider className="my-6 border-slate-100" />
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3">
              <WarningOutlined className="text-rose-500 text-xl mt-0.5" />
              <div>
                <h4 className="text-rose-700 font-bold text-sm m-0 mb-1">กฎการเรียนรู้สายแข็ง (Strict Mode)</h4>
                <p className="text-rose-600 text-xs m-0 leading-relaxed">
                  1. ห้ามกดกรอวิดีโอข้ามเด็ดขาด ระบบจะบันทึกความคืบหน้าตามเวลาจริง<br/>
                  2. หากคุณสลับแท็บเบราว์เซอร์ไปหน้าอื่น วิดีโอจะหยุดเล่นอัตโนมัติ<br/>
                  3. ต้องรับชมจนครบ 100% ปุ่มทำข้อสอบถึงจะปรากฏขึ้น
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-6 md:p-8 rounded-3xl shadow-inner border border-slate-200 flex flex-col justify-center items-center text-center h-full">
            <SafetyCertificateOutlined className="text-4xl text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-700 mb-2">บททดสอบ (Final Exam)</h3>
            <p className="text-xs text-slate-500 mb-6">คุณต้องผ่านการทดสอบ 80% ขึ้นไปเพื่อรับใบรับรอง</p>

            {isCompleted ? (
              <Button size="large" type="primary" onClick={handleStartExam} className="w-full h-14 rounded-2xl text-base font-black bg-emerald-500 hover:bg-emerald-600 border-none shadow-[0_10px_20px_rgba(16,185,129,0.3)] animate-bounce">
                เริ่มทำข้อสอบ
              </Button>
            ) : (
              <Button size="large" disabled className="w-full h-14 rounded-2xl text-sm font-bold bg-slate-200 text-slate-400 border-none flex items-center justify-center gap-2">
                <LockOutlined /> รอวิดีโอจบ 100%
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 📚 RENDER: หน้ารวมหลักสูตร (Dashboard)
  // ==========================================
  const filteredCourses = courses.filter(course => {
    if (activeTab === 'REQUIRED') return course.status === 'REQUIRED' || course.status === 'IN_PROGRESS';
    if (activeTab === 'COMPLETED') return course.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUIRED': return <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] md:text-xs font-black px-3 py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-rose-400/50"><WarningOutlined /> บังคับเรียน</div>;
      case 'IN_PROGRESS': return <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] md:text-xs font-black px-3 py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-amber-300/50"><PlayCircleOutlined className="animate-pulse" /> กำลังเรียน</div>;
      case 'COMPLETED': return <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] md:text-xs font-black px-3 py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-400/50"><CheckCircleOutlined /> สอบผ่านแล้ว</div>;
      default: return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 px-4 md:px-6 lg:px-8">
      <div className="mb-8 md:mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 m-0 flex items-center justify-center md:justify-start gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/20"><BookOutlined /></div>
            E-Learning Center
          </h2>
          <p className="text-slate-500 mt-2 md:mt-3 font-medium text-sm md:text-base">ศูนย์การเรียนรู้และทดสอบด้านความปลอดภัย (SafetyOS)</p>
        </div>
      </div>

      {isLoadingCourses ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spin size="large" />
          <p className="text-slate-500 mt-4 font-bold">กำลังตรวจสอบรายวิชาที่บังคับเรียน...</p>
        </div>
      ) : (
        <>
          {courses.some(c => c.status === 'REQUIRED') && (
            <div className="bg-gradient-to-r from-rose-50 to-red-50 border-l-4 border-rose-500 p-5 md:p-6 rounded-r-2xl rounded-l-md mb-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 shadow-sm">
              <div className="bg-white text-rose-500 p-3 md:p-4 rounded-full shadow-md shrink-0"><LockOutlined className="text-2xl md:text-3xl" /></div>
              <div>
                <h4 className="text-rose-800 font-black text-lg md:text-xl m-0 mb-1">คุณมีหลักสูตรบังคับที่ต้องเรียน!</h4>
                <p className="text-rose-600 text-sm md:text-base font-medium m-0">กรุณาเรียนและสอบให้ผ่าน เพื่อปลดล็อกสิทธิ์ในการขอ Work Permit ระบบจะไม่ให้คุณเริ่มงานจนกว่าจะสอบผ่าน</p>
              </div>
            </div>
          )}

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            className="custom-elearning-tabs mb-8"
            items={[
              { key: 'ALL', label: <span className="font-bold text-sm md:text-base">📚 หลักสูตรทั้งหมด</span> },
              { key: 'REQUIRED', label: <span className="font-bold text-rose-500 text-sm md:text-base flex items-center gap-1.5"><Badge dot color="red" offset={[5, 0]}>รอสอบ (Pending)</Badge></span> },
              { key: 'COMPLETED', label: <span className="font-bold text-emerald-600 text-sm md:text-base">✅ ผ่านแล้ว (Completed)</span> },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-[2rem] overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] group flex flex-col h-full">
                <div className="h-48 md:h-56 w-full relative overflow-hidden bg-slate-200 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  {getStatusBadge(course.status)}
                  <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 text-white/90 text-xs md:text-sm font-bold bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10"><ClockCircleOutlined /> {course.duration}</div>
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-1 bg-white relative z-20">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 leading-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-3 md:line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                  
                  <div className="mt-auto">
                    {course.status === 'COMPLETED' ? (
                      <Button block size="large" className="rounded-2xl h-12 md:h-14 text-sm md:text-base font-black text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors" onClick={() => window.location.href = '?page=E_PASSPORT'}>
                        ดูใบ Certificate ของฉัน
                      </Button>
                    ) : course.status === 'IN_PROGRESS' ? (
                      <Button block size="large" type="primary" onClick={() => handleStartCourse(course)} className="rounded-2xl h-12 md:h-14 text-sm md:text-base font-black bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_25px_-6px_rgba(79,70,229,0.5)] transition-all">เรียนต่อให้จบ</Button>
                    ) : (
                      <Button block size="large" type="primary" danger onClick={() => handleStartCourse(course)} className="rounded-2xl h-12 md:h-14 text-sm md:text-base font-black bg-gradient-to-r from-rose-500 to-red-600 border-none shadow-[0_8px_20px_-6px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_25px_-6px_rgba(225,29,72,0.5)] transition-all">เริ่มเรียนทันที</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .custom-elearning-tabs .ant-tabs-nav::before { border-bottom: 2px solid #e2e8f0; }
        .custom-elearning-tabs .ant-tabs-tab { padding: 16px 0; margin-right: 32px; transition: all 0.3s; }
        .custom-elearning-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #1e293b !important; transform: scale(1.05); }
        .custom-elearning-tabs .ant-tabs-ink-bar { height: 4px !important; border-radius: 4px 4px 0 0; background: #4f46e5; }
        @media (max-width: 768px) { .custom-elearning-tabs .ant-tabs-tab { margin-right: 16px; } }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}