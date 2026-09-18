// 8개 수업나눔방 및 패들렛 링크 데이터셋
export const PADLET_ROOMS = [
  {
    id: "room-korean",
    subjectTag: "국어 · 독서",
    title: "국어·독서·도덕 수업나눔방",
    desc: "읽기·쓰기·말하기 수업 사례와 독서연계 수업을 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/korean_reading",
    bgColor: "#dbeafe", // 연한 하늘색
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="20" width="70" height="80" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="4"/>
        <path d="M35 38H85M35 52H85M35 66H70M35 80H60" stroke="#93c5fd" stroke-width="4" stroke-linecap="round"/>
        <rect x="72" y="26" width="12" height="24" rx="2" fill="#f59e0b"/>
        <polygon points="78,44 72,50 84,50" fill="#d97706"/>
        <path d="M25 20V100" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "room-math-science",
    subjectTag: "수학 · 과학",
    title: "수학·과학·생태 수업나눔방",
    desc: "탐구 중심 수업과 수학적 사고를 키우는 사례를 공유합니다.",
    padletUrl: "https://padlet.com/seobuedu/math_science",
    bgColor: "#d1fae5", // 민트그린
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,20 95,85 25,85" stroke="#059669" stroke-width="5" fill="none" stroke-linejoin="round"/>
        <!-- 나눗셈 기호 -->
        <circle cx="15" cy="55" r="3" fill="#059669"/>
        <line x1="8" y1="62" x2="22" y2="62" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
        <circle cx="15" cy="69" r="3" fill="#059669"/>
        <!-- 등호 -->
        <line x1="98" y1="58" x2="114" y2="58" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
        <line x1="98" y1="66" x2="114" y2="66" stroke="#059669" stroke-width="3" stroke-linecap="round"/>
        <!-- 덧셈 기호 -->
        <line x1="60" y1="92" x2="60" y2="108" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
        <line x1="52" y1="100" x2="68" y2="100" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "room-social",
    subjectTag: "사회 · 도덕 역사",
    title: "사회·슬생·창체 수업나눔방",
    desc: "민주시민교육, 세계시민교육, 사회정서교육 수업 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/social_studies",
    bgColor: "#ede9fe", // 연보라
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="38" fill="#60a5fa" stroke="#3b82f6" stroke-width="2"/>
        <ellipse cx="60" cy="60" rx="38" ry="14" stroke="#ffffff" stroke-width="2" stroke-dasharray="3 3"/>
        <circle cx="45" cy="45" r="8" fill="#4ade80"/>
        <circle cx="78" cy="48" r="6" fill="#4ade80"/>
        <circle cx="50" cy="75" r="9" fill="#4ade80"/>
        <circle cx="75" cy="72" r="7" fill="#4ade80"/>
      </svg>
    `
  },
  {
    id: "room-arts",
    subjectTag: "예술 · 체육",
    title: "예술·체육 수업나눔방",
    desc: "음악·미술·체육 등 감성과 신체를 아우르는 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/arts_pe",
    bgColor: "#fef3c7", // 연노랑
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="55" r="32" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
        <circle cx="55" cy="40" r="5" fill="#ef4444"/>
        <circle cx="70" cy="32" r="5" fill="#f97316"/>
        <circle cx="86" cy="36" r="5" fill="#eab308"/>
        <circle cx="96" cy="50" r="5" fill="#22c55e"/>
        <circle cx="94" cy="68" r="5" fill="#3b82f6"/>
        <circle cx="80" cy="80" r="5" fill="#a855f7"/>
        <path d="M35 90L55 50" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
        <path d="M55 50L58 44" stroke="#3b82f6" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "room-sel",
    subjectTag: "인성 사회정서교육",
    title: "사회정서교육 수업나눔방",
    desc: "마음챙김과 긍정적 관계 맺기를 위한 실천 사례를 공유합니다.",
    padletUrl: "https://padlet.com/seobuedu/sel_emotion",
    bgColor: "#f3e8ff", // 연보라/라일락
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 무지개 아치들 -->
        <path d="M20 85A40 40 0 0 1 100 85" stroke="#f43f5e" stroke-width="5" fill="none"/>
        <path d="M26 85A34 34 0 0 1 94 85" stroke="#fb923c" stroke-width="5" fill="none"/>
        <path d="M32 85A28 28 0 0 1 88 85" stroke="#facc15" stroke-width="5" fill="none"/>
        <path d="M38 85A22 22 0 0 1 82 85" stroke="#4ade80" stroke-width="5" fill="none"/>
        <path d="M44 85A16 16 0 0 1 76 85" stroke="#60a5fa" stroke-width="5" fill="none"/>
        <!-- 구름들 -->
        <path d="M15 88C15 84 20 80 26 82C28 78 35 78 38 82C44 80 48 85 46 88Z" fill="#ffffff"/>
        <path d="M74 88C74 84 79 80 85 82C87 78 94 78 97 82C103 80 107 85 105 88Z" fill="#ffffff"/>
      </svg>
    `
  },
  {
    id: "room-edutech",
    subjectTag: "AI · 에듀테크",
    title: "AI·에듀테크 및 업무경감 수업나눔방",
    desc: "생성형 AI·에듀테크를 활용한 혁신 수업 사례를 공유합니다.",
    padletUrl: "https://padlet.com/seobuedu/ai_edutech",
    bgColor: "#fee2e2", // 연한 코랄핑크
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="24" width="76" height="52" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="3"/>
        <rect x="26" y="28" width="68" height="44" rx="4" fill="#2563eb"/>
        <path d="M50 76V90M70 76V90M40 90H80" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
        <!-- 화면 내부 그래픽 -->
        <line x1="32" y1="36" x2="52" y2="36" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
        <line x1="32" y1="44" x2="44" y2="44" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
        <circle cx="56" cy="52" r="5" fill="#facc15"/>
        <circle cx="70" cy="56" r="4" fill="#ffffff"/>
        <circle cx="78" cy="44" r="3" fill="#60a5fa"/>
        <!-- 작은 귀여운 AI 뱃지 -->
        <rect x="74" y="16" width="20" height="18" rx="4" fill="#818cf8"/>
        <circle cx="80" cy="24" r="2" fill="#ffffff"/>
        <circle cx="88" cy="24" r="2" fill="#ffffff"/>
        <path d="M82 28C84 30 86 30 88 28" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "room-special",
    subjectTag: "통합 · 특수교육",
    title: "특수(통합)교육·상담 수업나눔방",
    desc: "모든 학생을 포용하는 통합·특수교육 수업 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/inclusive_counseling",
    bgColor: "#dcfce7", // 민트그린
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 세 사람 연결 구조 -->
        <!-- 중앙 사람 -->
        <circle cx="60" cy="40" r="8" fill="#10b981"/>
        <path d="M52 56C52 50 68 50 68 56V66H52V56Z" fill="#10b981"/>
        <!-- 왼쪽 사람 -->
        <circle cx="34" cy="62" r="7" fill="#10b981"/>
        <path d="M26 76C26 71 42 71 42 76V84H26V76Z" fill="#10b981"/>
        <!-- 오른쪽 사람 -->
        <circle cx="86" cy="62" r="7" fill="#10b981"/>
        <path d="M78 76C78 71 94 71 94 76V84H78V76Z" fill="#10b981"/>
        <!-- 연결선 -->
        <line x1="38" y1="74" x2="56" y2="60" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
        <line x1="82" y1="74" x2="64" y2="60" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
        <line x1="42" y1="78" x2="78" y2="78" stroke="#059669" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `
  },
  {
    id: "room-management",
    subjectTag: "학급경영 기타",
    title: "학급경영 인성 영어 기타",
    desc: "나만의 학급운영 노하우를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/class_management",
    bgColor: "#d1fae5", // 연초록
    illustration: `
      <svg viewBox="0 0 120 120" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 화분 -->
        <ellipse cx="60" cy="92" rx="22" ry="10" fill="#b45309"/>
        <path d="M40 92L44 104C44 107 76 107 76 104L80 92Z" fill="#92400e"/>
        <!-- 줄기 -->
        <path d="M60 92V46" stroke="#15803d" stroke-width="5" stroke-linecap="round"/>
        <!-- 잎사귀들 -->
        <ellipse cx="60" cy="34" rx="8" ry="16" fill="#22c55e"/>
        <path d="M60 54C48 50 44 38 48 34C54 30 62 44 60 54Z" fill="#16a34a"/>
        <path d="M60 62C72 58 76 46 72 42C66 38 58 52 60 62Z" fill="#22c55e"/>
        <path d="M60 76C46 72 42 60 46 56C52 52 62 66 60 76Z" fill="#15803d"/>
        <path d="M60 78C74 74 78 62 74 58C68 54 58 68 60 78Z" fill="#4ade80"/>
      </svg>
    `
  }
];
