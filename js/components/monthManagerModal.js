import { getActiveMonths, saveActiveMonths, getOverviewMonths, saveOverviewMonths, getMonthThemes, saveMonthTheme, getSelectedYear, setSelectedYear, AVAILABLE_YEARS } from "../data/events.js";

/**
 * 관리자용 캘린더 연도 및 월 추가/관리 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openMonthManagerModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentYear = getSelectedYear();
  const currentActive = getActiveMonths();
  const currentOverview = getOverviewMonths();
  const monthThemes = getMonthThemes();
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const yearsList = AVAILABLE_YEARS.filter(y => y >= 2025 && y <= 2030);

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="month-manager-backdrop">
      <div class="m3-modal-dialog" style="max-width: 520px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>🗓️ 캘린더 연도 및 월(Month) 관리</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
              관리자
            </span>
          </h3>
          <button class="modal-close-btn" id="btn-close-month-mgr" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          캘린더 기준 연도, 상단 노출 월, 모아보기에 포함할 월을 선택하세요.
        </p>

        <form id="month-mgr-form">
          <!-- 연도 선택 영역 -->
          <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <label for="month-mgr-year-select" style="font-weight: 800; font-size: 14px; color: #0e3753;">
                기준 연도 선택
              </label>
              <select id="month-mgr-year-select" class="m3-select" style="font-size: 14px; font-weight: 800; color: #0e3753; padding: 6px 12px; min-width: 140px; border: 1.5px solid #0e3753; border-radius: 6px; background-color: #ffffff; cursor: pointer;">
                ${yearsList.map(y => `
                  <option value="${y}" ${currentYear === y ? 'selected' : ''}>${y}년 (${y}학년도)</option>
                `).join("")}
              </select>
            </div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">
              * 선택한 연도의 행사 일정과 법정 공휴일이 캘린더에 자동으로 매핑됩니다.
            </div>
          </div>

          <!-- 1. 상단 탭에 노출할 월 선택 -->
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 800; font-size: 13.5px; color: #0e3753;">상단 탭에 노출할 월(Month) 선택</span>
            <span style="font-size: 11.5px; color: #64748b; margin-left: 6px;">(체크된 월이 상단 탭에 표시됩니다)</span>
          </div>

          <!-- 1~12월 상단 탭 선택 그리드 -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px;">
            ${allMonths.map(m => {
              const isChecked = currentActive.includes(m);
              return `
                <label class="month-chip-select-item" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 4px; background: ${isChecked ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#16a34a' : '#e2e8f0'}; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;">
                  <input type="checkbox" name="active_month" value="${m}" ${isChecked ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #0e3753; cursor: pointer;" />
                  <span style="font-size: 14px; font-weight: 800; color: #0e3753;">${m}월</span>
                </label>
              `;
            }).join("")}
          </div>

          <!-- 2. 3개월 모아보기에 포함할 월 선택 -->
          <div style="background: #f0f7ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px;">
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 800; font-size: 13.5px; color: #1e40af;">✨ 3개월(다중 월) 모아보기에 포함할 월 선택</span>
              <div style="font-size: 11.5px; color: #3b82f6; margin-top: 2px;">
                * 체크된 월이 '모아보기' 화면에 그리드로 한눈에 표시됩니다.
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${allMonths.map(m => {
                const isChecked = currentOverview.includes(m);
                return `
                  <label class="overview-chip-select-item" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 4px; background: ${isChecked ? '#ffffff' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#2563eb' : '#dbeafe'}; border-radius: 10px; cursor: pointer; transition: all 0.15s ease;">
                    <input type="checkbox" name="overview_month" value="${m}" ${isChecked ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #2563eb; cursor: pointer;" />
                    <span style="font-size: 13.5px; font-weight: 800; color: #1e3a8a;">${m}월</span>
                  </label>
                `;
              }).join("")}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="btn-cancel-month-mgr" class="btn-admin-action">취소</button>
            <button type="submit" class="btn-admin-action filled">캘린더 설정 적용</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#month-manager-backdrop");
  const closeBtn = mount.querySelector("#btn-close-month-mgr");
  const cancelBtn = mount.querySelector("#btn-cancel-month-mgr");
  const form = mount.querySelector("#month-mgr-form");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#month-manager-backdrop") === backdrop) {
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

  // 상단 탭 체크박스 클릭 시 스타일 실시간 전환
  form.querySelectorAll("input[name='active_month']").forEach(cb => {
    cb.addEventListener("change", () => {
      const label = cb.closest(".month-chip-select-item");
      if (label) {
        if (cb.checked) {
          label.style.background = "#f0fdf4";
          label.style.borderColor = "#16a34a";
        } else {
          label.style.background = "#f8fafc";
          label.style.borderColor = "#e2e8f0";
        }
      }
    });
  });

  // 모아보기 체크박스 클릭 시 스타일 실시간 전환
  form.querySelectorAll("input[name='overview_month']").forEach(cb => {
    cb.addEventListener("change", () => {
      const label = cb.closest(".overview-chip-select-item");
      if (label) {
        if (cb.checked) {
          label.style.background = "#ffffff";
          label.style.borderColor = "#2563eb";
        } else {
          label.style.background = "#f8fafc";
          label.style.borderColor = "#dbeafe";
        }
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const yearSelect = form.querySelector("#month-mgr-year-select");
    const selectedYear = parseInt(yearSelect.value, 10) || 2026;
    const checkedActive = Array.from(form.querySelectorAll("input[name='active_month']:checked")).map(cb => parseInt(cb.value, 10));
    const checkedOverview = Array.from(form.querySelectorAll("input[name='overview_month']:checked")).map(cb => parseInt(cb.value, 10));

    if (checkedActive.length === 0) {
      alert("⚠️ 최소 1개 이상의 상단 탭 노출 월을 선택해야 합니다.");
      return;
    }

    const finalOverview = checkedOverview.length > 0 ? checkedOverview : checkedActive.slice(0, 3);

    setSelectedYear(selectedYear);
    saveActiveMonths(checkedActive);
    saveOverviewMonths(finalOverview);

    alert(`✅ [${selectedYear}년] 캘린더 설정이 적용되었습니다.\n• 상단 탭: ${checkedActive.map(m => m + '월').join(', ')}\n• 모아보기: ${finalOverview.map(m => m + '월').join(', ')}`);
    closeModal();
    if (onSaved) onSaved();
  });
}

/**
 * 특정 월의 소제목 및 강조 안내 문구 직접 수정 모달
 * @param {number} month 월 숫자 (1~12)
 * @param {Function} onSaved 저장 후 콜백
 */
export function openMonthThemeEditModal(month, onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const monthThemes = getMonthThemes();
  const theme = monthThemes[month] || {
    monthNum: month,
    name: `${month}월`,
    subtitle: "",
    highlightWeek: "",
    highlightRange: ""
  };

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="month-theme-edit-backdrop">
      <div class="m3-modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h3 style="font-size: 18px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 6px;">
            <span>📝 ${month}월 문구 및 안내 설정</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">관리자</span>
          </h3>
          <button class="modal-close-btn" id="btn-close-theme-edit" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          ${month}월 캘린더 상단에 표시될 소제목과 강조 안내 배너 문구를 설정하세요. (비워두면 표시되지 않습니다)
        </p>

        <form id="month-theme-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="theme-subtitle-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
              월 소제목 (예: 성과공유의 달, 수다박스의 달)
            </label>
            <input type="text" id="theme-subtitle-input" class="m3-input" value="${theme.subtitle || ''}" placeholder="비워둘 시 소제목 숨김" style="padding: 10px 12px; font-size: 14px;" />
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label for="theme-highlight-week-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
              강조 주간 / 안내 명칭 (예: 수업나눔 주간, 동행장학 주간)
            </label>
            <input type="text" id="theme-highlight-week-input" class="m3-input" value="${theme.highlightWeek || ''}" placeholder="비워둘 시 배너 숨김" style="padding: 10px 12px; font-size: 14px;" />
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="theme-highlight-range-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
              강조 기간 안내 (예: 10월 12일 ~ 11월 14일)
            </label>
            <input type="text" id="theme-highlight-range-input" class="m3-input" value="${theme.highlightRange || ''}" placeholder="예: 10월 12일 ~ 11월 14일" style="padding: 10px 12px; font-size: 14px;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="btn-cancel-theme-edit" class="btn-admin-action">취소</button>
            <button type="submit" class="btn-admin-action filled">저장하기</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#month-theme-edit-backdrop");
  const closeBtn = mount.querySelector("#btn-close-theme-edit");
  const cancelBtn = mount.querySelector("#btn-cancel-theme-edit");
  const form = mount.querySelector("#month-theme-form");
  const subtitleInput = mount.querySelector("#theme-subtitle-input");
  const highlightWeekInput = mount.querySelector("#theme-highlight-week-input");
  const highlightRangeInput = mount.querySelector("#theme-highlight-range-input");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#month-theme-edit-backdrop") === backdrop) {
        mount.innerHTML = "";
      }
    }, 200);
  };

  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
  cancelBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });

  let isMouseDown = false;
  backdrop.addEventListener("mousedown", (e) => {
    isMouseDown = (e.target === backdrop);
  });
  backdrop.addEventListener("mouseup", (e) => {
    if (isMouseDown && e.target === backdrop) {
      closeModal();
    }
    isMouseDown = false;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newSubtitle = subtitleInput.value.trim();
    const newHighlightWeek = highlightWeekInput.value.trim();
    const newHighlightRange = highlightRangeInput.value.trim();

    saveMonthTheme(month, {
      subtitle: newSubtitle,
      highlightWeek: newHighlightWeek,
      highlightRange: newHighlightRange
    });

    closeModal();
    if (onSaved) onSaved();
  });
}

