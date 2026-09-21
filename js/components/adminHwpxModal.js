import { getStories, saveStories, resetStories } from "../data/stories.js";
import { getEvents, isEventPastOrToday } from "../data/events.js";

let jszipPromise = null;

// JSZip 라이브러리 온디맨드(지연) 로더
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;

  jszipPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    script.async = true;
    script.onload = () => resolve(window.JSZip);
    script.onerror = () => {
      jszipPromise = null;
      reject(new Error("JSZip 로드 실패"));
    };
    document.head.appendChild(script);
  });
  return jszipPromise;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function multiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function formatDate(story) {
  const { year, month, day } = story;
  if (!month || !day) return "";
  const d = new Date(year || 2026, month - 1, day);
  return `${year || 2026}. ${month}. ${day}.(${WEEKDAYS[d.getDay()]})`;
}

/**
 * HWPX 파일(ZIP) 내부의 section XML들을 추출하여 텍스트 및 구조 분석
 */
async function parseHwpxFile(file) {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(file);

  const sectionFiles = Object.keys(zip.files).filter(name => 
    name.startsWith("Contents/section") && name.endsWith(".xml")
  ).sort();

  if (sectionFiles.length === 0) {
    throw new Error("HWPX 파일 내부에서 본문(section.xml)을 찾을 수 없습니다.");
  }

  let fullXml = "";
  for (const sName of sectionFiles) {
    const text = await zip.files[sName].async("string");
    fullXml += "\n" + text;
  }

  return parseHwpxXmlToStory(fullXml, file.name);
}

/**
 * XML 텍스트에서 참여 이야기(Story) 데이터 스마트 파싱
 */
function parseHwpxXmlToStory(xmlText, fileName = "") {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");

  const paragraphs = [];
  const pNodes = xmlDoc.getElementsByTagName("hp:p");
  
  if (pNodes.length > 0) {
    for (let i = 0; i < pNodes.length; i++) {
      const p = pNodes[i];
      const tNodes = p.getElementsByTagName("hp:t");
      let pText = "";
      for (let j = 0; j < tNodes.length; j++) {
        pText += tNodes[j].textContent || "";
      }
      pText = pText.trim();
      if (pText) {
        paragraphs.push(pText);
      }
    }
  } else {
    const allTextNodes = xmlDoc.querySelectorAll("t, hp\\:t, text");
    allTextNodes.forEach(node => {
      const txt = (node.textContent || "").trim();
      if (txt) paragraphs.push(txt);
    });
  }

  const rawFullText = paragraphs.join("\n");

  // 1. 날짜 추출
  let year = 2026;
  let month = 9;
  let day = 1;

  const dateMatch = rawFullText.match(/(202[0-9])[\.\-\/년\s]+([0-1]?[0-9])[\.\-\/월\s]+([0-3]?[0-9])/);
  if (dateMatch) {
    year = parseInt(dateMatch[1], 10) || 2026;
    month = parseInt(dateMatch[2], 10) || 9;
    day = parseInt(dateMatch[3], 10) || 1;
  } else {
    const shortDateMatch = rawFullText.match(/([0-1]?[0-9])월\s*([0-3]?[0-9])일/);
    if (shortDateMatch) {
      month = parseInt(shortDateMatch[1], 10) || 9;
      day = parseInt(shortDateMatch[2], 10) || 1;
    }
  }

  // 2. 제목 추출
  let title = "";
  const titleKeywords = ["행사명", "연수명", "협의회명", "프로그램명", "주제", "제목"];
  for (const p of paragraphs) {
    for (const kw of titleKeywords) {
      if (p.includes(kw) && (p.includes(":") || p.includes("]"))) {
        const parts = p.split(/[:\]]/);
        if (parts.length > 1 && parts[1].trim()) {
          title = parts.slice(1).join(":").trim().replace(/\n/g, " ");
          break;
        }
      }
    }
    if (title) break;
  }

  if (!title) {
    const cleanFileName = fileName.replace(/\.hwpx$/i, "").replace(/^[0-9_\-\.\s]+/, "").trim();
    title = cleanFileName || paragraphs[0] || "서부 교육 참여 이야기";
  }

  // 3. 구분 (badge)
  let badge = "협의회";
  let badgeClass = "cat-mentoring";
  if (/연수|역량|직무|직무연수/.test(title + " " + rawFullText)) {
    badge = "연수·워크숍";
    badgeClass = "cat-workshop";
  } else if (/나눔|수업나눔|사례나눔/.test(title + " " + rawFullText)) {
    badge = "수업나눔";
    badgeClass = "cat-sharing";
  } else if (/수다박스/.test(title + " " + rawFullText)) {
    badge = "수다박스";
    badgeClass = "cat-sudabox";
  }

  // 4. 장소 및 대상/인원 (meta)
  let locationStr = "";
  let targetStr = "";

  for (const p of paragraphs) {
    if (/장소|장 소/.test(p) && p.includes(":")) {
      locationStr = p.split(":")[1].trim();
    }
    if (/대상|인원|참석|참여/.test(p) && p.includes(":")) {
      targetStr = p.split(":")[1].trim();
    }
  }

  let meta = [locationStr, targetStr].filter(Boolean).join(" · ") || "서부 관내 학교 · 교원 참여";

  // 5. 좋았던 점 (liked) 및 바라는 점 (wanted) 분리 추출
  const liked = [];
  const wanted = [];
  let currentSection = null;

  for (const p of paragraphs) {
    if (/좋았던\s*점|만족|긍정|유익|소감|성과/.test(p)) {
      currentSection = "liked";
      continue;
    } else if (/바라는\s*점|지원|요청|건의|개선|제안|향후/.test(p)) {
      currentSection = "wanted";
      continue;
    } else if (/개요|목적|내용|운영\s*내용/.test(p)) {
      currentSection = "desc";
      continue;
    }

    const cleanItem = p.replace(/^[\-•·\*\d\.\)\(\s]{1,4}\s*/, "").trim();

    if (currentSection === "liked" && cleanItem.length > 5) {
      if (!liked.includes(cleanItem)) liked.push(cleanItem);
    } else if (currentSection === "wanted" && cleanItem.length > 5) {
      if (!wanted.includes(cleanItem)) wanted.push(cleanItem);
    }
  }

  if (liked.length === 0) {
    liked.push("실무와 현장에 바로 도움이 되는 내용으로 구성되어 유익했습니다.");
    liked.push("동료 선생님들과 업무 고민을 함께 나누는 소통의 시간이 되었습니다.");
  }
  if (wanted.length === 0) {
    wanted.push("선생님들의 지속적인 성장을 위한 후속 연수 및 교류 기회 확대");
  }

  const subtitle = title.includes("부장") ? "함께 나누며 찾은 교육활동의 해법" : "현장의 생생한 이야기와 수업 성장 나눔";
  const description = `${title}에 함께 참여하여 학교별 운영 사례와 현장의 지혜를 나누고, 교실 수업과 업무에 필요한 노하우를 공유했습니다.`;
  const highlight = "편안한 만남 속에서\n동료와 나누는 배움의 지혜";

  return {
    id: `story-${year}-${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
    badge,
    badgeClass,
    year,
    month,
    day,
    kicker: `${year}학년도 2학기 수다박스`,
    title: title.replace(/\n/g, " "),
    subtitle,
    meta,
    description,
    highlight,
    liked,
    wanted
  };
}

/**
 * 캘린더/프로그램 행사 객체(Event)로부터 참여 이야기 카드 기본 데이터 생성
 */
function createStoryFromEvent(ev) {
  if (!ev) return null;

  const year = ev.year || 2026;
  const month = ev.month || 9;
  const day = ev.day || 1;

  // 제목 구성
  const title = ev.title ? ev.title.replace(/\n/g, " ").trim() : "서부 교육 프로그램";
  const subtitle = ev.subtitle ? ev.subtitle.replace(/\n/g, " ").trim() : "함께 나누며 찾은 교육활동의 해법";
  
  // 장소 및 대상
  const location = ev.location ? ev.location.trim() : "";
  const target = ev.target ? ev.target.trim() : "";
  const meta = [location, target].filter(Boolean).join(" · ") || "서부 관내 학교 · 교원 참여";

  // 구분/뱃지 (프로그램/캘린더의 구분을 그대로 적용)
  const badge = ev.categoryLabel || "협의회";
  const badgeClass = ev.categoryClass || "cat-mentoring";

  return {
    id: `story-${year}-${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
    eventId: ev.id,
    badge: badge,
    badgeClass: badgeClass,
    year: year,
    month: month,
    day: day,
    kicker: `${year}학년도 2학기 수다박스`,
    title: title,
    subtitle: subtitle,
    meta: meta,
    description: ev.description || `${title}에 함께 참여하여 학교별 운영 사례와 현장의 지혜를 나누고, 교실 수업과 업무에 필요한 노하우를 공유했습니다.`,
    highlight: "편안한 만남 속에서\n동료와 나누는 배움의 지혜",
    liked: [
      "실무와 현장에 바로 도움이 되는 내용으로 구성되어 유익했습니다.",
      "동료 선생님들과 업무 고민을 함께 나누는 소통의 시간이 되었습니다."
    ],
    wanted: [
      "선생님들의 지속적인 성장을 위한 후속 연수 및 교류 기회 확대"
    ]
  };
}

let currentParsedStory = null;
let selectedEventId = "";

/**
 * HWPX 참여 이야기 업로드 관리자 모달 열기
 */
export function openAdminHwpxModal(onUpdated) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  loadJSZip(); // 백그라운드 프리페치
  currentParsedStory = null;
  selectedEventId = "";

  const renderModal = () => {
    const existingStories = getStories();
    const allEvents = getEvents().sort((a, b) => {
      const ay = a.year || 2026, by = b.year || 2026;
      if (ay !== by) return ay - by;
      const am = a.month || 0, bm = b.month || 0;
      if (am !== bm) return am - bm;
      return (a.day || 0) - (b.day || 0);
    });

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="admin-hwpx-backdrop">
        <div class="m3-modal-dialog" style="max-width: 890px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
          
          <!-- 모달 헤더 -->
          <div class="modal-header" style="padding-bottom: 12px; border-bottom: 1.5px solid #e2e8f0; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #0e3753; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                ADMIN ONLY
              </span>
              <h2 style="font-size: 19px; font-weight: 900; color: #0e3753; margin: 0;">
                📄 HWPX 참여 이야기 등록 및 관리 (행사 연동)
              </h2>
            </div>
            <button class="modal-close-btn" id="btn-close-hwpx-modal" aria-label="닫기">✕</button>
          </div>

          <!-- 모달 본문 (스크롤 영역) -->
          <div style="overflow-y: auto; padding: 16px 2px; flex: 1;">
            
            <!-- 1단계: 행사 선택 (프로그램/캘린더의 행사 정보 및 구분 자동 연동) -->
            <div style="background: #f8fafc; border: 1.5px solid #0e3753; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <label for="select-event-for-hwpx" style="font-size: 14px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 6px;">
                  <span>🎯 1단계: 후기를 등록할 행사 선택 (프로그램·캘린더 연동)</span>
                </label>
                <span style="font-size: 12px; color: #0369a1; font-weight: 700;">
                  ✓ 선택 시 행사명·일시·장소·구분이 자동 입력됩니다.
                </span>
              </div>

              <select id="select-event-for-hwpx" class="m3-select" style="font-size: 13.5px; font-weight: 700; height: 44px; border-color: #0e3753;">
                <option value="">-- 프로그램을 선택하거나 아래에서 직접 HWPX 파일을 올리세요 --</option>
                ${allEvents.map(ev => `
                  <option value="${ev.id}" ${selectedEventId === ev.id ? 'selected' : ''}>
                    [${ev.month}월 ${ev.day}일] [${ev.categoryLabel}] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''} - ${ev.location || ''}
                  </option>
                `).join("")}
              </select>
            </div>

            <!-- 2단계: HWPX 파일 업로드 (소감, 바라는 점 등 자동 파싱) -->
            <div style="margin-bottom: 18px;">
              <div style="font-size: 14px; font-weight: 900; color: #0e3753; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span>📄 2단계: 한글 후기 요약 문서(.hwpx) 업로드</span>
                <span style="font-size: 12px; color: #64748b; font-weight: 600;">(소감 및 건의사항 자동 분석)</span>
              </div>

              <div class="excel-drop-zone" id="hwpx-drop-zone" style="border: 2px dashed #0284c7; background: #f0f9ff; padding: 22px 14px;">
                <input type="file" id="hwpx-file-input" accept=".hwpx" style="display: none;" />
                <div style="font-size: 34px; margin-bottom: 4px;">📂</div>
                <div style="font-size: 14.5px; font-weight: 800; color: #0e3753; margin-bottom: 4px;">
                  클릭하여 .hwpx 파일 선택 또는 여기로 드래그 앤 드롭
                </div>
                <div style="font-size: 12px; color: #64748b;">
                  지원 형식: 한글 표준 XML 문서 (<strong>.hwpx</strong>) · 기존 .hwp는 '다른 이름으로 저장' 후 업로드
                </div>
              </div>
            </div>

            <!-- 3단계: 파싱 및 연동된 데이터 편집 & 실시간 카드 미리보기 -->
            <div id="hwpx-edit-section" style="${currentParsedStory ? 'display: block;' : 'display: none;'} margin-bottom: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 6px;">
                <h3 style="font-size: 15.5px; font-weight: 900; color: #0e3753; margin: 0;">
                  ✨ 3단계: 참여 이야기 내용 확인 및 수정
                </h3>
                <span style="font-size: 12px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 3px 8px; border-radius: 6px;">
                  ✓ 정보 연동 및 분석 완료
                </span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start;">
                
                <!-- 좌측: 입력/수정 폼 -->
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                  
                  <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
                    <div>
                      <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">구분(뱃지)</label>
                      <input type="text" id="edit-story-badge" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.badge || '협의회')}" />
                    </div>
                    <div>
                      <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 일시 (연/월/일)</label>
                      <div style="display: flex; gap: 6px;">
                        <input type="number" id="edit-story-year" class="m3-input" style="height: 38px; font-size: 13px; width: 68px;" value="${currentParsedStory?.year || 2026}" />
                        <input type="number" id="edit-story-month" class="m3-input" style="height: 38px; font-size: 13px; width: 52px;" value="${currentParsedStory?.month || 9}" min="1" max="12" />
                        <input type="number" id="edit-story-day" class="m3-input" style="height: 38px; font-size: 13px; width: 52px;" value="${currentParsedStory?.day || 1}" min="1" max="31" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">상단 키커</label>
                    <input type="text" id="edit-story-kicker" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.kicker || '2026학년도 2학기 수다박스')}" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 제목 (한 줄로 표시)</label>
                    <input type="text" id="edit-story-title" class="m3-input" style="height: 38px; font-size: 13.5px; font-weight: 800;" value="${escapeHtml(currentParsedStory?.title || '')}" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">부제목 / 핵심 슬로건</label>
                    <input type="text" id="edit-story-subtitle" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.subtitle || '')}" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">장소 및 참여 대상/인원</label>
                    <input type="text" id="edit-story-meta" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.meta || '')}" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 요약 설명</label>
                    <textarea id="edit-story-desc" class="m3-textarea" rows="2" style="font-size: 13px;">${escapeHtml(currentParsedStory?.description || '')}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">참여 이야기 한눈에 (하이라이트)</label>
                    <textarea id="edit-story-highlight" class="m3-textarea" rows="2" style="font-size: 13px;">${escapeHtml(currentParsedStory?.highlight || '')}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #166534; display: block; margin-bottom: 4px;">💬 이런 점이 좋았어요 (줄바꿈으로 구분)</label>
                    <textarea id="edit-story-liked" class="m3-textarea" rows="3" style="font-size: 12.5px;">${escapeHtml((currentParsedStory?.liked || []).join("\n"))}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0284c7; display: block; margin-bottom: 4px;">🌱 이런 지원을 바랐어요 (줄바꿈으로 구분)</label>
                    <textarea id="edit-story-wanted" class="m3-textarea" rows="3" style="font-size: 12.5px;">${escapeHtml((currentParsedStory?.wanted || []).join("\n"))}</textarea>
                  </div>

                  <button type="button" id="btn-save-parsed-story" class="btn-m3-filled" style="height: 44px; font-size: 14.5px; font-weight: 800; justify-content: center; background: #15803d; border-radius: 10px; margin-top: 4px;">
                    🌟 이 내용으로 참여 이야기 즉시 게시
                  </button>
                </div>

                <!-- 우측: 실시간 카드 미리보기 -->
                <div>
                  <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 8px;">
                    📱 홈페이지에 표시될 카드 미리보기
                  </div>
                  <div id="hwpx-card-preview-container">
                    ${currentParsedStory ? renderPreviewCardHtml(currentParsedStory) : ''}
                  </div>
                </div>

              </div>
            </div>

            <!-- 현재 등록된 참여 이야기 목록 관리 섹션 -->
            <div style="border-top: 1.5px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <h3 style="font-size: 15.5px; font-weight: 900; color: #0e3753; margin: 0;">
                  📚 현재 게시 중인 참여 이야기 (${existingStories.length}건)
                </h3>
                <button type="button" id="btn-reset-stories-default" class="btn-admin-action danger" style="padding: 4px 10px; font-size: 12px;">
                  기본 2건으로 되돌리기
                </button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${existingStories.map((st) => `
                  <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span class="prog-category-badge ${escapeHtml(st.badgeClass || 'cat-mentoring')}" style="font-size: 11px; padding: 2px 6px;">
                          ${escapeHtml(st.badge || '참여 이야기')}
                        </span>
                        <span style="font-size: 12px; font-weight: 700; color: #64748b;">${formatDate(st)}</span>
                      </div>
                      <div style="font-size: 14px; font-weight: 800; color: #0e3753;">
                        ${escapeHtml(st.title?.replace(/\n/g, " "))}
                      </div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        ${escapeHtml(st.meta || '')}
                      </div>
                    </div>
                    <button type="button" class="btn-delete-story btn-admin-action" data-story-id="${escapeHtml(st.id)}" style="color: #dc2626; border-color: #fecdd3; padding: 4px 10px; font-size: 12px; flex-shrink: 0;">
                      삭제
                    </button>
                  </div>
                `).join("")}
              </div>
            </div>

          </div>

          <!-- 모달 푸터 -->
          <div class="modal-footer" style="padding-top: 12px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;">
            <button type="button" class="btn-m3-outlined" id="btn-bottom-close-hwpx">
              닫기
            </button>
          </div>

        </div>
      </div>
    `;

    bindModalEvents();
  };

  function renderPreviewCardHtml(story) {
    return `
      <article class="story-card" style="box-shadow: 0 4px 14px rgba(14, 55, 83, 0.08); border-radius: 16px; border: 1.5px solid #cbd5e1; background: #ffffff;">
        <div class="story-card-body" style="padding: 18px 16px;">
          <div class="story-card-top">
            <span class="prog-category-badge ${escapeHtml(story.badgeClass || 'cat-mentoring')}">
              ${escapeHtml(story.badge || '참여 이야기')}
            </span>
            <span class="story-date">${formatDate(story)}</span>
          </div>

          ${story.kicker ? `<p class="story-kicker">${escapeHtml(story.kicker)}</p>` : ''}

          <h3 class="story-title" style="font-size: 18px; margin: 4px 0 6px 0;">${escapeHtml(story.title?.replace(/\n/g, " "))}</h3>
          ${story.subtitle ? `<p class="story-subtitle" style="font-size: 13px; font-weight: 700; color: #15803d; margin: 0 0 4px 0;">${escapeHtml(story.subtitle)}</p>` : ''}
          ${story.meta ? `<p class="story-meta" style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">${escapeHtml(story.meta)}</p>` : ''}
          ${story.description ? `<p class="story-desc" style="font-size: 13px; color: #334155; line-height: 1.5;">${escapeHtml(story.description)}</p>` : ''}
        </div>

        ${story.highlight ? `
          <div class="story-highlight" style="padding: 12px 16px; background: #f0fdf4; border-top: 1px solid #dcfce7; border-bottom: 1px solid #dcfce7;">
            <p class="story-highlight-label" style="font-size: 11.5px; font-weight: 800; color: #15803d; margin: 0 0 2px 0;">참여 이야기 한눈에</p>
            <p class="story-highlight-text" style="font-size: 13.5px; font-weight: 800; color: #0e3753; margin: 0; line-height: 1.4;">${multiline(story.highlight)}</p>
          </div>
        ` : ''}

        <div style="padding: 14px 16px; background: #fafafa; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
          ${(story.liked && story.liked.length) ? `
            <div style="margin-bottom: 10px;">
              <p style="font-size: 12.5px; font-weight: 800; color: #166534; margin: 0 0 4px 0;">💬 이런 점이 좋았어요</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.5;">
                ${story.liked.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}

          ${(story.wanted && story.wanted.length) ? `
            <div>
              <p style="font-size: 12.5px; font-weight: 800; color: #0284c7; margin: 0 0 4px 0;">🌱 이런 지원을 바랐어요</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.5;">
                ${story.wanted.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function bindModalEvents() {
    const backdrop = mount.querySelector("#admin-hwpx-backdrop");
    const btnClose = mount.querySelector("#btn-close-hwpx-modal");
    const btnBottomClose = mount.querySelector("#btn-bottom-close-hwpx");
    const dropZone = mount.querySelector("#hwpx-drop-zone");
    const fileInput = mount.querySelector("#hwpx-file-input");
    const selectEvent = mount.querySelector("#select-event-for-hwpx");

    const closeModal = () => {
      if (mount) mount.innerHTML = "";
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnBottomClose) btnBottomClose.addEventListener("click", closeModal);
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    // 행사 선택 시 행사 정보(제목, 일시, 장소, 대상, 구분/뱃지 등)를 그대로 가져오기
    if (selectEvent) {
      selectEvent.addEventListener("change", (e) => {
        selectedEventId = e.target.value;
        if (!selectedEventId) return;

        const allEvents = getEvents();
        const ev = allEvents.find(item => item.id === selectedEventId);
        if (!ev) return;

        const baseStory = createStoryFromEvent(ev);
        if (currentParsedStory) {
          // 이미 HWPX 파일에서 파싱된 소감(liked), 지원(wanted) 등이 있으면 유지하면서 행사 정보만 덮어씀
          currentParsedStory = {
            ...currentParsedStory,
            badge: baseStory.badge,
            badgeClass: baseStory.badgeClass,
            year: baseStory.year,
            month: baseStory.month,
            day: baseStory.day,
            title: baseStory.title,
            subtitle: baseStory.subtitle,
            meta: baseStory.meta,
            description: baseStory.description
          };
        } else {
          currentParsedStory = baseStory;
        }

        renderModal();
      });
    }

    // HWPX 파일 선택 및 드래그앤드롭
    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#0e3753";
        dropZone.style.backgroundColor = "#e0f2fe";
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "#0284c7";
        dropZone.style.backgroundColor = "#f0f9ff";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#0284c7";
        dropZone.style.backgroundColor = "#f0f9ff";
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleHwpxFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          handleHwpxFile(e.target.files[0]);
        }
      });
    }

    async function handleHwpxFile(file) {
      if (!file.name.toLowerCase().endsWith(".hwpx")) {
        alert("⚠️ .hwpx 파일만 업로드할 수 있습니다.\n기존 .hwp 파일인 경우 한글 프로그램에서 [다른 이름으로 저장] -> [HWPX]로 저장 후 업로드해주세요.");
        return;
      }

      try {
        const parsed = await parseHwpxFile(file);

        // 만약 이미 행사를 선택한 상태라면 행사 기본 정보는 그대로 두고 HWPX의 후기 내용(liked, wanted, highlight 등)을 결합
        if (selectedEventId) {
          const allEvents = getEvents();
          const ev = allEvents.find(item => item.id === selectedEventId);
          if (ev) {
            const baseStory = createStoryFromEvent(ev);
            currentParsedStory = {
              ...baseStory,
              liked: (parsed.liked && parsed.liked.length) ? parsed.liked : baseStory.liked,
              wanted: (parsed.wanted && parsed.wanted.length) ? parsed.wanted : baseStory.wanted,
              highlight: parsed.highlight || baseStory.highlight
            };
          } else {
            currentParsedStory = parsed;
          }
        } else {
          // 행사 미선택 상태라면 HWPX의 날짜/제목과 가장 잘 매칭되는 캘린더 행사를 자동 탐색
          const allEvents = getEvents();
          const matchedEvent = allEvents.find(ev => 
            (ev.month === parsed.month && ev.day === parsed.day) ||
            (parsed.title && ev.title && (parsed.title.includes(ev.title) || ev.title.includes(parsed.title)))
          );

          if (matchedEvent) {
            selectedEventId = matchedEvent.id;
            const baseStory = createStoryFromEvent(matchedEvent);
            currentParsedStory = {
              ...baseStory,
              liked: (parsed.liked && parsed.liked.length) ? parsed.liked : baseStory.liked,
              wanted: (parsed.wanted && parsed.wanted.length) ? parsed.wanted : baseStory.wanted,
              highlight: parsed.highlight || baseStory.highlight
            };
          } else {
            currentParsedStory = parsed;
          }
        }

        renderModal();
      } catch (err) {
        console.error("HWPX 파싱 오류:", err);
        alert(`❌ HWPX 파일 분석 실패: ${err.message}`);
      }
    }

    // 폼 입력 시 실시간 미리보기 갱신
    const formInputs = [
      "edit-story-badge", "edit-story-year", "edit-story-month", "edit-story-day",
      "edit-story-kicker", "edit-story-title", "edit-story-subtitle", "edit-story-meta",
      "edit-story-desc", "edit-story-highlight", "edit-story-liked", "edit-story-wanted"
    ];

    function updatePreviewFromInputs() {
      if (!currentParsedStory) return;

      currentParsedStory.badge = mount.querySelector("#edit-story-badge")?.value.trim() || "협의회";
      currentParsedStory.year = parseInt(mount.querySelector("#edit-story-year")?.value, 10) || 2026;
      currentParsedStory.month = parseInt(mount.querySelector("#edit-story-month")?.value, 10) || 9;
      currentParsedStory.day = parseInt(mount.querySelector("#edit-story-day")?.value, 10) || 1;
      currentParsedStory.kicker = mount.querySelector("#edit-story-kicker")?.value.trim() || "";
      currentParsedStory.title = (mount.querySelector("#edit-story-title")?.value || "").replace(/\n/g, " ").trim();
      currentParsedStory.subtitle = (mount.querySelector("#edit-story-subtitle")?.value || "").replace(/\n/g, " ").trim();
      currentParsedStory.meta = mount.querySelector("#edit-story-meta")?.value.trim() || "";
      currentParsedStory.description = mount.querySelector("#edit-story-desc")?.value.trim() || "";
      currentParsedStory.highlight = mount.querySelector("#edit-story-highlight")?.value.trim() || "";
      
      const likedRaw = mount.querySelector("#edit-story-liked")?.value || "";
      currentParsedStory.liked = likedRaw.split("\n").map(s => s.trim()).filter(Boolean);

      const wantedRaw = mount.querySelector("#edit-story-wanted")?.value || "";
      currentParsedStory.wanted = wantedRaw.split("\n").map(s => s.trim()).filter(Boolean);

      const previewContainer = mount.querySelector("#hwpx-card-preview-container");
      if (previewContainer) {
        previewContainer.innerHTML = renderPreviewCardHtml(currentParsedStory);
      }
    }

    formInputs.forEach(id => {
      const el = mount.querySelector(`#${id}`);
      if (el) {
        el.addEventListener("input", updatePreviewFromInputs);
      }
    });

    // 저장 및 게시 버튼
    const btnSave = mount.querySelector("#btn-save-parsed-story");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        updatePreviewFromInputs();
        if (!currentParsedStory || !currentParsedStory.title) {
          alert("⚠️ 행사 제목을 입력해주세요.");
          return;
        }

        const stories = getStories();
        const updated = [currentParsedStory, ...stories];
        saveStories(updated);

        alert("✅ 새로운 '수다박스 참여 이야기'가 성공적으로 게시되었습니다!");
        currentParsedStory = null;
        selectedEventId = "";
        renderModal();
        if (onUpdated) onUpdated();
      });
    }

    // 기존 후기 삭제 버튼
    mount.querySelectorAll(".btn-delete-story").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.storyId;
        if (confirm("정말 이 참여 이야기를 삭제하시겠습니까?")) {
          const stories = getStories();
          const filtered = stories.filter(s => s.id !== id);
          saveStories(filtered);
          renderModal();
          if (onUpdated) onUpdated();
        }
      });
    });

    // 기본값 되돌리기
    const btnReset = mount.querySelector("#btn-reset-stories-default");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("참여 이야기를 초기 기본값(2건)으로 되돌리시겠습니까?")) {
          resetStories();
          renderModal();
          if (onUpdated) onUpdated();
        }
      });
    }
  }

  renderModal();
}
