/**
 * 관리자용 팝업 공지 설정 및 편집 모달 (adminPopupModal.js)
 * - 팝업 On/Off 설정
 * - 인쇄물 대비 일정 변경 내용 추가/수정/삭제
 * - 모집 중인 연수/워크숍 목록 추가/수정/삭제
 * - 실시간 미리보기(Preview) 지원
 */
import { 
  getPopupNoticeConfig, 
  savePopupNoticeConfig, 
  resetPopupNoticeConfig, 
  DEFAULT_POPUP_NOTICE 
} from "../data/popupNotice.js";
import { openNoticePopupModal } from "./noticePopupModal.js";

export function openAdminPopupModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  // 현재 설정 불러오기
  let config = JSON.parse(JSON.stringify(getPopupNoticeConfig()));

  function renderForm() {
    const scheduleItems = config.scheduleChangeSection?.items || [];
    const recruitItems = config.recruitingSection?.items || [];

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="admin-popup-modal-backdrop">
        <div class="m3-modal-dialog admin-popup-dialog" style="max-width: 760px; max-height: 90vh;">
          
          <!-- 헤더 영역 -->
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">📢</span>
              <div>
                <h3 style="font-size: 20px; font-weight: 900; color: #0e3753; margin: 0; line-height: 1.3;">
                  팝업 공지 관리 & 설정
                </h3>
                <span style="font-size: 12px; color: #64748b; font-weight: 600;">
                  인쇄물 일정 변경 및 모집 중인 연수 안내 팝업을 설정합니다.
                </span>
              </div>
            </div>
            <button class="modal-close-btn" id="btn-close-admin-popup-modal" aria-label="닫기">✕</button>
          </div>

          <form id="admin-popup-form" style="margin-top: 14px;">
            
            <!-- 1. 팝업 활성화 토글 스위치 카드 -->
            <div style="background: #f0fdfa; border: 1.5px solid #99f6e4; border-radius: 14px; padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div>
                <div style="font-size: 15px; font-weight: 800; color: #0f766e; display: flex; align-items: center; gap: 6px;">
                  <span>🔔 홈페이지 접속 시 팝업창 자동 띄우기</span>
                </div>
                <div style="font-size: 12.5px; color: #334155; margin-top: 3px;">
                  체크 해제 시 방문자에게 팝업이 노출되지 않습니다.
                </div>
              </div>
              <label class="switch-toggle-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 800; color: #0e3753;">
                <input type="checkbox" id="popup-enabled-chk" ${config.enabled ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #0e3753; cursor: pointer;" />
                <span id="popup-enabled-status-text" style="color: ${config.enabled ? '#0f766e' : '#dc2626'}; font-weight: 900;">
                  ${config.enabled ? '활성화 (ON)' : '비활성화 (OFF)'}
                </span>
              </label>
            </div>

            <!-- 2. 기본 제목 및 부제목 설정 -->
            <div class="admin-popup-card-section">
              <h4 class="admin-section-heading">📌 팝업 기본 타이틀 정보</h4>
              
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label class="admin-field-label" for="popup-badge-input">상단 뱃지</label>
                  <input type="text" id="popup-badge-input" class="m3-input" value="${escapeHtml(config.badge || '중요 공지')}" placeholder="중요 공지" style="padding: 9px 12px; font-size: 14px;" />
                </div>
                <div>
                  <label class="admin-field-label" for="popup-title-input">팝업 메인 제목</label>
                  <input type="text" id="popup-title-input" class="m3-input" value="${escapeHtml(config.title || '')}" placeholder="2026학년도 2학기 서부서로 수업성장 안내" required style="padding: 9px 12px; font-size: 14px; font-weight: 700;" />
                </div>
              </div>

              <div>
                <label class="admin-field-label" for="popup-subtitle-input">팝업 소개 문구 (부제목)</label>
                <input type="text" id="popup-subtitle-input" class="m3-input" value="${escapeHtml(config.subtitle || '')}" placeholder="인쇄물 일정 변경 사항 및 현재 모집 중인 연수·워크숍을 안내해 드립니다." style="padding: 9px 12px; font-size: 13.5px;" />
              </div>
            </div>

            <!-- 3. [섹션 1] 인쇄물 대비 일정 변경 안내 설정 -->
            <div class="admin-popup-card-section" style="border-left: 4px solid #f59e0b;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">📋</span>
                  <h4 class="admin-section-heading" style="margin: 0; color: #b45309;">
                    [섹션 1] 인쇄물 대비 일정 변경 안내
                  </h4>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer;">
                  <input type="checkbox" id="sec-schedule-enabled" ${config.scheduleChangeSection?.enabled ? 'checked' : ''} style="accent-color: #d97706; width: 16px; height: 16px;" />
                  <span>이 섹션 노출</span>
                </label>
              </div>

              <div style="margin-bottom: 12px;">
                <label class="admin-field-label" for="sec-schedule-title">섹션 제목</label>
                <input type="text" id="sec-schedule-title" class="m3-input" value="${escapeHtml(config.scheduleChangeSection?.title || '📋 인쇄물(포스터) 대비 일정 변경 사항 안내')}" style="padding: 8px 12px; font-size: 13.5px;" />
              </div>

              <div style="margin-bottom: 14px;">
                <label class="admin-field-label" for="sec-schedule-desc">섹션 설명 문구</label>
                <input type="text" id="sec-schedule-desc" class="m3-input" value="${escapeHtml(config.scheduleChangeSection?.description || '')}" placeholder="기존에 배포된 인쇄물 이후 변경 및 확정된 행사 일정입니다." style="padding: 8px 12px; font-size: 13px;" />
              </div>

              <!-- 일정 변경 리스트 목록 -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 13.5px; font-weight: 800; color: #0e3753;">변경 항목 목록 (${scheduleItems.length}건)</span>
                  <button type="button" id="btn-add-schedule-item" class="btn-admin-action" style="font-size: 12px; padding: 4px 10px; background: #fef3c7; color: #92400e; border-color: #fde68a;">
                    + 변경 항목 추가
                  </button>
                </div>

                <div id="schedule-items-container" style="display: flex; flex-direction: column; gap: 10px;">
                  ${scheduleItems.map((item, idx) => `
                    <div class="admin-item-row" data-idx="${idx}" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 13px; font-weight: 800; color: #92400e;">#${idx + 1} 변경 항목</span>
                        <button type="button" class="btn-remove-schedule-item" data-idx="${idx}" style="background: none; border: none; color: #dc2626; font-size: 12px; font-weight: 700; cursor: pointer; padding: 2px 6px;">
                          🗑️ 삭제
                        </button>
                      </div>
                      
                      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #78350f;">행사 / 연수명</label>
                          <input type="text" class="m3-input sched-title-input" value="${escapeHtml(item.title || '')}" placeholder="예: 수다박스 연수 (학적업무 첫걸음)" style="padding: 7px 10px; font-size: 13px;" />
                        </div>
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #78350f;">상태 / 비고 태그</label>
                          <input type="text" class="m3-input sched-note-input" value="${escapeHtml(item.note || '')}" placeholder="예: 신청 접수 중" style="padding: 7px 10px; font-size: 13px;" />
                        </div>
                      </div>

                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #dc2626;">기존 인쇄물 표기</label>
                          <input type="text" class="m3-input sched-original-input" value="${escapeHtml(item.original || '')}" placeholder="예: 인쇄물: 9월 중 예정" style="padding: 7px 10px; font-size: 12.5px;" />
                        </div>
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #0284c7;">확정 / 변경 내용</label>
                          <input type="text" class="m3-input sched-updated-input" value="${escapeHtml(item.updated || '')}" placeholder="예: 변경: 9월 10일(목) 15:20 녹번초" style="padding: 7px 10px; font-size: 12.5px; font-weight: 700;" />
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 4. [섹션 2] 현재 모집 중인 연수·워크숍 안내 설정 -->
            <div class="admin-popup-card-section" style="border-left: 4px solid #0284c7;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px;">🔥</span>
                  <h4 class="admin-section-heading" style="margin: 0; color: #0369a1;">
                    [섹션 2] 현재 모집 중인 연수 & 워크숍 안내
                  </h4>
                </div>
                <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer;">
                  <input type="checkbox" id="sec-recruit-enabled" ${config.recruitingSection?.enabled ? 'checked' : ''} style="accent-color: #0284c7; width: 16px; height: 16px;" />
                  <span>이 섹션 노출</span>
                </label>
              </div>

              <div style="margin-bottom: 12px;">
                <label class="admin-field-label" for="sec-recruit-title">섹션 제목</label>
                <input type="text" id="sec-recruit-title" class="m3-input" value="${escapeHtml(config.recruitingSection?.title || '🔥 현재 신청 접수 중인 연수 & 워크숍')}" style="padding: 8px 12px; font-size: 13.5px;" />
              </div>

              <div style="margin-bottom: 14px;">
                <label class="admin-field-label" for="sec-recruit-desc">섹션 설명 문구</label>
                <input type="text" id="sec-recruit-desc" class="m3-input" value="${escapeHtml(config.recruitingSection?.description || '')}" placeholder="서부 관내 교원을 위한 맞춤형 성장 연수의 신청이 진행 중입니다." style="padding: 8px 12px; font-size: 13px;" />
              </div>

              <!-- 모집 중인 연수 목록 -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 13.5px; font-weight: 800; color: #0e3753;">모집 연수 목록 (${recruitItems.length}건)</span>
                  <button type="button" id="btn-add-recruit-item" class="btn-admin-action" style="font-size: 12px; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">
                    + 모집 연수 추가
                  </button>
                </div>

                <div id="recruit-items-container" style="display: flex; flex-direction: column; gap: 10px;">
                  ${recruitItems.map((item, idx) => `
                    <div class="admin-item-row" data-idx="${idx}" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 12px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 13px; font-weight: 800; color: #0369a1;">#${idx + 1} 모집 연수/워크숍</span>
                        <button type="button" class="btn-remove-recruit-item" data-idx="${idx}" style="background: none; border: none; color: #dc2626; font-size: 12px; font-weight: 700; cursor: pointer; padding: 2px 6px;">
                          🗑️ 삭제
                        </button>
                      </div>

                      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #0e3753;">연수 / 워크숍명</label>
                          <input type="text" class="m3-input recruit-name-input" value="${escapeHtml(item.name || '')}" placeholder="예: 과학실무사 연수 (실험역량 강화)" style="padding: 7px 10px; font-size: 13px; font-weight: 700;" />
                        </div>
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #0e3753;">상태 뱃지</label>
                          <input type="text" class="m3-input recruit-status-input" value="${escapeHtml(item.status || '모집중')}" placeholder="모집중" style="padding: 7px 10px; font-size: 13px;" />
                        </div>
                      </div>

                      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #475569;">일시</label>
                          <input type="text" class="m3-input recruit-date-input" value="${escapeHtml(item.date || '')}" placeholder="예: 2026. 9. 4.(금) 14:00~" style="padding: 7px 10px; font-size: 12.5px;" />
                        </div>
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #475569;">장소</label>
                          <input type="text" class="m3-input recruit-loc-input" value="${escapeHtml(item.location || '')}" placeholder="예: 서부과학교육센터" style="padding: 7px 10px; font-size: 12.5px;" />
                        </div>
                        <div>
                          <label style="font-size: 11.5px; font-weight: 700; color: #475569;">대상</label>
                          <input type="text" class="m3-input recruit-target-input" value="${escapeHtml(item.target || '')}" placeholder="예: 관내 초·중 과학실무사" style="padding: 7px 10px; font-size: 12.5px;" />
                        </div>
                      </div>

                      <div>
                        <label style="font-size: 11.5px; font-weight: 700; color: #0284c7;">온라인 신청 링크 URL (새 창 열림)</label>
                        <input type="url" class="m3-input recruit-link-input" value="${escapeHtml(item.link || '')}" placeholder="https://senedu.kr/apply/..." style="padding: 7px 10px; font-size: 12.5px;" />
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 5. 하단 공지 문구 및 메인 이동 버튼 설정 -->
            <div class="admin-popup-card-section">
              <h4 class="admin-section-heading">⚙️ 하단 안내 및 이동 버튼 설정</h4>
              
              <div style="margin-bottom: 12px;">
                <label class="admin-field-label" for="popup-footer-notice">하단 안내 텍스트</label>
                <input type="text" id="popup-footer-notice" class="m3-input" value="${escapeHtml(config.footerNotice || '')}" placeholder="※ 세부 일정, 장소 및 온라인 신청은 상단 [캘린더] 또는 [프로그램] 탭에서 확인하실 수 있습니다." style="padding: 8px 12px; font-size: 13px;" />
              </div>

              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                <div>
                  <label class="admin-field-label" for="popup-btn-text">메인 바로가기 버튼 텍스트</label>
                  <input type="text" id="popup-btn-text" class="m3-input" value="${escapeHtml(config.primaryButtonText || '📋 전체 프로그램 보러가기')}" style="padding: 8px 12px; font-size: 13.5px;" />
                </div>
                <div>
                  <label class="admin-field-label" for="popup-btn-tab">버튼 클릭 시 이동 탭</label>
                  <select id="popup-btn-tab" class="m3-input" style="padding: 8px 12px; font-size: 13.5px;">
                    <option value="programs" ${config.primaryButtonTab === 'programs' ? 'selected' : ''}>프로그램 탭</option>
                    <option value="calendar" ${config.primaryButtonTab === 'calendar' ? 'selected' : ''}>캘린더 탭</option>
                    <option value="reviews" ${config.primaryButtonTab === 'reviews' ? 'selected' : ''}>참여후기 탭</option>
                    <option value="padlet" ${config.primaryButtonTab === 'padlet' ? 'selected' : ''}>수업나눔방 탭</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 하단 저장 / 미리보기 / 취소 버튼 바 -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 24px; padding-top: 16px; border-top: 1.5px solid #e2e8f0;">
              <button type="button" id="btn-reset-popup-config" class="btn-admin-action danger" style="font-size: 13px;">
                기본값 복원
              </button>
              
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" id="btn-preview-popup" class="btn-admin-action" style="font-size: 13px; background: #e2e8f0; color: #0e3753;">
                  👁️ 미리보기
                </button>
                <button type="button" id="btn-cancel-admin-popup" class="btn-admin-action" style="font-size: 13px;">
                  취소
                </button>
                <button type="submit" class="btn-admin-action filled" style="font-size: 13.5px; padding: 8px 20px;">
                  💾 설정 저장 및 적용
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    `;

    bindEvents();
  }

  function collectFormData() {
    const form = mount.querySelector("#admin-popup-form");
    if (!form) return config;

    const enabled = form.querySelector("#popup-enabled-chk").checked;
    const badge = form.querySelector("#popup-badge-input").value.trim();
    const title = form.querySelector("#popup-title-input").value.trim();
    const subtitle = form.querySelector("#popup-subtitle-input").value.trim();

    // 일정 변경 섹션
    const schedEnabled = form.querySelector("#sec-schedule-enabled").checked;
    const schedTitle = form.querySelector("#sec-schedule-title").value.trim();
    const schedDesc = form.querySelector("#sec-schedule-desc").value.trim();
    
    const schedRows = form.querySelectorAll("#schedule-items-container .admin-item-row");
    const schedItems = [];
    schedRows.forEach(row => {
      const itemTitle = row.querySelector(".sched-title-input")?.value.trim() || "";
      const itemNote = row.querySelector(".sched-note-input")?.value.trim() || "";
      const itemOriginal = row.querySelector(".sched-original-input")?.value.trim() || "";
      const itemUpdated = row.querySelector(".sched-updated-input")?.value.trim() || "";
      if (itemTitle || itemUpdated) {
        schedItems.push({
          title: itemTitle,
          note: itemNote,
          original: itemOriginal,
          updated: itemUpdated
        });
      }
    });

    // 모집 연수 섹션
    const recruitEnabled = form.querySelector("#sec-recruit-enabled").checked;
    const recruitTitle = form.querySelector("#sec-recruit-title").value.trim();
    const recruitDesc = form.querySelector("#sec-recruit-desc").value.trim();

    const recruitRows = form.querySelectorAll("#recruit-items-container .admin-item-row");
    const recruitItems = [];
    recruitRows.forEach(row => {
      const name = row.querySelector(".recruit-name-input")?.value.trim() || "";
      const status = row.querySelector(".recruit-status-input")?.value.trim() || "모집중";
      const date = row.querySelector(".recruit-date-input")?.value.trim() || "";
      const location = row.querySelector(".recruit-loc-input")?.value.trim() || "";
      const target = row.querySelector(".recruit-target-input")?.value.trim() || "";
      const link = row.querySelector(".recruit-link-input")?.value.trim() || "";
      if (name) {
        recruitItems.push({
          name,
          status,
          date,
          location,
          target,
          link
        });
      }
    });

    // 하단 정보
    const footerNotice = form.querySelector("#popup-footer-notice").value.trim();
    const primaryButtonText = form.querySelector("#popup-btn-text").value.trim();
    const primaryButtonTab = form.querySelector("#popup-btn-tab").value;

    return {
      enabled,
      badge,
      title,
      subtitle,
      scheduleChangeSection: {
        enabled: schedEnabled,
        badge: "일정 변경 안내",
        title: schedTitle,
        description: schedDesc,
        items: schedItems
      },
      recruitingSection: {
        enabled: recruitEnabled,
        badge: "모집 중",
        title: recruitTitle,
        description: recruitDesc,
        items: recruitItems
      },
      footerNotice,
      primaryButtonText,
      primaryButtonTab
    };
  }

  function bindEvents() {
    const backdrop = mount.querySelector("#admin-popup-modal-backdrop");
    const closeBtn = mount.querySelector("#btn-close-admin-popup-modal");
    const cancelBtn = mount.querySelector("#btn-cancel-admin-popup");
    const form = mount.querySelector("#admin-popup-form");
    const btnPreview = mount.querySelector("#btn-preview-popup");
    const btnReset = mount.querySelector("#btn-reset-popup-config");
    const chkEnabled = mount.querySelector("#popup-enabled-chk");
    const statusText = mount.querySelector("#popup-enabled-status-text");

    const closeModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => { mount.innerHTML = ""; }, 200);
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    if (chkEnabled && statusText) {
      chkEnabled.addEventListener("change", () => {
        if (chkEnabled.checked) {
          statusText.textContent = "활성화 (ON)";
          statusText.style.color = "#0f766e";
        } else {
          statusText.textContent = "비활성화 (OFF)";
          statusText.style.color = "#dc2626";
        }
      });
    }

    // 변경 항목 추가 버튼
    const btnAddSchedule = mount.querySelector("#btn-add-schedule-item");
    if (btnAddSchedule) {
      btnAddSchedule.addEventListener("click", () => {
        config = collectFormData();
        if (!config.scheduleChangeSection.items) config.scheduleChangeSection.items = [];
        config.scheduleChangeSection.items.push({
          title: "",
          note: "신규 변경",
          original: "인쇄물: ",
          updated: "변경: "
        });
        renderForm();
      });
    }

    // 변경 항목 삭제 버튼들
    mount.querySelectorAll(".btn-remove-schedule-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        config = collectFormData();
        config.scheduleChangeSection.items.splice(idx, 1);
        renderForm();
      });
    });

    // 모집 연수 추가 버튼
    const btnAddRecruit = mount.querySelector("#btn-add-recruit-item");
    if (btnAddRecruit) {
      btnAddRecruit.addEventListener("click", () => {
        config = collectFormData();
        if (!config.recruitingSection.items) config.recruitingSection.items = [];
        config.recruitingSection.items.push({
          name: "",
          status: "모집중",
          date: "",
          location: "",
          target: "",
          link: ""
        });
        renderForm();
      });
    }

    // 모집 연수 삭제 버튼들
    mount.querySelectorAll(".btn-remove-recruit-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        config = collectFormData();
        config.recruitingSection.items.splice(idx, 1);
        renderForm();
      });
    });

    // 미리보기 버튼
    if (btnPreview) {
      btnPreview.addEventListener("click", () => {
        const currentData = collectFormData();
        openNoticePopupModal(currentData);
      });
    }

    // 기본값 복원 버튼
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("팝업 공지 설정을 초기 기본값으로 복원하시겠습니까?")) {
          resetPopupNoticeConfig();
          config = JSON.parse(JSON.stringify(DEFAULT_POPUP_NOTICE));
          renderForm();
          alert("✅ 기본값으로 복원되었습니다.");
        }
      });
    }

    // 폼 저장
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const finalData = collectFormData();
        savePopupNoticeConfig(finalData);
        alert("✅ 팝업 공지 설정이 성공적으로 저장 및 적용되었습니다!");
        closeModal();
        if (onSaved) onSaved(finalData);
      });
    }
  }

  renderForm();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
