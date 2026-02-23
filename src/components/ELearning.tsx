import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, message, Radio, Row, Col, Progress, Result, Tag, Alert } from 'antd';
import { PlayCircleOutlined, FormOutlined, CheckCircleOutlined, BookOutlined, VideoCameraOutlined } from '@ant-design/icons';

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

  // 🚀 ฟังก์ชันพระเอก! ช่วยแปลงลิงก์ YouTube ปกติ ให้กลายเป็นลิงก์สำหรับ Embed อัตโนมัติ
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        return url; // ถ้าเป็น embed อยู่แล้ว ให้ส่งกลับไปเลย
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url; // ถ้าไม่ใช่ลิงก์ YouTube เลย ให้ส่งกลับแบบเดิม
    } catch (e) {
      return url;
    }
  };

  const glassPanel = { background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)' };

  return (
    <div className="space-y-6">
      <Title level={3} style={{ color: '#1d1d1f' }}><BookOutlined /> ระบบอบรมความปลอดภัย (E-Learning)</Title>

      {/* --- สเต็ปที่ 1: เลือกวิชา --- */}
      {step === 'SELECT_COURSE' && (
        <Row gutter={[16, 16]}>
          {courses.map(course => (
            <Col xs={24} md={12} lg={8} key={course.id}>
              <Card hoverable style={glassPanel} bodyStyle={{ padding: '24px' }}>
                <Tag color="blue" style={{ marginBottom: '12px' }}>หลักสูตรบังคับ</Tag>
                <Title level={5}>{course.title}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '16px', minHeight: '44px' }}>
                  {course.description || 'ไม่มีคำอธิบาย'}
                </Text>
                <Alert message={`เกณฑ์ผ่าน: ${course.passing_score}%`} type="info" showIcon style={{ marginBottom: '16px', borderRadius: '8px' }} />
                
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />} 
                  size="large" 
                  block 
                  style={{ borderRadius: '8px', background: '#007AFF' }}
                  onClick={() => handleStartCourse(course)}
                  disabled={currentUser?.role !== 'CONTRACTOR'}
                >
                  {currentUser?.role === 'CONTRACTOR' ? 'เริ่มเรียนและสอบ' : 'สำหรับผู้รับเหมาเท่านั้น'}
                </Button>
              </Card>
            </Col>
          ))}
          {courses.length === 0 && <Text type="secondary">ยังไม่มีหลักสูตรในระบบ...</Text>}
        </Row>
      )}

      {/* --- สเต็ปที่ 2: ดูวิดีโอ --- */}
      {step === 'WATCH_VIDEO' && selectedCourse && (
        <Card style={glassPanel} bodyStyle={{ padding: '32px', textAlign: 'center' }}>
          <Title level={4}>{selectedCourse.title}</Title>
          <Text type="secondary">กรุณาดูวิดีโอให้จบก่อนทำแบบทดสอบ</Text>
          
          <div style={{ margin: '24px auto', maxWidth: '800px', background: '#000', borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* 🚀 เรียกใช้ฟังก์ชัน getEmbedUrl ตรงนี้ */}
            {selectedCourse.video_url ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={getEmbedUrl(selectedCourse.video_url)} 
                title="Training Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div style={{ color: '#fff', textAlign: 'center' }}>
                <VideoCameraOutlined style={{ fontSize: '48px', marginBottom: '16px', color: 'rgba(255,255,255,0.5)' }} />
                <br />
                <Text style={{ color: '#fff' }}>[พื้นที่แสดงวิดีโอ] <br/> (สามารถแนบลิงก์ YouTube ได้ในระบบหลังบ้าน)</Text>
              </div>
            )}
          </div>

          <Space size="middle">
            <Button onClick={resetState}>กลับไปหน้าเลือกวิชา</Button>
            <Button type="primary" size="large" icon={<FormOutlined />} onClick={() => setStep('TAKE_QUIZ')} style={{ borderRadius: '8px', background: '#34c759', border: 'none' }}>
              ดูจบแล้ว ไปทำแบบทดสอบ
            </Button>
          </Space>
        </Card>
      )}

      {/* --- สเต็ปที่ 3: ทำแบบทดสอบ --- */}
      {step === 'TAKE_QUIZ' && selectedCourse && (
        <Card style={glassPanel} title={<Title level={4} style={{ margin: 0 }}><FormOutlined /> แบบทดสอบ: {selectedCourse.title}</Title>}>
          <Alert message={`คำชี้แจง: มีทั้งหมด ${MOCK_QUESTIONS.length} ข้อ ต้องได้คะแนน ${selectedCourse.passing_score}% ขึ้นไปจึงจะผ่าน`} type="warning" showIcon style={{ marginBottom: '24px', borderRadius: '8px' }} />
          
          <div className="space-y-8">
            {MOCK_QUESTIONS.map((q, index) => (
              <div key={q.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px' }}>
                <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>
                  ข้อ {index + 1}. {q.question}
                </Text>
                <Radio.Group onChange={(e) => handleAnswer(q.id, e.target.value)} value={answers[q.id]}>
                  <Space direction="vertical">
                    {q.options.map((opt, optIdx) => (
                      <Radio key={optIdx} value={optIdx}>{opt}</Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Button type="primary" size="large" onClick={handleSubmitQuiz} loading={isSubmitting} icon={<CheckCircleOutlined />} style={{ borderRadius: '8px', width: '200px' }}>
              ส่งคำตอบ
            </Button>
          </div>
        </Card>
      )}

      {/* --- สเต็ปที่ 4: ผลการสอบ --- */}
      {step === 'RESULT' && scoreResult && (
        <Card style={glassPanel}>
          <Result
            status={scoreResult.passed ? 'success' : 'error'}
            title={scoreResult.passed ? '🎉 ยินดีด้วย! คุณสอบผ่าน' : '❌ เสียใจด้วย คุณสอบไม่ผ่าน'}
            subTitle={`คุณทำคะแนนได้ ${scoreResult.score}% (เกณฑ์ผ่านคือ ${selectedCourse?.passing_score}%)`}
            extra={[
              <Button type="primary" key="console" onClick={resetState} style={{ borderRadius: '8px' }}>
                กลับสู่หน้าหลัก
              </Button>,
              !scoreResult.passed && (
                <Button key="buy" onClick={() => setStep('TAKE_QUIZ')} style={{ borderRadius: '8px' }}>
                  สอบใหม่อีกครั้ง
                </Button>
              )
            ]}
          />
        </Card>
      )}
    </div>
  );
}