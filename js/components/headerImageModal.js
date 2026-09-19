/**
 * 관리자용 상단 타이틀 배너 이미지 변경 모달
 */
const STORAGE_KEY_HEADER_IMG = "seobu_custom_header_image";
const STORAGE_KEY_SHOW_LOGO = "seobu_header_always_show_logo";

export function getCustomHeaderImage() {
  return localStorage.getItem(STORAGE_KEY_HEADER_IMG) || "assets/images/title-logo.png?v=20260918_v7";
}

export function isAlwaysShowLogo() {
  const val = localStorage.getItem(STORAGE_KEY_SHOW_LOGO);
  return val === null ? true : val === "true";
}

export function openHeaderImageModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentImg = getCustomHeaderImage();
  const currentShowLogo = isAlwaysShowLogo();

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="header-img-modal-backdrop">
      <div class="m3-modal-dialog" style="max-width: 540px;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>🖼️ 상단 타이틀 배너 이미지 변경</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">관리자</span>
          </h3>
          <button class="modal-close-btn" id="btn-close-header-modal" aria-label="닫기">✕</button>
        </div>

        <!-- 이미지 규격 및 사이즈 안내 가이드 박스 -->
        <div style="background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 14px; padding: 14px 16px; margin-bottom: 18px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #008080; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>📐 권장 이미지 규격 안내</span>
          </div>
          <ul style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0; padding-left: 18px;">
            <li><strong>권장 해상도(사이즈)</strong>: <strong>980 × 140 px</strong> (또는 가로 1200 × 170 px)</li>
            <li><strong>가로·세로 비율</strong>: 약 <strong>7 : 1</strong> 비율 (와이드 가로형)</li>
            <li><strong>권장 포맷 / 용량</strong>: PNG (배경 투명 권장), JPG, WebP / 2MB 이하</li>
            <li><strong>안내</strong>: 교육청 공식 로고는 항상 배너 좌측에 자동으로 유지됩니다.</li>
          </ul>
        </div>

        <form id="header-img-form">
          <!-- 현재 이미지 미리보기 -->
          <div style="margin-bottom: 16px;">
            <label style="font-weight: 800; font-size: 13.5px; color: #0e3753; display: block; margin-bottom: 6px;">
              현재 적용된 이미지 미리보기
            </label>
            <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 10px; text-align: center; min-height: 80px; display: flex; align-items: center; justify-content: center;">
              <img id="header-img-preview" src="${currentImg}" alt="타이틀 배너 미리보기" style="max-width: 100%; max-height: 100px; object-fit: contain; border-radius: 6px;" />
            </div>
          </div>

          <!-- 로컬 이미지 파일 선택 (직접 업로드) -->
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="header-file-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753;">
              컴퓨터에서 이미지 파일 선택 (업로드)
            </label>
            <input type="file" id="header-file-input" class="m3-input" accept="image/*" style="padding: 8px 12px; font-size: 13px; cursor: pointer;" />
          </div>

          <!-- 또는 이미지 URL 직접 입력 -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="header-url-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753;">
              또는 이미지 웹 URL 링크 직접 입력
            </label>
            <input type="url" id="header-url-input" class="m3-input" placeholder="https://example.com/banner.png" style="padding: 10px 12px; font-size: 13.5px;" />
          </div>

          <!-- 교육청 로고 상시 노출 옵션 -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
            <label for="check-always-logo" style="font-size: 13.5px; font-weight: 700; color: #0e3753; cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="check-always-logo" ${currentShowLogo ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: #0e3753; cursor: pointer;" />
              <span>서울특별시서부교육지원청 로고 항상 노출</span>
            </label>
            <span style="font-size: 11.5px; color: #16a34a; font-weight: 700;">항상 보임</span>
          </div>

          <!-- 하단 버튼 바 -->
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button type="button" id="btn-reset-header-img" class="btn-admin-action">
              기본 배너로 복원
            </button>
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-cancel-header-modal" class="btn-admin-action">취소</button>
              <button type="submit" class="btn-admin-action filled">새 이미지 적용</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#header-img-modal-backdrop");
  const closeBtn = mount.querySelector("#btn-close-header-modal");
  const cancelBtn = mount.querySelector("#btn-cancel-header-modal");
  const resetBtn = mount.querySelector("#btn-reset-header-img");
  const form = mount.querySelector("#header-img-form");
  const fileInput = mount.querySelector("#header-file-input");
  const urlInput = mount.querySelector("#header-url-input");
  const previewImg = mount.querySelector("#header-img-preview");
  const checkAlwaysLogo = mount.querySelector("#check-always-logo");

  let pendingDataUrl = null;

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#header-img-modal-backdrop") === backdrop) {
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

  // 로컬 파일 선택 시 미리보기
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("⚠️ 파일 용량이 너무 큽니다. (5MB 이하의 이미지를 업로드해주세요)");
        fileInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        pendingDataUrl = evt.target.result;
        previewImg.src = pendingDataUrl;
        urlInput.value = "";
      };
      reader.readAsDataURL(file);
    }
  });

  // URL 입력 시 미리보기
  urlInput.addEventListener("input", () => {
    const val = urlInput.value.trim();
    if (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("data:")) {
      previewImg.src = val;
      pendingDataUrl = val;
      fileInput.value = "";
    }
  });

  // 기본 배너로 복원
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY_HEADER_IMG);
    localStorage.setItem(STORAGE_KEY_SHOW_LOGO, "true");
    alert("✅ 기본 타이틀 배너 이미지로 복원되었습니다.");
    closeModal();
    if (onSaved) onSaved();
  });

  // 폼 제출
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const targetSrc = pendingDataUrl || urlInput.value.trim() || currentImg;
    const alwaysLogo = checkAlwaysLogo.checked;

    if (targetSrc) {
      localStorage.setItem(STORAGE_KEY_HEADER_IMG, targetSrc);
    }
    localStorage.setItem(STORAGE_KEY_SHOW_LOGO, String(alwaysLogo));

    alert("✅ 상단 타이틀 이미지가 성공적으로 변경되었습니다.");
    closeModal();
    if (onSaved) onSaved();
  });
}
