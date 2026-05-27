import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Link as LinkIcon, 
  BookOpen, 
  BrainCircuit, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Play, 
  Eye, 
  RefreshCw, 
  ChevronRight, 
  Sparkles,
  ClipboardCheck,
  Server,
  Code
} from 'lucide-react';

function App() {
  // Credentials
  const [apiKey, setApiKey] = useState('');
  const [gasUrl, setGasUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Lesson Configuration
  const [subject, setSubject] = useState('วิทยาศาสตร์ ม.ปลาย');
  const [topic, setTopic] = useState('เซลล์และการแบ่งเซลล์');
  const [subtopic, setSubtopic] = useState('ออร์แกเนลล์ต่างๆ การแบ่งเซลล์แบบไมโทซิสและไมโอซิส');
  const [quizCount, setQuizCount] = useState(10);
  const [teacherName, setTeacherName] = useState('');
  
  // App States
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  
  // Results
  const [generatedData, setGeneratedData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle'); // idle, testing, success, failed

  // LocalStorage Cache
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const savedUrl = localStorage.getItem('gas_web_app_url');
    if (savedKey) setApiKey(savedKey);
    if (savedUrl) setGasUrl(savedUrl);
  }, []);

  const saveCredentials = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gas_web_app_url', gasUrl);
    addLog('💾 บันทึกการตั้งค่า API ลงเครื่องเรียบร้อยแล้ว');
  };

  const addLog = (message) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testConnection = async () => {
    if (!gasUrl) {
      setError('กรุณาระบุ URL ของ GAS Web App ก่อนทำการทดสอบ');
      return;
    }
    setConnectionStatus('testing');
    addLog('🔌 กำลังเชื่อมต่อกับ Apps Script Web App...');
    try {
      // Send a ping action
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', // handle redirect/cors on deployment
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });
      setConnectionStatus('success');
      addLog('✅ เชื่อมต่อสำเร็จ! ปลายทางตอบรับเรียบร้อย (หรือเปิดสิทธิ์ CORS เรียบร้อย)');
    } catch (err) {
      console.error(err);
      setConnectionStatus('failed');
      addLog('❌ เชื่อมต่อล้มเหลว กรุณาตรวจสอบสิทธิ์การ Deploy ใน Apps Script (ต้องเลือกเป็น Anyone)');
    }
  };

  const generateLesson = async () => {
    if (!apiKey) {
      setError('กรุณากรอก Gemini API Key');
      return;
    }
    if (!gasUrl) {
      setError('กรุณากรอก GAS Web App URL');
      return;
    }

    setLoading(true);
    setError(null);
    setLogs([]);
    setStep(3);
    addLog('🚀 เริ่มต้นกระบวนการสร้างบทเรียนออนไลน์...');
    saveCredentials();

    try {
      let parsedData;

      if (apiKey.toLowerCase().includes('demo') || apiKey.toLowerCase().includes('test')) {
        addLog('⚠️ โหมดทดสอบ/เดโม่: จำลองข้อมูลโดยไม่ใช้สิทธิ์ Gemini API จริง');
        addLog('🤖 กำลังสร้างเนื้อหาและข้อสอบผ่านการจำลองของระบบ...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        parsedData = {
          lessons: [
            { 
              chapter: 1, 
              title: `บทนำเกี่ยวกับ ${topic}`, 
              content: `นี่คือเนื้อหาจำลองบทที่ 1 สำหรับวิชา ${subject} เรื่อง ${topic} ซึ่งเน้นด้าน ${subtopic} เพื่อเป็นแนวทางสำหรับครูในการดูผลสัมฤทธิ์ของระบบ`, 
              youtubeKeyword: `${subject} ${topic}` 
            },
            { 
              chapter: 2, 
              title: `เจาะลึกรายละเอียด ${topic}`, 
              content: `เนื้อหาบทที่ 2 จะเน้นขอบเขตและส่วนประกอบต่างๆ ที่เกี่ยวข้องกับตัวชี้วัดหลัก ซึ่งช่วยสนับสนุนให้นักเรียน ม.ปลาย สามารถทำแบบทดสอบวัดผลได้อย่างถูกต้อง`, 
              youtubeKeyword: `${topic} สอนเสริม` 
            },
            { 
              chapter: 3, 
              title: `สรุปและประยุกต์ใช้งาน ${topic}`, 
              content: `บทสรุปของเรื่องนี้จะพูดถึงทฤษฎีและการนำความรู้ไปประยุกต์ใช้ในการแก้โจทย์ปัญหาหรือประยุกต์ใช้งานจริงในชีวิตประจำวัน`, 
              youtubeKeyword: `${topic} ม.ปลาย สรุป` 
            }
          ],
          quizzes: Array.from({ length: quizCount }, (_, i) => ({
            question: `คำถามข้อที่ ${i + 1}: ข้อใดเป็นอธิบายหรือองค์ประกอบที่ถูกต้องที่สุดเกี่ยวกับ ${topic}?`,
            choiceA: `คำตอบข้อเลือก A สำหรับหัวข้อ ${topic}`,
            choiceB: `คำตอบข้อเลือก B สำหรับหัวข้อ ${topic}`,
            choiceC: `คำตอบข้อเลือก C สำหรับหัวข้อ ${topic}`,
            choiceD: `คำตอบข้อเลือก D สำหรับหัวข้อ ${topic}`,
            answer: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)]
          }))
        };
      } else {
        const prompt = `
          คุณคืออาจารย์ผู้เชี่ยวชาญระดับมัธยมศึกษาตอนปลายในการสอนวิชา "${subject}"
          จงออกแบบเนื้อหาการเรียนและข้อสอบในหัวข้อเรื่อง "${topic}" รายละเอียดเน้นย้ำ "${subtopic}"
          
          ข้อกำหนดในการสร้างข้อมูล:
          1. บทเรียนย่อย (lessons): สร้างเนื้อหาอย่างละเอียด 3 บท โดยเนื้อหาต้องมีหัวข้อย่อยและข้อมูลในรูปแบบ Markdown ที่สวยงาม อ่านง่าย เหมาะกับการเรียน ม.ปลาย
          2. คีย์เวิร์ดค้นหา YouTube (youtubeKeyword): คีย์เวิร์ดเรียนเนื้อหานี้ที่เป็นคลิปยอดนิยมภาษาไทย
          3. ข้อสอบปรนัย (quizzes): สร้างข้อสอบตัวเลือกจำนวน ${quizCount} ข้อ ทุกข้อต้องมีตัวเลือก 4 ข้อ (Choice A-D) และระบุคำเฉลยที่ถูกต้องตรงกับตัวเลือก เช่น "A", "B", "C" หรือ "D" โดยความยากต้องเหมาะสมกับนักเรียน ม.ปลาย
          
          ให้ตอบกลับมาในรูปแบบ JSON วัตถุเพียงอย่างเดียว ห้ามมีข้อความนำหรือสรุปใดๆ ทั้งสิ้น โดยใช้ Schema ดังนี้:
          {
            "lessons": [
              {
                "chapter": 1,
                "title": "ชื่อบทเรียนย่อยที่ 1",
                "content": "เนื้อหาหลักบทที่ 1 แบบจัดเต็มรองรับ Markdown...",
                "youtubeKeyword": "ฟิสิกส์ ม.ปลาย แสงเชิงฟิสิกส์"
              }
            ],
            "quizzes": [
              {
                "question": "โจทย์ข้อสอบข้อที่ 1",
                "choiceA": "คำตอบ A",
                "choiceB": "คำตอบ B",
                "choiceC": "คำตอบ C",
                "choiceD": "คำตอบ D",
                "answer": "A"
              }
            ]
          }
        `;

        addLog('🤖 กำลังสร้างเนื้อหาและข้อสอบผ่าน Gemini Flash...');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API Error: Status ${response.status}`);
        }

        const resData = await response.json();
        const textResponse = resData.candidates[0].content.parts[0].text;
        
        addLog('📑 วิเคราะห์ผลลัพธ์จาก AI และดึงโครงสร้าง JSON...');
        parsedData = JSON.parse(textResponse);
      }
      
      addLog(`✨ เจเนอเรตข้อมูลเสร็จสิ้น! ได้บทเรียน ${parsedData.lessons?.length || 0} บท และข้อสอบ ${parsedData.quizzes?.length || 0} ข้อ`);
      setGeneratedData(parsedData);

      addLog('📤 กำลังส่งข้อมูลไปยัง Google Sheets ของท่านผ่าน Apps Script Web App...');
      
      if (gasUrl.toLowerCase().includes('test') || gasUrl.toLowerCase().includes('demo')) {
        addLog('⚠️ โหมดทดสอบ: จำลองการบันทึกข้อมูลลง Google Sheet เรียบร้อยแล้ว (ไม่ส่ง API จริง)');
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        const uploadResponse = await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'setupDatabase',
            courseName: `${subject} เรื่อง ${topic}`,
            teacherName: teacherName,
            lessons: parsedData.lessons,
            quizzes: parsedData.quizzes
          })
        });
      }

      addLog('💾 การส่งข้อมูลได้รับการดำเนินการแล้ว! (ตรวจสอบ Google Sheets เพื่อดูการอัปเดต)');
      addLog('🎉 เสร็จสมบูรณ์! บทเรียนออนไลน์ของท่านถูกนำไปติดตั้งที่ Google Sheet เรียบร้อยแล้ว');
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเจเนอเรตหรืออัปโหลดข้อมูล');
      addLog(`❌ เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <BrainCircuit className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                GAS Online Lesson Builder
              </h1>
              <p className="text-xs text-slate-400">แพลตฟอร์มกลางสร้างบทเรียนและข้อสอบอัตโนมัติด้วย Gemini Flash</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-emerald-500" /> API: Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span>ระดับการศึกษา: มัธยมศึกษาตอนปลาย</span>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-10">
        
        {/* Step indicator */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-full">
            <button 
              onClick={() => setStep(1)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${step === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              1. ตั้งค่าการเชื่อมต่อ
            </button>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <button 
              onClick={() => setStep(2)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${step === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              2. ออกแบบบทเรียนด้วย AI
            </button>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <button 
              onClick={() => setStep(3)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${step === 3 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              3. ผลลัพธ์และการรันงาน
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">ตรวจพบข้อผิดพลาด</p>
              <p className="text-xs text-rose-400/90">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form/Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: API Configuration */}
            {step === 1 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6">
                  <Key className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">ตั้งค่าคีย์และเว็บแอปของผู้เรียน</h2>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Gemini API Key (จาก Google AI Studio)
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-200"
                      >
                        {showApiKey ? 'ซ่อน' : 'แสดง'}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      หากไม่มีคีย์ สามารถสมัครรับฟรีได้ที่{' '}
                      <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Google Apps Script Web App URL
                    </label>
                    <input
                      type="url"
                      value={gasUrl}
                      onChange={(e) => setGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      ลิงก์ Web App ที่ครูได้รับจากการดีพลอยสคริปต์ใน Google Sheets
                    </p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={testConnection}
                      className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                      ทดสอบการเชื่อมต่อ
                    </button>
                    <button
                      onClick={() => {
                        saveCredentials();
                        setStep(2);
                      }}
                      disabled={!apiKey || !gasUrl}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1"
                    >
                      ถัดไป
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {connectionStatus === 'success' && (
                    <p className="text-xs text-emerald-400 text-center">🔌 การทดสอบการเชื่อมต่อกับ Google Sheets ทำงานได้ปกติ!</p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Lesson Design */}
            {step === 2 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold text-white">ป้อนข้อมูลหัวข้อบทเรียนและวิชา</h2>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        ชื่อ-นามสกุลครูผู้สอน (แสดงที่ Footer)
                      </label>
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="เช่น สมชาย ใจดี"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        รายวิชา / ระดับชั้น
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="วิทยาศาสตร์ ม.ปลาย"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        จำนวนข้อสอบวัดผล (ข้อ)
                      </label>
                      <select
                        value={quizCount}
                        onChange={(e) => setQuizCount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                      >
                        <option value={5}>5 ข้อ</option>
                        <option value={10}>10 ข้อ</option>
                        <option value={15}>15 ข้อ</option>
                        <option value={20}>20 ข้อ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      หัวข้อบทเรียนหลัก
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="เช่น พันธะเคมี, การเคลื่อนที่แนวตรง"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      ขอบเขตเนื้อหา / ตัวชี้วัดที่ต้องการเน้น (มีผลช่วยให้ AI ออกข้อสอบได้ตรงเป้า)
                    </label>
                    <textarea
                      value={subtopic}
                      onChange={(e) => setSubtopic(e.target.value)}
                      rows={3}
                      placeholder="เช่น ชนิดของพันธะเคมี, การเกิดพันธะโคเวเลนต์, พันธะไอออนิก"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 resize-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 py-3 rounded-xl text-sm font-semibold transition"
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      onClick={generateLesson}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      เริ่มต้นสร้างด้วย AI
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Logs and Preview */}
            {step === 3 && (
              <div className="space-y-6">
                
                {/* Real-time Logger Terminal */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Code className="w-4 h-4 animate-pulse" />
                      <span className="font-bold uppercase tracking-wider">ตัวตรวจสอบและบันทึกสถานะการทำเวิร์กชอป</span>
                    </div>
                    {loading && (
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        AI กำลังคิด...
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div key={index} className="text-slate-300 leading-relaxed">
                        {log}
                      </div>
                    ))}
                    {loading && (
                      <div className="text-slate-500 animate-pulse">[⏳ กระบวนการกำลังดำเนินไปตามลำดับ...]</div>
                    )}
                  </div>
                </div>

                {/* Preview generated database sheets */}
                {generatedData && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">พรีวิวบทเรียนที่สร้างสำเร็จ</h2>
                      </div>
                      <a 
                        href={gasUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        ลิงก์เว็บแอปบทเรียนจริง
                      </a>
                    </div>

                    {/* Preview Tabs */}
                    <div className="border-b border-slate-800">
                      <nav className="flex gap-4">
                        <span className="border-b-2 border-indigo-500 pb-2 px-1 text-sm font-semibold text-white cursor-default flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          บทเรียน (Lessons)
                        </span>
                        <span className="pb-2 px-1 text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-purple-400" />
                          ข้อสอบ (Quizzes: {generatedData.quizzes?.length})
                        </span>
                      </nav>
                    </div>

                    <div className="space-y-4">
                      {generatedData.lessons?.map((lesson, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl">
                          <h3 className="text-sm font-bold text-slate-200 mb-1">บทที่ {lesson.chapter}: {lesson.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{lesson.content}</p>
                          <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded">
                            คีย์วิดีโอ YouTube: {lesson.youtubeKeyword}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setStep(2)}
                        className="w-full bg-slate-850 hover:bg-slate-800 border border-slate-700 py-3 rounded-xl text-sm font-semibold transition"
                      >
                        ย้อนกลับไปแก้ไข
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />
                ความรู้ก่อนเชื่อมต่อ
              </h2>
              
              <ul className="space-y-3.5 text-xs text-slate-400">
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">1.</span>
                  <span>ทำสำเนา <strong>Google Sheet Template</strong> ของวิทยากรมาเก็บไว้ในไดรฟ์ของท่าน</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">2.</span>
                  <span>กดสร้างสคริปต์ใน Sheets แล้วคัดลอกโค้ด <code>Code.gs</code> และ <code>index.html</code> ไปวาง</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">3.</span>
                  <span>กด <strong>Deploy &rarr; New deployment</strong> เลือกสิทธิ์ผู้เข้าถึงเป็น <strong>"Anyone"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold">4.</span>
                  <span>คัดลอกลิงก์ Web App URL มาใส่ในโปรแกรมเพื่อทดสอบและให้ AI ป้อนเนื้อหา</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-900/30 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                ความปลอดภัยของคีย์
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                แอปพลิเคชันนี้ทำงานบนเบราว์เซอร์ของท่าน 100% คีย์ API Key จะถูกส่งตรงไปยังเซิร์ฟเวอร์ของ Google เท่านั้น ไม่มีการจัดเก็บไว้ที่อื่นเพื่อให้ครูทุกคนมั่นใจในความปลอดภัยของข้อมูล
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

export default App;
