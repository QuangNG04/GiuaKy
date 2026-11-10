import {
    calculateStudentResult,
    formatCurrency
} from "./grade-calculator.js";

function formatScore(score) {
    return score.toFixed(2);
}

export function renderStudentList(students, subjects, grades) {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("studentTableBody");

    tableHead.innerHTML = `
    <tr>
        <th>Mã SV</th>
        <th>Họ và tên</th>
        ${subjects.map(subject =>
            `<th>${subject.name}</th>`
        ).join("")}
        <th>Điểm TB</th>
        <th>Xếp loại</th>
        <th>Học bổng</th>
        <th>Chi tiết</th>
    </tr>
    `;

    const gradeMap = new Map(
        grades.map(grade => [grade.student_id, grade])
    );

    tableBody.innerHTML = students.map(student => {
        const grade = gradeMap.get(student.id);

        if (!grade) {
            return `
                <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td colspan="${subjects.length + 5}">
                    Chưa có dữ liệu điểm
                </td>
                </tr>
            `;
        }

        const result = calculateStudentResult(grade, subjects);

        return `
            <tr>
                <td>${student.id}</td>
                <td class="student-name">${student.name}</td>
                ${result.subjectResults.map(item => `
                <td>${formatScore(item.average)}</td>
                `).join("")}
                <td class="average-score">
                ${formatScore(result.average)}
                </td>
                <td>
                <span class="classification">
                    ${result.classification}
                </span>
                </td>
                <td>${formatCurrency(result.scholarship)}</td>
                <td>
                <button class="detail-button" data-student-id="${student.id}">
                    Xem
                </button>
                </td>
            </tr>
    `;
    }).join("");

    document.getElementById("totalStudents").textContent =
        students.length;

    const results = students
        .map(student => {
            const grade = gradeMap.get(student.id);
            return grade ? calculateStudentResult(grade, subjects) : null;
        })
        .filter(Boolean);

    const classAverage = results.length
        ? results.reduce((sum, item) => sum + item.average, 0) /
        results.length
        : 0;

    document.getElementById("classAverage").textContent =
        classAverage.toFixed(2);

    document.getElementById("scholarshipCount").textContent =
        results.filter(item => item.scholarship > 0).length;

    document.getElementById("resultCount").textContent =
        `Hiển thị ${students.length} sinh viên`;
}