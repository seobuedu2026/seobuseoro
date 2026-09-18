import { getCategories, saveCategories, resetCategoriesToDefault, DEFAULT_CATEGORIES } from "../data/events.js";

/**
 * 프로그램 유형 범례(카테고리 명칭) 관리 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openCategoryManagerModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentCategories = getCategories();

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="category-manager-backdrop">
      <div class="m3-modal-dialog" style="max-width: 540px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>🏷️ 프로그램 유형(범례) 수정</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
              관리자 모드
            </span>
          </h3>
          <button class="modal-close-btn" id="btn-close-cat-mgr" aria-label="닫기">✕</button>
        </div>

        <div class="modal-body" style="padding: 16px 20px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; color: #166534; line-height: 1.5;">
            💡 캘린더 하단 범례 및 프로그램 필터에 표시되는 <strong>유형 명칭</strong>을 수정할 수 있습니다.<br/>
            수정 후 <strong>[저장하기]</strong>를 누르면 즉시 적용됩니다.
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;" id="cat-inputs-list">
            ${currentCategories.map(cat => `
              <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
                <!-- 뱃지 미리보기 -->
                <div style="min-width: 140px; display: flex; justify-content: flex-start;">
                  <span class="legend-badge ${cat.cls}" id="preview-badge-${cat.key}" style="font-size: 13px; padding: 4px 12px; white-space: nowrap;">
                    ${cat.label}
                  </span>
                </div>

                <!-- 명칭 입력란 -->
                <div style="flex: 1;">
                  <input type="text" 
                    id="input-cat-${cat.key}" 
                    data-cat-key="${cat.key}" 
                    value="${cat.label}" 
                    class="m3-input" 
                    style="width: 100%; font-size: 13.5px; font-weight: 700; padding: 8px 12px;" 
                    placeholder="유형 명칭 입력"
                    maxlength="20"
                  />
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="modal-footer" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; background: #f8fafc; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
          <button type="button" id="btn-reset-categories" class="btn-m3-text" style="color: #64748b; font-size: 13px; font-weight: 700;">
            🔄 기본 명칭 복원
          </button>
          
          <div style="display: flex; gap: 8px;">
            <button type="button" id="btn-cancel-cat-mgr" class="btn-m3-outlined" style="padding: 7px 16px; font-size: 13px;">
              취소
            </button>
            <button type="button" id="btn-save-cat-mgr" class="btn-m3-filled" style="padding: 7px 20px; font-size: 13px; font-weight: 800; background: #0e3753;">
              💾 저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#category-manager-backdrop");
  const btnClose = mount.querySelector("#btn-close-cat-mgr");
  const btnCancel = mount.querySelector("#btn-cancel-cat-mgr");
  const btnSave = mount.querySelector("#btn-save-cat-mgr");
  const btnReset = mount.querySelector("#btn-reset-categories");

  function closeModal() {
    mount.innerHTML = "";
  }

  btnClose.addEventListener("click", closeModal);
  btnCancel.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // 실시간 입력 반영
  currentCategories.forEach(cat => {
    const input = mount.querySelector(`#input-cat-${cat.key}`);
    const badge = mount.querySelector(`#preview-badge-${cat.key}`);
    if (input && badge) {
      input.addEventListener("input", () => {
        badge.textContent = input.value.trim() || cat.key;
      });
    }
  });

  // 기본값 복원
  btnReset.addEventListener("click", () => {
    if (confirm("모든 유형 명칭을 초기 기본값으로 복원하시겠습니까?")) {
      DEFAULT_CATEGORIES.forEach(def => {
        const input = mount.querySelector(`#input-cat-${def.key}`);
        const badge = mount.querySelector(`#preview-badge-${def.key}`);
        if (input && badge) {
          input.value = def.label;
          badge.textContent = def.label;
        }
      });
    }
  });

  // 저장하기
  btnSave.addEventListener("click", () => {
    const updated = DEFAULT_CATEGORIES.map(def => {
      const input = mount.querySelector(`#input-cat-${def.key}`);
      const val = input ? input.value.trim() : "";
      return {
        ...def,
        label: val || def.label
      };
    });

    saveCategories(updated);
    closeModal();
    if (typeof onSaved === "function") {
      onSaved();
    }
  });
}
