document.addEventListener("DOMContentLoaded", function () {
    // DOM 요소
    const form = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const currencySelector = document.getElementById("currency-selector");
    const summarySelector = document.getElementById("summary-type");
    const summaryOutput = document.getElementById("summary-output");
    const chartTypeSelector = document.getElementById("chart-type");
    const chartCanvas = document.getElementById("expense-chart");
    const exportBtn = document.getElementById("export-btn");
    const importBtn = document.getElementById("import-btn");
    const importInput = document.getElementById("import-input");
  
    const currencySymbols = {
      KRW: "₩",
      USD: "$",
      GBP: "£",
      EUR: "€",
      AUD: "A$",
      CAD: "C$",
      JPY: "¥",
      CNY: "¥"
    };
  
    let selectedCurrency = localStorage.getItem("currency") || "KRW";
    currencySelector.value = selectedCurrency;
  
    let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    let chartInstance = null;
  
    // 초기 출력
    expenses.forEach(addExpenseToDOM);
    showSummary("all");
  
    // 탭 전환
    document.getElementById("home-btn").addEventListener("click", () => {
      document.getElementById("main-view").style.display = "block";
      document.getElementById("analysis-view").style.display = "none";
    });
  
    document.getElementById("analysis-btn").addEventListener("click", () => {
      document.getElementById("main-view").style.display = "none";
      document.getElementById("analysis-view").style.display = "block";
    });
  
    // 통화 변경
    currencySelector.addEventListener("change", function () {
      selectedCurrency = currencySelector.value;
      localStorage.setItem("currency", selectedCurrency);
    });
  
    // 요약 필터 변경
    summarySelector.addEventListener("change", function () {
      showSummary(summarySelector.value);
    });
  
    // 차트 유형 변경
    chartTypeSelector.addEventListener("change", function () {
      const type = chartTypeSelector.value;
      if (type) {
        drawChart(type);
      } else {
        if (chartInstance) {
          chartInstance.destroy();
          chartInstance = null;
        }
      }
    });
  
    // 항목 추가
    form.addEventListener("submit", function (e) {
      e.preventDefault();
  
      const date = document.getElementById("date").value;
      const amount = document.getElementById("amount").value;
      const category = document.getElementById("category").value;
      const note = document.getElementById("note").value;
  
      if (!date || !amount || !category) {
        alert("Please fill in all required fields.");
        return;
      }
  
      const newExpense = {
        id: Date.now(),
        date,
        amount,
        category,
        note,
        currency: selectedCurrency
      };
  
      expenses.push(newExpense);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      addExpenseToDOM(newExpense);
      form.reset();
      showSummary(summarySelector.value);
    });
  
    // DOM에 행 추가
    function addExpenseToDOM(expense) {
      const symbol = currencySymbols[expense.currency] || "";
      const tr = document.createElement("tr");
      tr.setAttribute("data-id", expense.id);
  
      tr.innerHTML = `
        <td>${expense.date}</td>
        <td>${symbol}${expense.amount}</td>
        <td>${expense.category}</td>
        <td>${expense.note || ""}</td>
        <td>${expense.currency}</td>
        <td></td>
      `;
  
      const actionCell = tr.querySelector("td:last-child");
  
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", function () {
        expenseList.removeChild(tr);
        expenses = expenses.filter(item => item.id !== expense.id);
        localStorage.setItem("expenses", JSON.stringify(expenses));
        showSummary(summarySelector.value);
        if (chartTypeSelector.value) drawChart(chartTypeSelector.value);
      });
  
      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.style.marginLeft = "5px";
      editBtn.addEventListener("click", function () {
        document.getElementById("date").value = expense.date;
        document.getElementById("amount").value = expense.amount;
        document.getElementById("category").value = expense.category;
        document.getElementById("note").value = expense.note;
        currencySelector.value = expense.currency;
        selectedCurrency = expense.currency;
  
        expenseList.removeChild(tr);
        expenses = expenses.filter(item => item.id !== expense.id);
        localStorage.setItem("expenses", JSON.stringify(expenses));
        showSummary(summarySelector.value);
        if (chartTypeSelector.value) drawChart(chartTypeSelector.value);
      });
  
      actionCell.appendChild(deleteBtn);
      actionCell.appendChild(editBtn);
      expenseList.appendChild(tr);
    }
  
    // 요약 뷰 출력
    function showSummary(mode) {
      summaryOutput.innerHTML = "";
      const grouped = {};
  
      expenses.forEach(exp => {
        const dateObj = new Date(exp.date);
        let key;
  
        switch (mode) {
          case "weekly":
            const startOfWeek = new Date(dateObj);
            startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
            key = startOfWeek.toISOString().slice(0, 10);
            break;
          case "monthly":
            key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
            break;
          case "yearly":
            key = `${dateObj.getFullYear()}`;
            break;
          case "category":
            key = exp.category;
            break;
          default:
            key = "Total";
        }
  
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += Number(exp.amount);
      });
  
      for (const [key, total] of Object.entries(grouped)) {
        const p = document.createElement("p");
        p.textContent = `${key} : ${currencySymbols[selectedCurrency]}${total.toLocaleString()}`;
        summaryOutput.appendChild(p);
      }
    }
  
    // 차트 그리기
    function drawChart(type) {
      if (chartInstance) chartInstance.destroy();
  
      const grouped = {};
      expenses.forEach(exp => {
        const dateObj = new Date(exp.date);
        let key;
  
        switch (type) {
          case "category":
            key = exp.category;
            break;
          case "monthly":
            key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
            break;
          case "weekly":
            const startOfWeek = new Date(dateObj);
            startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
            key = startOfWeek.toISOString().slice(0, 10);
            break;
          case "yearly":
            key = `${dateObj.getFullYear()}`;
            break;
          default:
            key = "Other";
        }
  
        if (!grouped[key]) grouped[key] = 0;
        grouped[key] += Number(exp.amount);
      });
  
      const labels = Object.keys(grouped);
      const data = Object.values(grouped);
      let chartType = "bar";
      if (type === "category") chartType = "pie";
      else if (type === "yearly") chartType = "line";
  
      chartInstance = new Chart(chartCanvas, {
        type: chartType,
        data: {
          labels,
          datasets: [{
            label: "Expenses",
            data,
            backgroundColor: [
              "#4dc9f6", "#f67019", "#f53794", "#537bc4",
              "#acc236", "#166a8f", "#00a950", "#58595b"
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: chartType === "pie",
              position: "right"
            },
            title: {
              display: true,
              text: `Expense ${type.charAt(0).toUpperCase() + type.slice(1)} Chart`
            }
          },
          scales: chartType === "pie" ? {} : {
            y: { beginAtZero: true }
          }
        }
      });
    }
  
    // CSV 내보내기
    exportBtn.addEventListener("click", () => {
      const csvHeader = ["id", "date", "amount", "category", "note", "currency"];
      const csvRows = [csvHeader.join(",")];
  
      expenses.forEach(exp => {
        const row = [
          exp.id,
          exp.date,
          exp.amount,
          `"${exp.category}"`,
          `"${exp.note || ""}"`,
          exp.currency
        ];
        csvRows.push(row.join(","));
      });
  
      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expenses.csv");
      link.click();
    });
  
    // CSV 가져오기
    importBtn.addEventListener("click", () => {
      importInput.click();
    });
  
    importInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = function (event) {
        const text = event.target.result;
        const lines = text.trim().split("\n");
        const newData = lines.slice(1).map(line => {
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          return {
            id: Number(cols[0]),
            date: cols[1],
            amount: Number(cols[2]),
            category: cols[3].replace(/(^"|"$)/g, ""),
            note: cols[4].replace(/(^"|"$)/g, ""),
            currency: cols[5]
          };
        });
  
        expenses = newData;
        localStorage.setItem("expenses", JSON.stringify(expenses));
  
        expenseList.innerHTML = "";
        expenses.forEach(addExpenseToDOM);
        showSummary(summarySelector.value);
        if (chartTypeSelector.value) drawChart(chartTypeSelector.value);
      };
  
      reader.readAsText(file);
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      console.log("✅ Service worker registered");
  
      reg.onupdatefound = () => {
        const newWorker = reg.installing;
        newWorker.onstatechange = () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log("🆕 New version found. Reloading...");
            window.location.reload();
          }
        };
      };
    }).catch(err => {
      console.error("❌ Service worker registration failed:", err);
    });
  }
  
  