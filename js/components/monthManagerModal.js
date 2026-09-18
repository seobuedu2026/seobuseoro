import { getActiveMonths, saveActiveMonths, MONTH_THEMES } from "../data/events.js";

/**
 * 관리자용 캘린더 월 추가 및 관리 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openMonthManagerModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentActive = getActiveMonths();
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

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 18px; line-height: 1.5;">
          캘린더 상단에 노출할 월을 선택하세요. 3개월 모아보기는 현재 달부터 등록된 3개 월을 순차적으로 보여줍니다.
        </p>

        <form id="month-mgr-form">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px;">
            ${allMonths.map(m => {
              const theme = MONTH_THEMES[m] || { name: `${m}월`, subtitle: '', icon: '📅' };
              const isChecked = currentActive.includes(m);
              return `
                <label style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: ${isChecked ? '#f0fdf4' : '#f8fafc'}; border: 1.5px solid ${isChecked ? '#86efac' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.15s ease;">
                  <input type="checkbox" name="active_month" value="${m}" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #0e3753; cursor: pointer;" />
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 14px; font-weight: 800; color: #0e3753;">${theme.icon || '📅'} ${m}월</span>
                    <span style="font-size: 10.5px; color: #64748b; margin-top: 1px;">${theme.subtitle || ''}</span>
                  </div>
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

  const dialog = mount.querySelector(".m3-modal-dialog");
  if (dialog) {
    dialog.addEventListener("click", (e) => e.stopPropagation());
  }

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
