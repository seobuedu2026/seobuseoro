import { getEvents, saveEvents, resetEventsToDefault, parseExcelRowToEvent } from "../data/events.js";

let parsedEventsPreview = [];
let xlsxPromise = null;

// SheetJS 엑셀 라이브러리 온디맨드(지연) 로더 (일반 접속자 데이터 절약)
function loadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;

  xlsxPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => {
      xlsxPromise = null;
      reject(new Error("SheetJS 로드 실패"));
    };
    document.head.appendChild(script);
  });
  return xlsxPromise;
}

export function openAdminExcelModal() {
  const mount = document.getElementById("modal-mount");
  parsedEventsPreview = [];
  loadSheetJS(); // 모달 오픈 시 백그라운드 프리페치

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="admin-excel-backdrop">
      <div class="m3-modal-dialog" style="max-width: 820px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background:#0e3753; color:#fff; font-size:12px; font-weight:800; padding:4px 10px; border-radius:9999px;">
              ADMIN ONLY
            </span>
            <h2 style="font-size: 20px; font-weight: 900; color: #0e3753; margin: 0;">
              ⚙️ 엑셀(Excel) 행사 일정 일괄 등록
            </h2>
          </div>
          <button class="modal-close-btn" id="btn-close-admin-modal" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #475569; margin-bottom: 16px; line-height: 1.5;">
          행사 일정 엑셀 파일(연번, 연수명, 일시, 장소, 대상, 내용, 신청방법)을 업로드하면 
          <strong>일정 및 카테고리가 캘린더와 프로그램 목록에 자동으로 연동</strong>됩니다.
        </p>

        <!-- 엑셀 드래그 앤 드롭 영역 -->
        <div class="excel-drop-zone" id="excel-drop-zone">
          <input type="file" id="excel-file-input" accept=".xlsx, .xls, .csv" style="display: none;" />
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#008080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          <div style="font-size: 15px; font-weight: 800; color: #0e3753; margin-bottom: 4px;">
            클릭하여 엑셀 파일 선택 또는 여기로 드래그 앤 드롭
          </div>
          <div style="font-size: 12px; color: #64748b;">
            지원 형식: .xlsx, .xls, .csv
          </div>
        </div>

        <!-- 템플릿 다운로드 및 기본값 복원 바 -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0 18px 0; flex-wrap: wrap; gap: 8px;">
          <button id="btn-download-sample-excel" class="btn-admin-action">
            표준 엑셀 양식 다운로드
          </button>
          <button id="btn-reset-default-events" class="btn-admin-action danger">
            기본 데이터로 초기화
          </button>
        </div>

        <!-- 파싱 결과 미리보기 영역 -->
        <div id="excel-preview-area" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <h3 style="font-size: 15px; font-weight: 800; color: #0e3753;">
              📋 파싱된 행사 미리보기 (<span id="preview-count">0</span>건)
            </h3>
            <span style="font-size: 12px; color: #16a34a; font-weight: 700;">✓ 유효한 데이터가 확인되었습니다.</span>
          </div>

          <div class="excel-preview-table-wrap">
            <table class="excel-preview-table">
              <thead>
                <tr>
                  <th>월/일</th>
                  <th>구분(카테고리)</th>
                  <th>연수명</th>
                  <th>장소</th>
                  <th>시간</th>
                  <th>신청방법</th>
                </tr>
              </thead>
              <tbody id="excel-preview-tbody"></tbody>
            </table>
          </div>

          <!-- 반영 버튼 그룹 -->
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button id="btn-apply-merge" class="btn-admin-action">
              기존 일정에 추가하기
            </button>
            <button id="btn-apply-replace" class="btn-admin-action filled">
              캘린더에 전체 반영하기
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // 요소 참조
  const backdrop = mount.querySelector("#admin-excel-backdrop");
  const closeBtn = mount.querySelector("#btn-close-admin-modal");
  const dropZone = mount.querySelector("#excel-drop-zone");
  const fileInput = mount.querySelector("#excel-file-input");
  const previewArea = mount.querySelector("#excel-preview-area");
  const previewTbody = mount.querySelector("#excel-preview-tbody");
  const previewCount = mount.querySelector("#preview-count");
  const btnReplace = mount.querySelector("#btn-apply-replace");
  const btnMerge = mount.querySelector("#btn-apply-merge");
  const btnReset = mount.querySelector("#btn-reset-default-events");
  const btnDownloadSample = mount.querySelector("#btn-download-sample-excel");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => { mount.innerHTML = ""; }, 200);
  };

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // 드래그 앤 드롭 이벤트
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // 파일 파싱 처리
  async function handleFile(file) {
    try {
      await loadSheetJS();
    } catch (err) {
      alert("SheetJS 라이브러리를 불러오는데 실패했습니다: " + err.message);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = window.XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          alert("엑셀 파일에 유효한 데이터가 없습니다.");
          return;
        }

        parsedEventsPreview = [];
        jsonRows.forEach((row, idx) => {
          const eventObj = parseExcelRowToEvent(row, idx);
          if (eventObj) {
            parsedEventsPreview.push(eventObj);
          }
        });

        if (parsedEventsPreview.length === 0) {
          alert("행사 데이터를 인식하지 못했습니다. 열 제목(연수명, 일시 등)을 확인해주세요.");
          return;
        }

        // 미리보기 테이블 렌더링
        renderPreviewTable();
      } catch (err) {
        console.error("Excel parse error", err);
        alert("엑셀 파일 읽기 중 오류가 발생했습니다: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function renderPreviewTable() {
    previewArea.style.display = "block";
    previewCount.textContent = parsedEventsPreview.length;
    previewTbody.innerHTML = parsedEventsPreview.map(ev => `
      <tr>
        <td><strong>${ev.month}월 ${ev.day}일</strong></td>
        <td><span class="prog-category-badge ${ev.categoryClass}" style="font-size:11px;">${ev.categoryLabel}</span></td>
        <td>
          <div style="font-weight:700; color:#0e3753;">${ev.title}</div>
          ${ev.subtitle ? `<div style="font-size:11px; color:#64748b;">${ev.subtitle}</div>` : ''}
        </td>
        <td>${ev.location}</td>
        <td><span style="font-size:11px;">${ev.time}</span></td>
        <td><span style="font-size:11px; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${ev.applyMethod}</span></td>
      </tr>
    `).join("");
  }

  // 전체 반영 (덮어쓰기)
  btnReplace.addEventListener("click", () => {
    if (parsedEventsPreview.length === 0) return;
    saveEvents(parsedEventsPreview);
    alert(`🎉 총 ${parsedEventsPreview.length}건의 행사가 캘린더에 성공적으로 반영되었습니다!`);
    closeModal();
  });

  // 기존 일정에 병합 추가
  btnMerge.addEventListener("click", () => {
    if (parsedEventsPreview.length === 0) return;
    const current = getEvents();
    const merged = [...current, ...parsedEventsPreview];
    saveEvents(merged);
    alert(`🎉 기존 일정에 ${parsedEventsPreview.length}건이 추가되었습니다!`);
    closeModal();
  });

  // 기본값 초기화
  btnReset.addEventListener("click", () => {
    if (confirm("정말로 기본 캘린더 데이터로 초기화하시겠습니까? (사용자 업로드 내역이 삭제됩니다)")) {
      resetEventsToDefault();
      alert("기본 캘린더 일정으로 복원되었습니다.");
      closeModal();
    }
  });

  // 샘플 엑셀 다운로드
  btnDownloadSample.addEventListener("click", () => {
    downloadSampleExcel();
  });
}

// 표준 샘플 엑셀 파일 동적 생성 및 다운로드
async function downloadSampleExcel() {
  try {
    await loadSheetJS();
  } catch (err) {
    alert("SheetJS 라이브러리를 불러오는데 실패했습니다: " + err.message);
    return;
  }
  if (!window.XLSX) return;

  const sampleData = [
    {
      "연번": 1,
      "연수명": "(수다박스) 연구부장 협의회",
      "일시": "9. 9.(수) 15:00~16:30",
      "장소": "카페 느티",
      "대상": "관내 연구(교육과정) 부장",
      "내용": "연구(교육과정) 부장 업무관련 내용 협의 및 개선방안 모색",
      "신청방법": "교데통"
    },
    {
      "연번": 2,
      "연수명": "(수다박스) 학적업무 첫걸음",
      "일시": "9. 10.(목) 15:20~17:00",
      "장소": "녹번초",
      "대상": "관내 교무·연구부장 및 희망교원",
      "내용": "다양한 학적 사례 공유 및 처리 방법 안내 등",
      "신청방법": "URL 링크"
    },
    {
      "연번": 3,
      "연수명": "김태호 작가와 함께하는 독서교육 특강",
      "일시": "9. 18.(금) 15:00~17:00",
      "장소": "서부교육지원청 강당(5층)",
      "대상": "관내 초등희망교원",
      "내용": "과학 독서를 통한 문해력 신장 및 독서 활용 수업 방안 모색",
      "신청방법": "URL 링크"
    },
    {
      "연번": 4,
      "연수명": "서부서로, 다름을 잇다 다문화 연수",
      "일시": "2026. 10. 6.(화) 15:00~17:00",
      "장소": "로하스A플렉스",
      "대상": "관내 초등희망교원",
      "내용": "이주배경학생의 학교생활 적응 및 한국어 교육을 위한 지원",
      "신청방법": "추후안내"
    }
  ];

  const ws = window.XLSX.utils.json_to_sheet(sampleData);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "서부수업성장일정");
  window.XLSX.writeFile(wb, "서부수업성장캘린더_업로드양식.xlsx");
}
