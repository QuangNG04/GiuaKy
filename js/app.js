import { loadData } from "./data-loader.js";
import { renderStudentList } from "./student-list.js";
import { setupStudentModal } from "./student-modal.js";
import { calculateStudentResult, formatCurrency, calculateScholarships } from "./grade-calculator.js";

function sortStudentsByName(students) {
    return students.sort((a, b) => {
        const nameA = a.name.trim().split(" ").pop();
        const nameB = b.name.trim().split(" ").pop();

        const compareName = nameA.localeCompare(nameB, 'vi', { sensitivity: 'accent' });
        
        if (compareName !== 0) {
            return compareName;
        }

        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'accent' });
    });
}

function calculateStatistics(students, subjects, grades) {
    const gradeMap = new Map(grades.map(g => [g.student_id, g]));

    const studentResults = students.map(student => {
        const grade = gradeMap.get(student.id);
        if (!grade) return null;
        return {
            student,
            ...calculateStudentResult(grade, subjects)
        };
    }).filter(Boolean);

    let topStudent = null;
    if (studentResults.length > 0) {
        topStudent = studentResults.reduce((max, curr) => curr.average > max.average ? curr : max);
    }

    const classificationCounts = { "Giỏi": 0, "Khá": 0, "Trung bình": 0, "Yếu": 0 };
    studentResults.forEach(res => {
        if (classificationCounts[res.classification] !== undefined) {
            classificationCounts[res.classification]++;
        }
    });

    const studentsWithFailedSubject = studentResults.filter(res => 
        res.subjectResults.some(sub => sub.average < 5)
    );

    const subjectStats = subjects.map(subject => {
        let scoresList = [];
        studentResults.forEach(res => {
            const subRes = res.subjectResults.find(s => s.subjectId === subject.id);
            if (subRes) scoresList.push(subRes.average);
        });

        const min = scoresList.length ? Math.min(...scoresList) : 0;
        const max = scoresList.length ? Math.max(...scoresList) : 0;
        const avg = scoresList.length ? scoresList.reduce((a, b) => a + b, 0) / scoresList.length : 0;

        return {
            subjectName: subject.name,
            min: min.toFixed(2),
            max: max.toFixed(2),
            avg: avg.toFixed(2)
        };
    });

    return {
        topStudent,
        classificationCounts,
        studentsWithFailedSubject,
        subjectStats
    };
}

async function init() {
    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");
    const searchInput = document.getElementById("searchInput");

    try {
        const { students, subjects, grades } = await loadData();

        sortStudentsByName(students);

        const stats = calculateStatistics(students, subjects, grades);
        const scholarshipList = calculateScholarships(students, subjects, grades);
        console.log("Danh sách học bổng phân bổ:", scholarshipList);

        if (stats.topStudent) {
            document.getElementById("topStudentName").textContent = stats.topStudent.student.name;
            document.getElementById("topStudentAvg").textContent = stats.topStudent.average.toFixed(2);
        }
        document.getElementById("countGioi").textContent = stats.classificationCounts["Giỏi"];
        document.getElementById("countKha").textContent = stats.classificationCounts["Khá"];
        document.getElementById("countTB").textContent = stats.classificationCounts["Trung bình"];
        document.getElementById("countYeu").textContent = stats.classificationCounts["Yếu"];
        document.getElementById("countFailed").textContent = stats.studentsWithFailedSubject.length;

        const select1 = document.getElementById("selectStudent1");
        const select2 = document.getElementById("selectStudent2");
        const compareContainer = document.getElementById("compareResultContainer");

        const optionOptionsHtml = `<option value="">-- Chọn sinh viên --</option>` + 
            students.map(s => `<option value="${s.id}">${s.id} - ${s.name}</option>`).join("");
        
        select1.innerHTML = optionOptionsHtml;
        select2.innerHTML = optionOptionsHtml;

        function handleCompare() {
            const id1 = select1.value;
            const id2 = select2.value;

            if (!id1 || !id2) {
                compareContainer.innerHTML = `<p style="color: #666;">Vui lòng chọn đủ 2 sinh viên để so sánh.</p>`;
                return;
            }

            const student1 = students.find(s => s.id === id1);
            const student2 = students.find(s => s.id === id2);
            const grade1 = grades.find(g => g.student_id === id1);
            const grade2 = grades.find(g => g.student_id === id2);

            if (!student1 || !student2 || !grade1 || !grade2) return;

            const res1 = calculateStudentResult(grade1, subjects);
            const res2 = calculateStudentResult(grade2, subjects);

            compareContainer.innerHTML = `
                <table class="detail-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>Tiêu chí</th>
                            <th>${student1.name} (${student1.id})</th>
                            <th>${student2.name} (${student2.id})</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Điểm TB Học kỳ</strong></td>
                            <td><strong style="color: #007bff;">${res1.average.toFixed(2)}</strong></td>
                            <td><strong style="color: #007bff;">${res2.average.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Xếp loại</strong></td>
                            <td>${res1.classification}</td>
                            <td>${res2.classification}</td>
                        </tr>
                        <tr>
                            <td><strong>Học bổng</strong></td>
                            <td>${formatCurrency(res1.scholarship)}</td>
                            <td>${formatCurrency(res2.scholarship)}</td>
                        </tr>
                        ${subjects.map(sub => {
                            const sub1 = res1.subjectResults.find(s => s.subjectId === sub.id);
                            const sub2 = res2.subjectResults.find(s => s.subjectId === sub.id);
                            return `
                                <tr>
                                    <td>${sub.name} (TB)</td>
                                    <td>${sub1 ? sub1.average.toFixed(2) : '--'}</td>
                                    <td>${sub2 ? sub2.average.toFixed(2) : '--'}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            `;
        }

        select1.addEventListener("change", handleCompare);
        select2.addEventListener("change", handleCompare);

        renderStudentList(students, subjects, grades);
        setupStudentModal(students, subjects, grades);

        searchInput.addEventListener("input", () => {
            const keyword = searchInput.value.trim().toLowerCase();

            const filteredStudents = students.filter(student =>
                student.id.toLowerCase().includes(keyword) ||
                student.name.toLowerCase().includes(keyword)
            );

            renderStudentList(filteredStudents, subjects, grades);
        });

        loadingMessage.hidden = true;
    } catch (error) {
        loadingMessage.hidden = true;
        errorMessage.hidden = false;
        errorMessage.textContent = error.message;
        console.error(error);
    }
}

init();