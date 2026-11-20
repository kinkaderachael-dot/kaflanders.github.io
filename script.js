"use strict";

// GPA grading scale
const grades = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0
};

// DOM elements
const courseContainer = document.getElementById("courseContainer");
const gpaResult = document.getElementById("gpaResult");
const finalResult = document.getElementById("finalResult");
const historyList = document.getElementById("historyList");

// ---------- DARK MODE ----------

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    document.body.classList.toggle("dark-mode", theme === "dark");

    themeToggle.textContent =
        theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

    themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
}

let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("gradeCalculatorTheme") || "light";
} catch (error) {
    console.warn("Theme preference could not be loaded.");
}

applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";

    applyTheme(newTheme);

    try {
        localStorage.setItem("gradeCalculatorTheme", newTheme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
});

// ---------- CALCULATION HISTORY ----------

let history = [];

try {
    const savedHistory = JSON.parse(
        localStorage.getItem("gradeCalculatorHistory") || "[]"
    );

    if (Array.isArray(savedHistory)) {
        history = savedHistory.filter(
            item =>
                item &&
                typeof item.description === "string" &&
                typeof item.date === "string"
        ).slice(0, 5);
    }
} catch (error) {
    history = [];
}

function saveHistory(description) {
    const entry = {
        description,
        date: new Date().toLocaleString()
    };

    history.unshift(entry);
    history = history.slice(0, 5);

    try {
        localStorage.setItem(
            "gradeCalculatorHistory",
            JSON.stringify(history)
        );
    } catch (error) {
        console.warn("Calculation history could not be saved.");
    }

    displayHistory();
}

function displayHistory() {
    historyList.replaceChildren();

    if (history.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No calculations yet.";
        historyList.appendChild(item);
        return;
    }

    history.forEach(entry => {
        const item = document.createElement("li");

        const description = document.createElement("strong");
        description.textContent = entry.description;

        const date = document.createElement("small");
        date.textContent = entry.date;

        item.append(description, date);
        historyList.appendChild(item);
    });
}

document.getElementById("clearHistoryBtn").addEventListener(
    "click",
    () => {
        history = [];

        try {
            localStorage.removeItem("gradeCalculatorHistory");
        } catch (error) {
            console.warn("History could not be cleared from storage.");
        }

        displayHistory();
    }
);

// ---------- FINAL GRADE CALCULATOR ----------

function calculateFinal() {
    const currentInput = document.getElementById("currentGrade").value;
    const weightInput = document.getElementById("finalWeight").value;
    const desiredInput = document.getElementById("desiredGrade").value;

    const current = Number(currentInput);
    const weight = Number(weightInput);
    const desired = Number(desiredInput);

    if (
        currentInput.trim() === "" ||
        weightInput.trim() === "" ||
        desiredInput.trim() === "" ||
        !Number.isFinite(current) ||
        !Number.isFinite(weight) ||
        !Number.isFinite(desired) ||
        current < 0 || current > 100 ||
        weight <= 0 || weight > 100 ||
        desired < 0 || desired > 100
    ) {
        finalResult.textContent =
            "Please enter valid percentages between 0 and 100. Exam weight must be greater than 0.";

        return;
    }

    const needed =
        (desired - current * (1 - weight / 100)) /
        (weight / 100);

    if (needed > 100) {
        finalResult.textContent =
            `You need ${needed.toFixed(2)}% on your final exam. Unfortunately, this goal is not achievable with a 100% exam score.`;

    } else if (needed <= 0) {
        finalResult.textContent =
            "Congratulations! You have already achieved your desired grade.";

    } else {
        finalResult.textContent =
            `You need ${needed.toFixed(2)}% on your final exam.`;
    }

    saveHistory(
        `Final Grade: ${needed.toFixed(2)}% needed`
    );
}

// ---------- GPA COURSE MANAGEMENT ----------

let courseCount = 0;

function addCourse() {
    courseCount++;

    const div = document.createElement("div");
    div.className = "course";

    const heading = document.createElement("h3");
    heading.textContent = `Course ${courseCount}`;

    const nameLabel = document.createElement("label");
    nameLabel.htmlFor = `courseName${courseCount}`;
    nameLabel.textContent = "Course Name";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = `courseName${courseCount}`;
    nameInput.className = "course-name";
    nameInput.placeholder = "Example: Mathematics";

    const creditsLabel = document.createElement("label");
    creditsLabel.htmlFor = `credits${courseCount}`;
    creditsLabel.textContent = "Credit Hours";

    const creditsInput = document.createElement("input");
    creditsInput.type = "number";
    creditsInput.id = `credits${courseCount}`;
    creditsInput.className = "credits";
    creditsInput.min = "0.01";
    creditsInput.step = "any";
    creditsInput.placeholder = "Example: 3";

    const gradeLabel = document.createElement("label");
    gradeLabel.htmlFor = `grade${courseCount}`;
    gradeLabel.textContent = "Letter Grade";

    const gradeSelect = document.createElement("select");
    gradeSelect.id = `grade${courseCount}`;
    gradeSelect.className = "grade";

    ["A", "B", "C", "D", "F"].forEach(grade => {
        const option = document.createElement("option");
        option.value = grade;
        option.textContent = `${grade} (${grades[grade].toFixed(1)})`;
        gradeSelect.appendChild(option);
    });

    div.append(
        heading,
        nameLabel,
        nameInput,
        creditsLabel,
        creditsInput,
        gradeLabel,
        gradeSelect
    );

    courseContainer.appendChild(div);
}

function removeCourse() {
    const courses = courseContainer.querySelectorAll(".course");

    if (courses.length > 1) {
        courses[courses.length - 1].remove();
    } else {
        gpaResult.textContent =
            "At least one course must remain.";
    }
}

// ---------- GPA CALCULATOR ----------

function calculateGPA() {
    const courses = courseContainer.querySelectorAll(".course");

    let totalPoints = 0;
    let totalCredits = 0;

    if (courses.length === 0) {
        gpaResult.textContent =
            "Please add at least one course.";

        return;
    }

    for (const course of courses) {
        const creditsInput = course.querySelector(".credits");
        const gradeInput = course.querySelector(".grade");

        const credits = Number(creditsInput.value);
        const grade = gradeInput.value;

        if (
            creditsInput.value.trim() === "" ||
            !Number.isFinite(credits) ||
            credits <= 0
        ) {
            gpaResult.textContent =
                "Please enter positive credit hours for every course.";

            creditsInput.focus();
            return;
        }

        if (!Object.hasOwn(grades, grade)) {
            gpaResult.textContent =
                "Please select a valid letter grade.";

            gradeInput.focus();
            return;
        }

        totalCredits += credits;
        totalPoints += credits * grades[grade];
    }

    if (totalCredits <= 0) {
        gpaResult.textContent =
            "Please enter valid course information.";

        return;
    }

    const gpa = totalPoints / totalCredits;

    gpaResult.textContent =
        `🎉 Your Estimated GPA: ${gpa.toFixed(2)} / 4.00`;

    saveHistory(`GPA: ${gpa.toFixed(2)} / 4.00`);
}

// ---------- EVENT LISTENERS ----------

document.getElementById("calculateFinalBtn")
    .addEventListener("click", calculateFinal);

document.getElementById("addCourseBtn")
    .addEventListener("click", addCourse);

document.getElementById("removeCourseBtn")
    .addEventListener("click", removeCourse);

document.getElementById("calculateGPABtn")
    .addEventListener("click", calculateGPA);

// Initialize calculator
addCourse();
displayHistory();
