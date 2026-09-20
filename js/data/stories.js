// 협의회·연수 참여 이야기 데이터
// 참여 후기 자료를 바탕으로 정리한 내용을 담는다.
import { persist, clearPersisted } from "./siteSync.js";

export const STORIES_STORAGE_KEY = "seobu_participation_stories_v1";

export const DEFAULT_STORIES = [
  {
    id: "story-2026-0909",
    badge: "협의회",
    badgeClass: "cat-mentoring",
    year: 2026,
    month: 9,
    day: 9,
    kicker: "2026학년도 2학기 수다박스",
    title: "연구(교육과정)부장\n협의회",
    subtitle: "함께 나누며 찾은 연구·교육과정 업무의 해법",
    meta: "카페 느티 · 연구(교육과정)부장 29명",
    description: "학교자율시간, 학교평가 등 공통의 업무 고민을 나누고, 학교별 운영 사례와 업무 효율을 높이는 노하우를 공유했습니다.",
    highlight: "편안한 만남 속에서\n동료와 나누는 업무의 지혜",
    liked: [
      "편안한 카페에서 소규모로 이야기를 나눌 수 있었습니다.",
      "현재 운영 방식을 유지하면서 동료들과 소통할 기회를 더 늘려 달라는 의견이 있었습니다."
    ],
    wanted: [
      "연구·교육과정 업무 자료와 실무 노하우 공유",
      "신규 연구부장을 위한 연수와 지속적인 교류 기회"
    ]
  },
  {
    id: "story-2026-0910",
    badge: "업무 역량 강화 연수",
    badgeClass: "cat-mentoring",
    year: 2026,
    month: 9,
    day: 10,
    kicker: "2026학년도 2학기 수다박스",
    title: "사례로 풀어보는\n학적업무 첫걸음",
    subtitle: "사례로 배우고, 질문으로 풀어본 학적업무",
    meta: "녹번초 시청각실 · 교무부장 및 희망 교원 19명",
    description: "실제 사례로 학적업무 처리 방법을 살펴보고, 사전 설문으로 모은 질문을 함께 풀며 업무에 필요한 이해를 넓혔습니다.",
    highlight: "실제 사례로 배우고\n궁금했던 업무를 함께 풀다",
    liked: [
      "실제 사례를 중심으로 배우는 구성과 대면 연수 방식에 긍정적인 의견이 있었습니다.",
      "대면·비대면 연수를 번갈아 운영하며 서로 다른 내용을 다루는 방식에 만족했습니다.",
      "연수를 자주 마련해 주는 데 대한 감사의 의견이 있었습니다."
    ],
    wanted: [
      "차년도에도 이어지는 꾸준한 학적업무 연수",
      "학생의 학적 사례별로 필요한 증빙서류에 대한 구체적인 안내"
    ]
  }
];

// 현재 참여 이야기 목록 조회
export function getStories() {
  const saved = localStorage.getItem(STORIES_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("참여 이야기 데이터를 읽지 못했습니다:", e);
    }
  }
  return DEFAULT_STORIES;
}

// 참여 이야기 목록 저장 (클라우드 동기화 포함)
export function saveStories(list) {
  if (!Array.isArray(list)) return;
  persist(STORIES_STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("stories-updated", { detail: { stories: list } }));
}

// 기본값으로 되돌리기
export function resetStories() {
  clearPersisted(STORIES_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("stories-updated", { detail: { stories: DEFAULT_STORIES } }));
}
