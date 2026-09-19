import { getActiveMonths, saveActiveMonths, getMonthThemes, saveMonthTheme } from "../data/events.js";

/**
 * 관리자용 캘린더 월 추가 및 관리 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openMonthManagerModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentActive = getActiveMonths();
  const monthThemes = getMonthThemes();
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="month-manager-backdrop">
      <div class="m3-modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>🗓️ 캘린더 월(Month) 추가 및 관리</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
              관리자
            </span>
          </h3>
          <button class="modal-close-btn" id="btn-close-month-mgr" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          캘린더 상단에 노출할 월을 선택하세요. (체크된 월만 캘린더에 표시됩니다)
        </p>

        <form id="month-mgr-form">
          <!-- 1~12월 깔끔한 선택 그리드 (설명 없이 달 숫자만 깔끔하게 표시) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
            ${allMonths.map(m => {
              const isChecked = currentActive.includes(m);
              return `
                <label class="month-chip-select-item" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 4px; background: ${isChecked ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#16a34a' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.15s ease;">
                  <input type="checkbox" name="active_month" value="${m}" ${isChecked ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #0e3753; cursor: pointer;" />
                  <span style="font-size: 14.5px; font-weight: 800; color: #0e3753;">${m}월</span>
                </label>
              `;
            }).join("")}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <button type="button" id="btn-reset-months" class="btn-m3-outlined" style="font-size: 12px; padding: 6px 12px;">
              기본(9~11월) 복원
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-cancel-month-mgr" class="btn-m3-outlined">취소</button>
              <button type="submit" class="btn-m3-filled">💾 캘린더 월 적용</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#month-manager-backdrop");
  const closeBtn = mount.querySelector("#btn-close-month-mgr");
  const cancelBtn = mount.querySelector("#btn-cancel-month-mgr");
  const resetBtn = mount.querySelector("#btn-reset-months");
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

  resetBtn.addEventListener("click", () => {
    saveActiveMonths([9, 10, 11]);
    alert("✅ 캘린더 월이 기본(9월, 10월, 11월)으로 설정되었습니다.");
    closeModal();
    if (onSaved) onSaved();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const checked = Array.from(form.querySelectorAll("input[name='active_month']:checked")).map(cb => parseInt(cb.value, 10));
    if (checked.length === 0) {
      alert("⚠️ 최소 1개 이상의 월을 선택해야 합니다.");
      return;
    }
    saveActiveMonths(checked);
    alert(`✅ 캘린더 월 설정이 저장되었습니다. (${checked.map(m => m + '월').join(', ')})`);
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
            <button type="button" id="btn-cancel-theme-edit" class="btn-m3-outlined">취소</button>
            <button type="submit" class="btn-m3-filled">💾 저장하기</button>
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

