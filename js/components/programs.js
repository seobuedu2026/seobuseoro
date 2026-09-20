import { getEvents, isEventPastOrToday, getActiveMonths, getCategories, resolveApplyLink } from "../data/events.js?v=20260920_v75";
import { GoogleAuthService } from "../auth/googleAuth.js?v=20260920_v75";
import { openEventFormModal } from "./eventFormModal.js?v=20260920_v75";
import { openCategoryManagerModal } from "./categoryManagerModal.js?v=20260920_v75";

let selectedCategory = "all";
let selectedMonth = "all";
let searchQuery = "";

// 보기 설정(정렬·열 수)은 개인 취향이므로 이 브라우저에만 저장한다.
const VIEW_PREF_KEY = "seobu_programs_view_pref_v1";

const SORT_OPTIONS = [
  { key: "date-asc", label: "날짜 빠른순" },
  { key: "date-desc", label: "날짜 늦은순" },
  { key: "title-asc", label: "이름순 (가나다)" },
  { key: "category", label: "유형순" }
];

function loadViewPref() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_PREF_KEY) || "{}");
    return {
      sort: SORT_OPTIONS.some(o => o.key === saved.sort) ? saved.sort : "date-asc",
      columns: [2, 3, 4].includes(saved.columns) ? saved.columns : 3
    };
  } catch (e) {
    return { sort: "date-asc", columns: 3 };
  }
}

let viewPref = loadViewPref();

function saveViewPref() {
  try {
    localStorage.setItem(VIEW_PREF_KEY, JSON.stringify(viewPref));
  } catch (e) {
    // 저장 실패해도 화면 동작에는 영향 없음
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 검색어가 행사 정보와 맞는지 확인 (여러 단어는 모두 포함해야 함)
function matchesSearch(ev, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    ev.title, ev.subtitle, ev.location, ev.target,
    ev.description, ev.categoryLabel, ev.applyMethod,
    `${ev.month}월`, `${ev.month}월 ${ev.day}일`
  ].filter(Boolean).join(" ").toLowerCase();

  return q.split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
}

// 날짜 비교용 숫자 (예: 2026년 9월 15일 → 20260915)
function dateValue(ev) {
  const year = parseInt(ev.year, 10) || 2026;
  const month = parseInt(ev.month, 10) || 0;
  const day = typeof ev.day === "number"
    ? ev.day
    : parseInt(String(ev.day).replace(/\D/g, '') || '99', 10);
  return year * 10000 + month * 100 + day;
}

function compareEvents(a, b) {
  switch (viewPref.sort) {
    case "date-desc":
      return dateValue(b) - dateValue(a);
    case "title-asc":
      return String(a.title || "").localeCompare(String(b.title || ""), "ko");
    case "category": {
      const catDiff = String(a.categoryLabel || "").localeCompare(String(b.categoryLabel || ""), "ko");
      return catDiff !== 0 ? catDiff : dateValue(a) - dateValue(b);
    }
    default:
      return dateValue(a) - dateValue(b);
  }
}

function getFilteredEvents() {
  return getEvents().filter(ev => {
    const matchCat = selectedCategory === "all" || ev.category === selectedCategory;
    const matchMonth = selectedMonth === "all" || String(ev.month) === selectedMonth;
    return matchCat && matchMonth && matchesSearch(ev, searchQuery);
  }).sort(compareEvents);
}

function buildCardsHTML(filteredEvents, isAdmin) {
  if (filteredEvents.length === 0) {
    const hasFilter = searchQuery.trim() || selectedCategory !== "all" || selectedMonth !== "all";
    return `
      <div class="prog-empty-state">
        <div class="prog-empty-icon">🔍</div>
        <p class="prog-empty-title">
          ${searchQuery.trim()
            ? `'${escapeHtml(searchQuery.trim())}'에 대한 검색 결과가 없습니다.`
            : "해당 조건의 프로그램이 없습니다."}
        </p>
        ${hasFilter ? `<button type="button" class="btn-m3-outlined" id="btn-reset-empty">검색 조건 초기화</button>` : ""}
      </div>
    `;
  }

  return filteredEvents.map(ev => {
    const catClass = ev.categoryClass || 'cat-workshop';
    const catLabel = ev.categoryLabel || '연수·워크숍';
    const evYear = ev.year || 2026;
    const evTime = ev.time || '15:00 ~ 17:00';
    const evLoc = ev.location || '서부교육지원청';
    const evTarget = ev.target || '관내 초등희망교원';
    const apply = resolveApplyLink(ev);
    const evApplyMethod = apply.href
      ? `<a href="${apply.href}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;" onclick="event.stopPropagation();" title="신청 페이지로 이동">${apply.label} ↗</a>`
      : apply.label;

    return `
      <div class="program-card clickable-program-card" data-card-id="${ev.id}" style="cursor: pointer;">
        <div class="prog-card-top">
          <span class="prog-category-badge ${catClass}">${catLabel}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="prog-date-badge">${evYear}년 ${ev.month}월 ${ev.day}일</span>
            ${isAdmin ? `
              <button class="btn-edit-prog btn-admin-action" data-event-id="${ev.id}" title="프로그램 수정" onclick="event.stopPropagation();">
                수정
              </button>
            ` : ''}
            <span class="prog-chevron" style="margin-left: 4px;">▼</span>
          </div>
        </div>

        <!-- 제목/부제목 영역 -->
        <div class="prog-title-text-wrap" style="margin-bottom: 12px;">
          <h3 class="prog-title">${ev.title || '프로그램'}</h3>
          ${ev.subtitle ? `<div class="prog-subtitle">${ev.subtitle}</div>` : ''}
        </div>

        <!-- 아코디언 펼침 상세 내용 영역 -->
        <div class="prog-accordion-content">
          <!-- 캘린더 스타일과 동일한 정보 박스 -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px;">
            <div class="prog-info-list" style="margin-bottom: 0;">
              <div class="prog-info-item">
                <span class="prog-info-label">일시</span>
                <span class="prog-datetime-val">
                  <span class="prog-date-text">${evYear}년 ${ev.month}월 ${ev.day}일</span>
                  <span class="prog-time-text">${evTime}</span>
                </span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">장소</span>
                <span>${evLoc}</span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">대상</span>
                <span>${evTarget}</span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">신청방법</span>
                <span style="font-weight: 700;">${evApplyMethod}</span>
              </div>
            </div>
          </div>

          ${ev.description ? `
            <div style="font-size: 16px; color: #475569; line-height: 1.6;">
              ${ev.description}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");
}

export function renderPrograms(container, onSelectEventModal) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const totalCount = getEvents().length;

  const categories = getCategories();
  const activeMonths = getActiveMonths();

  container.innerHTML = `
    <div class="programs-view-wrapper cols-${viewPref.columns}">
      <div class="tab-header-single-line" style="margin-bottom: 16px;">
        <h2 class="tab-header-title">프로그램 한눈에 보기</h2>
        <p class="tab-header-desc">행사명으로 검색하거나 월·유형으로 좁혀 찾을 수 있습니다.</p>
      </div>

      <!-- 새 프로그램 추가 및 유형 관리 버튼 (관리자 전용) -->
      ${isAdmin ? `
        <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
          <button id="btn-add-program" class="btn-admin-action">
            새 프로그램 추가
          </button>
          <button id="btn-manage-cats-prog" class="btn-admin-action" title="프로그램 유형 추가 및 관리">
            유형 추가·관리
          </button>
        </div>
      ` : ''}

      <!-- 검색 및 필터 바 -->
      <div class="prog-search-bar">
        <div class="prog-search-field">
          <span class="prog-search-icon" aria-hidden="true">🔍</span>
          <input type="search" id="prog-search-input" class="m3-input prog-search-input"
                 placeholder="행사명, 장소, 대상으로 검색"
                 aria-label="프로그램 검색" value="${escapeHtml(searchQuery)}" />
          <button type="button" class="prog-search-clear" id="btn-clear-search"
                  aria-label="검색어 지우기" ${searchQuery ? "" : "hidden"}>✕</button>
        </div>

        <div class="prog-filter-selects">
          <select id="prog-month-select" class="m3-select" aria-label="월 선택">
            <option value="all" ${selectedMonth === "all" ? "selected" : ""}>전체 기간</option>
            ${activeMonths.map(m => `
              <option value="${m}" ${selectedMonth === String(m) ? "selected" : ""}>${m}월</option>
            `).join("")}
          </select>

          <select id="prog-cat-select" class="m3-select" aria-label="유형 선택">
            <option value="all" ${selectedCategory === "all" ? "selected" : ""}>전체 유형</option>
            ${categories.map(cat => `
              <option value="${cat.key}" ${selectedCategory === cat.key ? "selected" : ""}>${escapeHtml(cat.label)}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <!-- 결과 요약 및 보기 설정 -->
      <div class="prog-result-bar">
        <div class="prog-result-left">
          <p class="prog-result-count" id="prog-result-count" aria-live="polite"></p>
          <button type="button" class="prog-reset-btn" id="btn-reset-filters" hidden>조건 초기화</button>
        </div>

        <div class="prog-view-controls">
          <label class="prog-view-label" for="prog-sort-select">정렬</label>
          <select id="prog-sort-select" class="m3-select prog-sort-select" aria-label="정렬 기준">
            ${SORT_OPTIONS.map(o => `
              <option value="${o.key}" ${viewPref.sort === o.key ? "selected" : ""}>${o.label}</option>
            `).join("")}
          </select>

          <div class="prog-col-group" role="group" aria-label="한 줄에 보이는 개수">
            ${[2, 3, 4].map(n => `
              <button type="button" class="prog-col-btn ${viewPref.columns === n ? 'active' : ''}"
                      data-columns="${n}" aria-pressed="${viewPref.columns === n}"
                      title="한 줄에 ${n}개씩 보기">${n}</button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 프로그램 카드 그리드 -->
      <div class="program-cards-grid cols-${viewPref.columns}" id="prog-cards-grid"></div>
    </div>
  `;

  const grid = container.querySelector("#prog-cards-grid");
  const countEl = container.querySelector("#prog-result-count");
  const resetBtn = container.querySelector("#btn-reset-filters");
  const searchInput = container.querySelector("#prog-search-input");
  const clearBtn = container.querySelector("#btn-clear-search");
  const monthSelect = container.querySelector("#prog-month-select");
  const catSelect = container.querySelector("#prog-cat-select");

  // 카드 목록만 다시 그린다 (검색 입력 중 포커스를 잃지 않도록)
  function refreshCards() {
    const filtered = getFilteredEvents();
    grid.innerHTML = buildCardsHTML(filtered, isAdmin);

    const isFiltered = !!(searchQuery.trim() || selectedCategory !== "all" || selectedMonth !== "all");
    countEl.textContent = isFiltered
      ? `전체 ${totalCount}개 중 ${filtered.length}개`
      : `전체 ${totalCount}개 프로그램`;
    resetBtn.hidden = !isFiltered;
    if (clearBtn) clearBtn.hidden = !searchQuery;

    bindCardEvents();
  }

  function bindCardEvents() {
    // 카드 클릭 시 아코디언 펼치기/접기 토글
    grid.querySelectorAll(".clickable-program-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;
        card.classList.toggle("expanded");
      });
    });

    // 프로그램 수정 버튼 (관리자)
    grid.querySelectorAll(".btn-edit-prog").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const eventId = btn.dataset.eventId;
        const targetEv = getEvents().find(ev => ev.id === eventId);
        if (targetEv) {
          openEventFormModal(targetEv, null, () => renderPrograms(container, onSelectEventModal));
        }
      });
    });

    // 결과 없음 화면의 초기화 버튼
    const emptyReset = grid.querySelector("#btn-reset-empty");
    if (emptyReset) emptyReset.addEventListener("click", resetFilters);
  }

  function resetFilters() {
    searchQuery = "";
    selectedMonth = "all";
    selectedCategory = "all";
    if (searchInput) searchInput.value = "";
    if (monthSelect) monthSelect.value = "all";
    if (catSelect) catSelect.value = "all";
    refreshCards();
    if (searchInput) searchInput.focus();
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      refreshCards();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchQuery = "";
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      refreshCards();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener("change", (e) => {
      selectedMonth = e.target.value;
      refreshCards();
    });
  }

  if (catSelect) {
    catSelect.addEventListener("change", (e) => {
      selectedCategory = e.target.value;
      refreshCards();
    });
  }

  if (resetBtn) resetBtn.addEventListener("click", resetFilters);

  // 정렬 기준 변경
  const sortSelect = container.querySelector("#prog-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      viewPref.sort = e.target.value;
      saveViewPref();
      refreshCards();
    });
  }

  // 한 줄에 보이는 카드 수 변경
  container.querySelectorAll(".prog-col-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.dataset.columns, 10);
      if (!n || n === viewPref.columns) return;

      viewPref.columns = n;
      saveViewPref();

      // 그리드와 바깥 폭을 함께 바꿔 좌우로 고르게 넓어지도록 한다
      const wrapper = container.querySelector(".programs-view-wrapper");
      [grid, wrapper].forEach(el => {
        if (!el) return;
        el.classList.remove("cols-2", "cols-3", "cols-4");
        el.classList.add(`cols-${n}`);
      });

      container.querySelectorAll(".prog-col-btn").forEach(b => {
        const active = parseInt(b.dataset.columns, 10) === n;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
    });
  });

  // 새 프로그램 추가 버튼 이벤트 바인딩
  const btnAddProg = container.querySelector("#btn-add-program");
  if (btnAddProg) {
    btnAddProg.addEventListener("click", () => {
      openEventFormModal(null, null, () => renderPrograms(container, onSelectEventModal));
    });
  }

  // 프로그램 유형 관리 버튼 이벤트 바인딩
  const btnManageCats = container.querySelector("#btn-manage-cats-prog");
  if (btnManageCats) {
    btnManageCats.addEventListener("click", () => {
      openCategoryManagerModal(() => renderPrograms(container, onSelectEventModal));
    });
  }

  refreshCards();
}
