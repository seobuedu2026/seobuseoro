// 8개 수업나눔방 및 패들렛 링크 초기 데이터셋
export const INITIAL_PADLET_ROOMS = [
  {
    id: "room-korean",
    icon: "📖",
    iconBg: "#fce7f3",
    title: "국어·독서·도덕 수업나눔방",
    desc: "읽기·쓰기·말하기 수업 사례와 독서연계 수업을 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/korean_reading",
    badge: ""
  },
  {
    id: "room-math-science",
    icon: "🔺",
    iconBg: "#bbf7d0",
    title: "수학·과학·생태 수업나눔방",
    desc: "탐구 중심 수업과 수학적 사고를 키우는 사례를 공유합니다.",
    padletUrl: "https://padlet.com/seobuedu/math_science",
    badge: ""
  },
  {
    id: "room-social",
    icon: "🌐",
    iconBg: "#bfdbfe",
    title: "사회·슬생·창체 수업나눔방",
    desc: "민주시민교육, 세계시민교육, 사회정서교육 수업 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/social_studies",
    badge: ""
  },
  {
    id: "room-arts",
    icon: "🎨",
    iconBg: "#fef08a",
    title: "예술·체육 수업나눔방",
    desc: "음악·미술·체육 등 감성과 신체를 아우르는 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/arts_pe",
    badge: ""
  },
  {
    id: "room-sel",
    icon: "🌈",
    iconBg: "#ffedd5",
    title: "사회정서교육 수업나눔방",
    desc: "마음 성장과 관계를 돌보는 인성·사회정서 수업 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/sel_emotion",
    badge: ""
  },
  {
    id: "room-edutech",
    icon: "🤖",
    iconBg: "#f3e8ff",
    title: "AI·에듀테크 및 업무경감 수업나눔방",
    desc: "생성형 AI·에듀테크를 활용한 혁신 수업 사례를 공유합니다.",
    padletUrl: "https://padlet.com/seobuedu/ai_edutech",
    badge: ""
  },
  {
    id: "room-special",
    icon: "🤝",
    iconBg: "#fef3c7",
    title: "특수(통합)교육·상담 수업나눔방",
    desc: "모든 학생을 포용하는 통합·특수교육 사례를 나눕니다.",
    padletUrl: "https://padlet.com/seobuedu/inclusive_counseling",
    badge: ""
  },
  {
    id: "room-management",
    icon: "🌱",
    iconBg: "#dcfce7",
    title: "학급경영 인성 영어 기타 수업나눔방",
    desc: "나만의 학급운영 노하우를 나눠보세요.",
    padletUrl: "https://padlet.com/seobuedu/class_management",
    badge: ""
  }
];

export const PADLET_ROOMS = INITIAL_PADLET_ROOMS;

const ROOMS_STORAGE_KEY = "seobu_padlet_rooms_custom_v1";

// 현재 수업나눔방 목록 조회
export function getPadletRooms() {
  const saved = localStorage.getItem(ROOMS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(r => {
          if (r.badge === "링크 준비중") {
            return { ...r, badge: "" };
          }
          return r;
        });
      }
    } catch (e) {
      console.warn("Failed to parse padlet rooms from localStorage:", e);
    }
  }
  return INITIAL_PADLET_ROOMS;
}

// 수업나눔방 전체 목록 저장
export function savePadletRooms(rooms) {
  if (!Array.isArray(rooms)) return;
  localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
  window.dispatchEvent(new CustomEvent("rooms-updated", { detail: { rooms } }));
}

// 단일 수업나눔방 수정
export function updatePadletRoom(updatedRoom) {
  if (!updatedRoom || !updatedRoom.id) return false;
  const current = getPadletRooms();
  const idx = current.findIndex(r => r.id === updatedRoom.id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updatedRoom };
    savePadletRooms(current);
    return true;
  }
  return false;
}

// 새 수업나눔방 추가
export function addPadletRoom(newRoom) {
  if (!newRoom) return false;
  const current = getPadletRooms();
  const roomWithId = {
    id: newRoom.id || `room-${Date.now()}`,
    icon: newRoom.icon || "📚",
    iconBg: newRoom.iconBg || "#f0fdf4",
    title: newRoom.title || "새 수업나눔방",
    desc: newRoom.desc || "수업 나눔 자료를 공유합니다.",
    padletUrl: newRoom.padletUrl || "https://padlet.com",
    badge: newRoom.badge === "링크 준비중" ? "" : (newRoom.badge || "")
  };
  const updated = [...current, roomWithId];
  savePadletRooms(updated);
  return roomWithId;
}

// 수업나눔방 삭제
export function deletePadletRoom(roomId) {
  if (!roomId) return false;
  const current = getPadletRooms();
  const updated = current.filter(r => r.id !== roomId);
  savePadletRooms(updated);
  return true;
}

// 초기 기본값 복원
export function resetPadletRooms() {
  localStorage.removeItem(ROOMS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("rooms-updated", { detail: { rooms: INITIAL_PADLET_ROOMS } }));
  return INITIAL_PADLET_ROOMS;
}
