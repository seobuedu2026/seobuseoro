import { getCategories, saveCategories, resetCategoriesToDefault, DEFAULT_CATEGORIES, CATEGORY_COLOR_PRESETS } from "../data/events.js";

/**
 * 프로그램 유형 범례(카테고리 명칭 및 추가/삭제) 관리 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openCategoryManagerModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  // 로컬 작업용 카테고리 목록 복사본
  let categories = JSON.parse(JSON.stringify(getCategories()));

  function renderModal() {
    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="category-manager-backdrop">
        <div class="m3-modal-dialog" style="max-width: 640px; max-height: 90vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
              <span>🏷️ 프로그램 유형(범례) 관리</span>
              <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                관리자 모드
              </span>
            </h3>
            <button class="modal-close-btn" id="btn-close-cat-mgr" aria-label="닫기">✕</button>
          </div>

          <div class="modal-body" style="padding: 16px 20px; overflow-y: auto; flex: 1;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; color: #166534; line-height: 1.5;">
              💡 캘린더 하단 범례, 프로그램 필터 및 행사 등록에 사용되는 <strong>프로그램 유형</strong>을 관리할 수 있습니다.<br/>
              <strong>[➕ 새 프로그램 유형 추가]</strong> 버튼을 눌러 새 유형을 생성하고 원하는 색상을 지정해보세요.
            </div>

            <!-- 새 유형 추가 상단 버튼 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 13.5px; font-weight: 800; color: #0e3753;">
                등록된 유형 목록 (<span id="cat-count">${categories.length}</span>개)
              </span>
              <button type="button" id="btn-add-cat-row" class="btn-m3-filled" style="background: #008080; color: #ffffff; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 5px;">
                <span>➕ 새 프로그램 유형 추가</span>
              </button>
            </div>

            <!-- 카테고리 항목 목록 -->
            <div style="display: flex; flex-direction: column; gap: 10px;" id="cat-inputs-list">
              ${renderCategoryRows(categories)}
            </div>
          </div>

          <div class="modal-footer" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; background: #f8fafc; border-bottom-left-radius: 20px; border-bottom-right-radius: 20px;">
            <button type="button" id="btn-reset-categories" class="btn-m3-text" style="color: #64748b; font-size: 13px; font-weight: 700;">
              🔄 기본값으로 초기화
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

    bindEvents();
  }

  function renderCategoryRows(catList) {
    return catList.map((cat, idx) => `
      <div class="cat-row-item" data-key="${cat.key}" style="display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: all 0.2s ease;">
        <!-- 뱃지 미리보기 -->
        <div style="min-width: 140px; display: flex; justify-content: flex-start;">
          <span class="legend-badge ${cat.cls}" id="preview-badge-${cat.key}" style="font-size: 12.5px; padding: 4px 10px; white-space: nowrap; max-width: 130px; overflow: hidden; text-overflow: ellipsis;">
            ${cat.label || "미입력"}
          </span>
        </div>

        <!-- 명칭 입력란 -->
        <div style="flex: 1;">
          <input type="text" 
            id="input-cat-${cat.key}" 
            data-cat-key="${cat.key}" 
            value="${cat.label}" 
            class="m3-input cat-input-field" 
            style="width: 100%; font-size: 13.5px; font-weight: 700; padding: 7px 10px;" 
            placeholder="유형 명칭 입력"
            maxlength="24"
          />
        </div>

        <!-- 색상 테마 선택 드롭다운 -->
        <div style="width: 130px;">
          <select class="m3-select cat-color-field" data-cat-key="${cat.key}" style="width: 100%; font-size: 12px; padding: 7px 8px;">
            ${CATEGORY_COLOR_PRESETS.map(preset => `
              <option value="${preset.cls}" ${cat.cls === preset.cls ? 'selected' : ''}>
                ${preset.label}
              </option>
            `).join("")}
          </select>
        </div>

        <!-- 삭제 버튼 -->
        <div style="display: flex; align-items: center;">
          <button type="button" class="btn-delete-cat-item btn-m3-outlined" data-cat-key="${cat.key}" title="이 유형 삭제" style="color: #dc2626; border-color: #fecaca; background: #fff5f5; padding: 6px 9px; font-size: 12px; border-radius: 8px; cursor: pointer;">
            🗑️
          </button>
        </div>
      </div>
    `).join("");
  }

  function bindEvents() {
    const backdrop = mount.querySelector("#category-manager-backdrop");
    const btnClose = mount.querySelector("#btn-close-cat-mgr");
    const btnCancel = mount.querySelector("#btn-cancel-cat-mgr");
    const btnSave = mount.querySelector("#btn-save-cat-mgr");
    const btnReset = mount.querySelector("#btn-reset-categories");
    const btnAdd = mount.querySelector("#btn-add-cat-row");

    function closeModal() {
      mount.innerHTML = "";
    }

    btnClose.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    // 실시간 명칭 입력 리스너
    mount.querySelectorAll(".cat-input-field").forEach(input => {
      const key = input.getAttribute("data-cat-key");
      const badge = mount.querySelector(`#preview-badge-${key}`);
      input.addEventListener("input", () => {
        const val = input.value.trim();
        if (badge) badge.textContent = val || "미입력";
        const targetCat = categories.find(c => c.key === key);
        if (targetCat) targetCat.label = input.value;
      });
    });

    // 색상 변경 리스너
    mount.querySelectorAll(".cat-color-field").forEach(select => {
      const key = select.getAttribute("data-cat-key");
      const badge = mount.querySelector(`#preview-badge-${key}`);
      select.addEventListener("change", () => {
        const selectedCls = select.value;
        const targetCat = categories.find(c => c.key === key);
        if (targetCat) {
          targetCat.cls = selectedCls;
        }
        if (badge) {
          // 기존 모든 cat- 클래스 제거 후 새 클래스 적용
          CATEGORY_COLOR_PRESETS.forEach(p => badge.classList.remove(p.cls));
          badge.classList.add(selectedCls);
        }
      });
    });

    // 항목 삭제 리스너
    mount.querySelectorAll(".btn-delete-cat-item").forEach(btn => {
      const key = btn.getAttribute("data-cat-key");
      btn.addEventListener("click", () => {
        const targetCat = categories.find(c => c.key === key);
        const name = targetCat ? targetCat.label : "유형";
        if (categories.length <= 1) {
          alert("최소 1개 이상의 프로그램 유형이 필요합니다.");
          return;
        }
        if (confirm(`'${name}' 유형을 삭제하시겠습니까?`)) {
          categories = categories.filter(c => c.key !== key);
          renderModal();
        }
      });
    });

    // 새 프로그램 유형 추가 버튼 클릭
    btnAdd.addEventListener("click", () => {
      // 겹치지 않는 색상 프리셋 자동 선정
      const usedClasses = new Set(categories.map(c => c.cls));
      const nextPreset = CATEGORY_COLOR_PRESETS.find(p => !usedClasses.has(p.cls)) || CATEGORY_COLOR_PRESETS[categories.length % CATEGORY_COLOR_PRESETS.length];

      const newKey = `cat_custom_${Date.now()}`;
      const newCat = {
        key: newKey,
        label: `새 유형 ${categories.length + 1}`,
        cls: nextPreset.cls,
        isCustom: true
      };

      categories.push(newCat);
      renderModal();

      // 새로 추가된 입력란으로 자동 포커스
      setTimeout(() => {
        const newInput = mount.querySelector(`#input-cat-${newKey}`);
        if (newInput) {
          newInput.focus();
          newInput.select();
        }
      }, 50);
    });

    // 기본값 초기화
    btnReset.addEventListener("click", () => {
      if (confirm("모든 프로그램 유형을 초기 기본 6대 범례로 복원하시겠습니까?")) {
        resetCategoriesToDefault();
        categories = JSON.parse(JSON.stringify(getCategories()));
        renderModal();
      }
    });

    // 최종 저장하기
    btnSave.addEventListener("click", () => {
      // 입력값 최신 동기화
      const updated = categories.map(cat => {
        const input = mount.querySelector(`#input-cat-${cat.key}`);
        const select = mount.querySelector(`.cat-color-field[data-cat-key="${cat.key}"]`);
        const label = input ? input.value.trim() : cat.label;
        const cls = select ? select.value : cat.cls;
        return {
          ...cat,
          label: label || "새 유형",
          cls: cls || "cat-purple"
        };
      });

      if (updated.some(c => !c.label)) {
        alert("유형 명칭을 모두 입력해주세요.");
        return;
      }

      saveCategories(updated);
      alert("✅ 프로그램 유형이 성공적으로 저장되었습니다.");
      closeModal();
      if (typeof onSaved === "function") {
        onSaved();
      }
    });
  }

  // 초기 렌더링
  renderModal();
}
