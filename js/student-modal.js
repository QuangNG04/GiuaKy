import {
    calculateStudentResult,
    formatCurrency
} from "./grade-calculator.js";
import { renderStudentList } from "./student-list.js";

export function setupStudentModal(students, subjects, grades, updateStatsCallback) {
    const modal = document.getElementById("studentModal");
    const detail = document.getElementById("studentDetail");
    const tableBody = document.getElementById("studentTableBody");

    function closeModal() {
        modal.hidden = true;
    }

    tableBody.addEventListener("click", event => {
        const button = event.target.closest("[data-student-id]");
        if (!button) return;

        const studentId = button.dataset.studentId;
        const student = students.find(item => item.id === studentId);
        const grade = grades.find(item => item.student_id === studentId);

        if (!student || !grade) return;

        function renderModalContent() {
            const result = calculateStudentResult(grade, subjects);

            detail.innerHTML = `
                <div class="student-info">
                    <p><strong>Mã sinh viên:</strong> ${student.id}</p>
                    <p><strong>Họ và tên:</strong> ${student.name}</p>
                    <p><strong>Lớp:</strong> ${student.class}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                </div>

                <h3>Chỉnh sửa điểm các môn</h3>

                <div class="table-wrapper">
                    <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Môn học</th>
                            <th>Chuyên cần (10%)</th>
                            <th>Giữa kỳ (30%)</th>
                            <th>Cuối kỳ (60%)</th>
                            <th>Điểm TB</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.subjectResults.map(item => `
                        <tr>
                            <td>${item.subjectName}</td>
                            <td><input type="number" min="0" max="10" step="0.1" class="score-input" data-subject-id="${item.subjectId}" data-index="0" value="${item.scores[0]}" style="width: 60px; padding: 4px;"></td>
                            <td><input type="number" min="0" max="10" step="0.1" class="score-input" data-subject-id="${item.subjectId}" data-index="1" value="${item.scores[1]}" style="width: 60px; padding: 4px;"></td>
                            <td><input type="number" min="0" max="10" step="0.1" class="score-input" data-subject-id="${item.subjectId}" data-index="2" value="${item.scores[2]}" style="width: 60px; padding: 4px;"></td>
                            <td><strong>${item.average.toFixed(2)}</strong></td>
                        </tr>
                        `).join("")}
                    </tbody>
                    </table>
                </div>

                <div class="result-summary" style="margin-top: 15px;">
                    <p><strong>Điểm trung bình học kỳ:</strong> <span id="modalAvg">${result.average.toFixed(2)}</span></p>
                    <p><strong>Xếp loại:</strong> <span id="modalClass">${result.classification}</span></p>
                    <p><strong>Học bổng:</strong> <span id="modalScholarship">${formatCurrency(result.scholarship)}</span></p>
                </div>

                <div style="margin-top: 20px; text-align: right;">
                    <button id="saveGradesBtn" class="primary-button" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Lưu thay đổi</button>
                </div>
            `;

            
            const saveBtn = document.getElementById("saveGradesBtn");
            if (saveBtn) {
                saveBtn.onclick = () => {
                    
                    const inputs = detail.querySelectorAll(".score-input");
                    inputs.forEach(input => {
                        const subId = input.dataset.subjectId;
                        const idx = parseInt(input.dataset.index);
                        const val = parseFloat(input.value);

                        if (!isNaN(val)) {
                           
                            if (!grade.scores[subId]) {
                                grade.scores[subId] = [0, 0, 0];
                            }
                            grade.scores[subId][idx] = val;
                        }
                    });

                    
                    renderStudentList(students, subjects, grades);
                    
                    
                    location.reload(); 
                };
            }
        }

        renderModalContent();
        modal.hidden = false;
    });

    document.getElementById("closeModal").addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target.hasAttribute("data-close-modal")) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}