import { getEvents, saveEvents, getActiveMonths, getCategories, AVAILABLE_YEARS, getSelectedYear } from "../data/events.js?v=20260920_v65";

/**
 * 새 행사 추가 또는 기존 행사 수정 모달 열기
 * @param {Object|null} eventObj 수정할 행사 객체 (null이면 새 행사 추가)
 * @param {Object|null} defaultDate 기본 설정 일자 { year: 2026, month: 9, day: 15 }
 * @param {Function|null} onSaved 저장 후 콜백
 */
export function openEventFormModal(eventObj = null, defaultDate = null, onSaved = null) {
  const isEdit = !!eventObj;
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const activeMonths = getActiveMonths();
  const currentYear = eventObj ? (eventObj.year || 2026) : (defaultDate?.year || getSelectedYear());
  const currentMonth = eventObj ? eventObj.month : (defaultDate?.month || activeMonths[0] || 9);
  const currentDay = eventObj ? eventObj.day : (defaultDate?.day || 1);
  const categories = getCategories();
  const currentCat = eventObj ? (eventObj.category || "workshop") : "workshop";

  let currentApplyMethod = "교데통";
  if (eventObj) {
    if (eventObj.applyMethod === "교데통" || eventObj.applyMethod === "공문통") {
      currentApplyMethod = "교데통";
    } else if (eventObj.applyMethod === "추후안내") {
      currentApplyMethod = "추후안내";
    } else if (eventObj.applyMethod === "URL 링크" || eventObj.applyUrl) {
      currentApplyMethod = "URL 링크";
    } else if (eventObj.applyMethod) {
      currentApplyMethod = eventObj.applyMethod;
    }
  }

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="event-form-backdrop">
      <div class="m3-modal-dialog" style="max-width: 560px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>${isEdit ? '✏️ 행사(프로그램) 수정' : '➕ 새 행사(프로그램) 추가'}</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
              관리자 모드
            </span>
          </h3>
          <button class="modal-close-btn" id="btn-close-event-form" aria-label="닫기">✕</button>
        </div>

        <form id="event-edit-form" style="display: flex; flex-direction: column; gap: 14px; margin-top: 8px;">
          <!-- 행사명 & 부제목 -->
          <div class="form-group">
            <label for="ef-title" style="font-weight: 800; font-size: 13px; color: #0e3753;">행사명 (주제) *</label>
            <input type="text" id="ef-title" class="m3-input" placeholder="예: 과학실무사 연수" required value="${eventObj?.title || ''}" />
          </div>

          <div class="form-group">
            <label for="ef-subtitle" style="font-weight: 800; font-size: 13px; color: #0e3753;">상세 부제목 (선택)</label>
            <input type="text" id="ef-subtitle" class="m3-input" placeholder="예: 실험역량 강화" value="${eventObj?.subtitle || ''}" />
          </div>

          <!-- 일정 및 구분 (연도, 월, 일자, 구분) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1.3fr; gap: 8px;">
            <div class="form-group">
              <label for="ef-year" style="font-weight: 800; font-size: 13px; color: #0e3753;">연도 *</label>
              <select id="ef-year" class="m3-select" required>
                ${AVAILABLE_YEARS.map(y => `
                  <option value="${y}" ${currentYear == y ? 'selected' : ''}>${y}년</option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label for="ef-month" style="font-weight: 800; font-size: 13px; color: #0e3753;">월 *</label>
              <select id="ef-month" class="m3-select" required>
                ${activeMonths.map(m => `
                  <option value="${m}" ${currentMonth == m ? 'selected' : ''}>${m}월</option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label for="ef-day" style="font-weight: 800; font-size: 13px; color: #0e3753;">일자 *</label>
              <input type="text" id="ef-day" class="m3-input" placeholder="예: 18" required value="${currentDay}" />
            </div>

            <div class="form-group">
              <label for="ef-category" style="font-weight: 800; font-size: 13px; color: #0e3753;">구분 *</label>
              <select id="ef-category" class="m3-select" required>
                ${categories.map(cat => `
                  <option value="${cat.key}" ${currentCat === cat.key ? 'selected' : ''}>${cat.label}</option>
                `).join("")}
              </select>
            </div>
          </div>

          <!-- 시간 & 장소 -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label for="ef-time" style="font-weight: 800; font-size: 13px; color: #0e3753;">시간</label>
              <input type="text" id="ef-time" class="m3-input" placeholder="예: 15:00 ~ 17:00" value="${eventObj?.time || '15:00 ~ 17:00'}" />
            </div>

            <div class="form-group">
              <label for="ef-location" style="font-weight: 800; font-size: 13px; color: #0e3753;">장소</label>
              <input type="text" id="ef-location" class="m3-input" placeholder="예: 서부과학교육센터" value="${eventObj?.location || '서부교육지원청'}" />
            </div>
          </div>

          <!-- 대상 & 신청 방법 -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label for="ef-target" style="font-weight: 800; font-size: 13px; color: #0e3753;">대상</label>
              <input type="text" id="ef-target" class="m3-input" placeholder="예: 관내 초등희망교원" value="${eventObj?.target || '관내 초등희망교원'}" />
            </div>

            <div class="form-group">
              <label for="ef-apply-method" style="font-weight: 800; font-size: 13px; color: #0e3753;">신청 방법</label>
              <select id="ef-apply-method" class="m3-select">
                <option value="교데통" ${currentApplyMethod === '교데통' ? 'selected' : ''}>교데통</option>
                <option value="URL 링크" ${currentApplyMethod === 'URL 링크' ? 'selected' : ''}>URL 링크</option>
                <option value="추후안내" ${currentApplyMethod === '추후안내' ? 'selected' : ''}>추후안내</option>
              </select>
            </div>
          </div>

          <!-- URL 링크 선택 시 나타나는 URL 입력 필드 -->
          <div class="form-group" id="ef-url-group" style="display: ${currentApplyMethod === 'URL 링크' ? 'block' : 'none'};">
            <label for="ef-apply-url" style="font-weight: 800; font-size: 13px; color: #0e3753;">신청 URL 링크</label>
            <input type="text" id="ef-apply-url" class="m3-input" placeholder="https://..." value="${eventObj?.applyUrl || ''}" />
          </div>

          <!-- 상세 설명 -->
          <div class="form-group">
            <label for="ef-desc" style="font-weight: 800; font-size: 13px; color: #0e3753;">상세 안내 및 개요</label>
            <textarea id="ef-desc" class="m3-textarea" rows="3" placeholder="프로그램 상세 내용을 입력하세요.">${eventObj?.description || ''}</textarea>
          </div>

          <!-- 액션 버튼 바 -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            ${isEdit ? `
              <button type="button" id="btn-delete-event" class="btn-admin-action danger">
                행사 삭제
              </button>
            ` : '<div></div>'}

            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-cancel-event-form" class="btn-admin-action">취소</button>
              <button type="submit" class="btn-admin-action filled">
                ${isEdit ? '수정사항 저장' : '새 행사 등록'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#event-form-backdrop");
  const closeBtn = mount.querySelector("#btn-close-event-form");
  const cancelBtn = mount.querySelector("#btn-cancel-event-form");
  const deleteBtn = mount.querySelector("#btn-delete-event");
  const form = mount.querySelector("#event-edit-form");

  const dialog = mount.querySelector(".m3-modal-dialog");
  if (dialog) {
    dialog.addEventListener("click", (e) => e.stopPropagation());
  }

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#event-form-backdrop") === backdrop) {
        mount.innerHTML = "";
      }
    }, 200);
  };

  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
  cancelBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });

  let isMouseDownOnBackdrop = false;
  backdrop.addEventListener("mousedown", (e) => {
    isMouseDownOnBackdrop = (e.target === backdrop);
  });
  backdrop.addEventListener("mouseup", (e) => {
    if (isMouseDownOnBackdrop && e.target === backdrop) {
      closeModal();
    }
    isMouseDownOnBackdrop = false;
  });

  // 삭제 처리
  if (deleteBtn && isEdit) {
    deleteBtn.addEventListener("click", () => {
      if (confirm(`정말 '${eventObj.title}' 행사를 삭제하시겠습니까?`)) {
        const all = getEvents();
        const updated = all.filter(e => e.id !== eventObj.id);
        saveEvents(updated);
        alert("🗑️ 행사가 삭제되었습니다.");
        closeModal();
        if (onSaved) onSaved();
      }
    });
  }

  // 신청방법 변경 시 URL 입력창 표시/숨김
  const applyMethodSelect = mount.querySelector("#ef-apply-method");
  const urlGroup = mount.querySelector("#ef-url-group");
  const applyUrlInput = mount.querySelector("#ef-apply-url");

  if (applyMethodSelect && urlGroup) {
    applyMethodSelect.addEventListener("change", (e) => {
      if (e.target.value === "URL 링크") {
        urlGroup.style.display = "block";
        if (applyUrlInput) applyUrlInput.focus();
      } else {
        urlGroup.style.display = "none";
      }
    });
  }

  // 저장/추가 처리
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("ef-title").value.trim();
    const subtitle = document.getElementById("ef-subtitle").value.trim();
    const year = parseInt(document.getElementById("ef-year").value, 10) || 2026;
    const month = parseInt(document.getElementById("ef-month").value, 10);
    const rawDay = document.getElementById("ef-day").value.trim();
    const day = rawDay.includes("/") ? rawDay : (parseInt(rawDay, 10) || 1);
    const category = document.getElementById("ef-category").value;
    const time = document.getElementById("ef-time").value.trim() || "15:00 ~ 17:00";
    const location = document.getElementById("ef-location").value.trim() || "서부교육지원청";
    const target = document.getElementById("ef-target").value.trim() || "관내 초등희망교원";
    
    const applyMethod = document.getElementById("ef-apply-method") ? document.getElementById("ef-apply-method").value : "교데통";
    let applyUrl = "";
    if (applyMethod === "URL 링크") {
      applyUrl = document.getElementById("ef-apply-url") ? document.getElementById("ef-apply-url").value.trim() : "";
      if (applyUrl && !applyUrl.startsWith("http://") && !applyUrl.startsWith("https://")) {
        applyUrl = "https://" + applyUrl;
      }
    }

    const description = document.getElementById("ef-desc").value.trim() || `${title} 행사입니다.`;

    const currentCats = getCategories();
    const catInfo = currentCats.find(c => c.key === category) || currentCats[0];

    const allEvents = getEvents();

    const dateStr = typeof day === "number"
      ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : `${year}-12-02`;

    if (isEdit) {
      // 기존 수정
      const updatedEvents = allEvents.map(item => {
        if (item.id === eventObj.id) {
          return {
            ...item,
            title,
            subtitle,
            year,
            month,
            day,
            dateStr,
            category,
            categoryLabel: catInfo.label,
            categoryClass: catInfo.cls,
            time,
            location,
            target,
            applyUrl,
            applyMethod,
            description
          };
        }
        return item;
      });
      saveEvents(updatedEvents);
      alert("✅ 행사가 성공적으로 수정되었습니다.");
    } else {
      // 신규 추가
      const newEvent = {
        id: "ev-" + Date.now(),
        year,
        month,
        day,
        dateStr,
        title,
        subtitle,
        category,
        categoryLabel: catInfo.label,
        categoryClass: catInfo.cls,
        time,
        location,
        target,
        applyUrl,
        applyMethod,
        description
      };
      saveEvents([newEvent, ...allEvents]);
      alert("✅ 새 행사가 성공적으로 등록되었습니다.");
    }

    closeModal();
    if (onSaved) onSaved();
  });
}
