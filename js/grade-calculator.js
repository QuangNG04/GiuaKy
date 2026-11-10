const WEIGHTS = {
    attendance: 0.1,
    midterm: 0.3,
    final: 0.6
};

export function calculateSubjectAverage(scores) {
    const [attendance, midterm, final] = scores;

    return (
        attendance * WEIGHTS.attendance +
        midterm * WEIGHTS.midterm +
        final * WEIGHTS.final
    );
}

export function calculateStudentResult(grade, subjects) {
    const subjectResults = subjects.map(subject => {
        const scores = grade.scores[subject.id];

        return {
            subjectId: subject.id,
            subjectName: subject.name,
            scores,
            average: calculateSubjectAverage(scores)
        };
    });

    const average =
        subjectResults.reduce((sum, item) => sum + item.average, 0) /
        subjectResults.length;

    const hasFailedSubject = subjectResults.some(
        item => item.average < 5
    );

    let classification;

    if (average >= 8.5) {
        classification = "Giỏi";
    } else if (average >= 7) {
        classification = "Khá";
    } else if (average >= 5) {
        classification = "Trung bình";
    } else {
        classification = "Yếu";
    }

    let scholarship = 0;

    if (!hasFailedSubject && average >= 8.5) {
        scholarship = 1500000;
    } else if (!hasFailedSubject && average >= 8) {
        scholarship = 1000000;
    }

    return {
        subjectResults,
        average,
        classification,
        scholarship
    };
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(amount);
}
export function calculateScholarships(students, subjects, grades) {
    const TOTAL_FUND = 100000000;
    const gradeMap = new Map(grades.map(g => [g.student_id, g]));

    let studentResults = students.map(student => {
        const grade = gradeMap.get(student.id);
        if (!grade) return null;
        const res = calculateStudentResult(grade, subjects);
        return {
            student,
            average: res.average,
            classification: res.classification
        };
    }).filter(Boolean);

    studentResults.sort((a, b) => {
        if (b.average !== a.average) {
            return b.average - a.average;
        }
        return a.student.id.localeCompare(b.student.id);
    });

    const totalStudents = studentResults.length;

    const countTop10 = Math.ceil(totalStudents * 0.10);
    const countTop30 = Math.ceil(totalStudents * 0.30);
    const countTop50 = Math.ceil(totalStudents * 0.50);

    const group1Size = countTop10;
    const group2Size = Math.max(0, countTop30 - countTop10);
    const group3Size = Math.max(0, countTop50 - countTop30);

    const fund1 = TOTAL_FUND * 0.40;
    const fund2 = TOTAL_FUND * 0.40;
    const fund3 = TOTAL_FUND * 0.20;

    function distributeGroupFund(groupStudents, groupFund) {
        if (groupStudents.length === 0 || groupFund <= 0) return;

        const rawShare = groupFund / groupStudents.length;
        let baseShare = Math.floor(rawShare / 1000) * 1000;

        let totalAllocated = 0;
        groupStudents.forEach(item => {
            item.scholarship = baseShare;
            totalAllocated += baseShare;
        });

        let remainder = groupFund - totalAllocated;
        let index = 0;
        while (remainder >= 1000 && index < groupStudents.length) {
            groupStudents[index].scholarship += 1000;
            remainder -= 1000;
            index++;
        }
    }

    const group1 = studentResults.slice(0, group1Size);
    const group2 = studentResults.slice(group1Size, group1Size + group2Size);
    const group3 = studentResults.slice(group1Size + group2Size, group1Size + group2Size + group3Size);
    const rest = studentResults.slice(group1Size + group2Size + group3Size);

    group1.forEach(item => item.groupName = "Nhóm 1 (Top 10%)");
    distributeGroupFund(group1, fund1);

    group2.forEach(item => item.groupName = "Nhóm 2 (Tiếp theo đến 30%)");
    distributeGroupFund(group2, fund2);

    group3.forEach(item => item.groupName = "Nhóm 3 (Tiếp theo đến 50%)");
    distributeGroupFund(group3, fund3);

    rest.forEach(item => {
        item.groupName = "Không đạt";
        item.scholarship = 0;
    });

    let currentRank = 1;
    studentResults.forEach((item, index) => {
        if (index > 0 && item.average < studentResults[index - 1].average) {
            currentRank = index + 1;
        }
        item.rank = currentRank;
    });

    return studentResults;
}