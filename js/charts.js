/**
 * charts.js
 * Chart.js Integration Module
 * Visualizes student performance and assessment distributions cleanly.
 */

let subjectChartInstance = null;
let componentChartInstance = null;

/**
 * Renders or updates the Subject-wise Performance Bar Chart
 */
function renderSubjectPerformanceChart(canvasId, courseBreakdown) {
  if (!window.Chart) {
    console.warn("Chart.js is not loaded.");
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (subjectChartInstance) {
    subjectChartInstance.destroy();
    subjectChartInstance = null;
  }

  const labels = courseBreakdown.map(c => {
    return c.name.length > 20 ? c.name.substring(0, 18) + "…" : c.name;
  });
  const enteredScores = courseBreakdown.map(c => c.enteredMarks);
  const maxOfEntered = courseBreakdown.map(c => c.maxOfEntered);

  subjectChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Marks Entered",
          data: enteredScores,
          backgroundColor: "#1e3a8a",
          borderRadius: 4
        },
        {
          label: "Max Possible (Evaluated Components)",
          data: maxOfEntered,
          backgroundColor: "#cbd5e1",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { size: 12, family: "'Inter', sans-serif" } }
        },
        tooltip: {
          callbacks: {
            title: function (items) {
              const item = courseBreakdown[items[0].dataIndex];
              return `${item.name} (${item.code})`;
            },
            afterLabel: function (context) {
              const item = courseBreakdown[context.dataIndex];
              return `Course Max: ${item.maxPossibleCourseMarks} | Category: ${item.category}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 20,
            font: { size: 11, family: "'Inter', sans-serif" }
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 100,
          title: { display: true, text: "Marks", font: { size: 12, weight: "bold" } }
        }
      }
    }
  });
}

/**
 * Renders or updates Assessment Breakdown Doughnut Chart
 */
function renderAssessmentBreakdownChart(canvasId, summary) {
  if (!window.Chart) return;

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (componentChartInstance) {
    componentChartInstance.destroy();
    componentChartInstance = null;
  }

  const remainingTo650 = Math.max(0, summary.totalSemesterMaxMarks - summary.totalMarksEntered);

  componentChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Theory Marks Entered", "Lab Marks Entered", "Pending / Upcoming (to 650)"],
      datasets: [
        {
          data: [summary.theoryMarksEntered, summary.labMarksEntered, remainingTo650],
          backgroundColor: [
            "#1e3a8a", // SNJB Navy
            "#0f766e", // Teal
            "#e2e8f0"  // Slate Light
          ],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 11, family: "'Inter', sans-serif" } }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.parsed;
              const total = summary.totalSemesterMaxMarks;
              const pct = ((val / total) * 100).toFixed(1);
              return ` ${context.label}: ${val} marks (${pct}% of 650)`;
            }
          }
        }
      }
    }
  });
}

let cohortChartInstance = null;
let courseAvgChartInstance = null;

/**
 * Renders Cohort Performance Distribution (Bar/Doughnut)
 */
function renderCohortDistributionChart(canvasId, roster) {
  if (!window.Chart || !canvasId) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (cohortChartInstance) {
    cohortChartInstance.destroy();
    cohortChartInstance = null;
  }

  // Group students by evaluated percentage ranges
  let tierA = 0; // 85%+
  let tierB = 0; // 75-84%
  let tierC = 0; // 60-74%
  let tierD = 0; // <60%

  roster.forEach(s => {
    const calc = window.AppCalculator ? window.AppCalculator.calculateStudentSummary(s) : null;
    if (calc) {
      const pct = Number(calc.enteredPercentage) || 0;
      if (pct >= 85) tierA++;
      else if (pct >= 75) tierB++;
      else if (pct >= 60) tierC++;
      else tierD++;
    }
  });

  cohortChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Excellent (85%+)", "Very Good (75–84%)", "Good (60–74%)", "Needs Attention (<60%)"],
      datasets: [
        {
          data: [tierA, tierB, tierC, tierD],
          backgroundColor: ["#059669", "#2563eb", "#f59e0b", "#dc2626"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 11, family: "'Inter', sans-serif" } }
        }
      }
    }
  });
}

/**
 * Renders Course Averages Bar Chart
 */
function renderCourseAveragesChart(canvasId, courseSummaries) {
  if (!window.Chart || !canvasId) return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (courseAvgChartInstance) {
    courseAvgChartInstance.destroy();
    courseAvgChartInstance = null;
  }

  const labels = courseSummaries.map(c => c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name);
  const data = courseSummaries.map(c => Number(c.averagePercentage) || 0);

  courseAvgChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Class Average (%)",
          data: data,
          backgroundColor: "#1e3a8a",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Average %" }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 20,
            font: { size: 10 }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

const AppCharts = {
  renderSubjectPerformanceChart,
  renderAssessmentBreakdownChart,
  renderCohortDistributionChart,
  renderCourseAveragesChart
};

if (typeof window !== "undefined") {
  window.AppCharts = AppCharts;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = AppCharts;
}

