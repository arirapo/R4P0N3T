let categories = {};
let entries = [];

const storageKey = "raponet_book_entries_v1";


const els = {

  entryDate:
    document.getElementById("entryDate"),

  entryType:
    document.getElementById("entryType"),

  entryCategory:
    document.getElementById("entryCategory"),

  entryVat:
    document.getElementById("entryVat"),

  entryGross:
    document.getElementById("entryGross"),

  entryPayment:
    document.getElementById("entryPayment"),

  entryDescription:
    document.getElementById("entryDescription"),


  addEntryBtn:
    document.getElementById("addEntryBtn"),

  clearEntriesBtn:
    document.getElementById("clearEntriesBtn"),

  exportBtn:
    document.getElementById("exportBtn"),

  importInput:
    document.getElementById("importInput"),


  printBtn:
    document.getElementById("printBtn"),


  filterYear:
    document.getElementById("filterYear"),

  filterMonth:
    document.getElementById("filterMonth"),


  entriesBody:
    document.getElementById("entriesBody"),

  vatBreakdownBody:
    document.getElementById("vatBreakdownBody"),


  printedDate:
    document.getElementById("printedDate"),

  filterText:
    document.getElementById("filterText"),


  incomeNet:
    document.getElementById("incomeNet"),

  expenseNet:
    document.getElementById("expenseNet"),

  profitNet:
    document.getElementById("profitNet"),


  salesVat:
    document.getElementById("salesVat"),

  purchaseVat:
    document.getElementById("purchaseVat"),

  vatPayable:
    document.getElementById("vatPayable")

};



function formatEuro(value) {

  return new Intl.NumberFormat(
    "fi-FI",
    {
      style: "currency",
      currency: "EUR"
    }
  ).format(value || 0);

}



function isoDate(date) {

  return date
    .toISOString()
    .slice(0, 10);

}



function todayText() {

  return new Date()
    .toLocaleDateString("fi-FI");

}
function calculateParts(gross, vatRate) {

  const divisor =
    1 + (Number(vatRate) || 0) / 100;


  const net =
    Number(gross || 0) / divisor;


  const vat =
    Number(gross || 0) - net;


  return {

    net: net,
    vat: vat,
    gross: Number(gross || 0)

  };

}




async function loadCategories() {

  try {

    const response =
      await fetch("categories.json");


    categories =
      await response.json();


  } catch (error) {


    console.warn(
      "categories.json ei latautunut. Käytetään oletuksia.",
      error
    );


    categories = {

      income: [
        {
          code: "MYYNTI",
          name: "Myynti",
          vat: 25.5
        }
      ],


      expense: [
        {
          code: "OSTOT",
          name: "Ostot",
          vat: 25.5
        },

        {
          code: "MATKAKULU",
          name: "Matkakulu",
          vat: 0
        }
      ]

    };

  }

}
function loadEntries() {

  try {

    entries = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

  } catch {

    entries = [];

  }

}




function saveEntries() {

  localStorage.setItem(
    storageKey,
    JSON.stringify(entries)
  );

}




function populateCategories() {

  const type =
    els.entryType.value;


  const list =
    categories[type] || [];


  els.entryCategory.innerHTML = "";


  list.forEach(item => {


    const option =
      document.createElement("option");


    option.value =
      item.code;


    option.textContent =
      item.name;


    option.dataset.vat =
      item.vat;


    els.entryCategory.appendChild(
      option
    );


  });


  updateVatFromCategory();

}




function updateVatFromCategory() {


  const option =
    els.entryCategory.selectedOptions[0];


  if (!option) return;


  els.entryVat.value =
    option.dataset.vat ?? "25.5";

}
function addEntry() {

  const gross =
    Number(els.entryGross.value || 0);


  if (!els.entryDate.value) {

    alert("Anna päiväys.");

    return;

  }


  if (gross <= 0) {

    alert("Anna summa.");

    return;

  }


  const categoryOption =
    els.entryCategory.selectedOptions[0];


  const categoryName =
    categoryOption
      ? categoryOption.textContent
      : "";


  const vatRate =
    Number(els.entryVat.value || 0);


  const parts =
    calculateParts(
      gross,
      vatRate
    );


  const entry = {

    id:
      crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),


    date:
      els.entryDate.value,


    type:
      els.entryType.value,


    categoryCode:
      els.entryCategory.value,


    categoryName:
      categoryName,


    description:
      els.entryDescription.value,


    payment:
      els.entryPayment.value,


    vatRate:
      vatRate,


    net:
      parts.net,


    vat:
      parts.vat,


    gross:
      parts.gross

  };


  entries.push(entry);


  entries.sort((a, b) =>
    a.date.localeCompare(b.date)
  );


  saveEntries();


  render();


  /* Valmistellaan seuraava tapahtuma */

  els.entryGross.value = "";

  els.entryDescription.value = "";

}
function filteredEntries() {

  const year =
    els.filterYear.value;


  const month =
    els.filterMonth.value;


  return entries.filter(entry => {

    const okYear =
      !year ||
      entry.date.slice(0, 4) === String(year);


    const okMonth =
      !month ||
      entry.date.slice(5, 7) === String(month);


    return okYear && okMonth;

  });

}




function filterLabel() {

  const year =
    els.filterYear.value;


  const month =
    els.filterMonth.value;


  if (!year && !month) {

    return "Kaikki tapahtumat";

  }


  if (year && month) {

    return `${month}/${year}`;

  }


  if (year) {

    return `Vuosi ${year}`;

  }


  return `Kuukausi ${month}, kaikki vuodet`;

}




function render() {


  const rows =
    filteredEntries();


  els.printedDate.textContent =
    todayText();


  els.filterText.textContent =
    filterLabel();


  els.entriesBody.innerHTML = "";


  let incomeNet = 0;
  let expenseNet = 0;

  let salesVat = 0;
  let purchaseVat = 0;


  const vatMap = {};


  rows.forEach(entry => {


    const tr =
      document.createElement("tr");


    tr.className =
      entry.type === "income"
        ? "entry-income"
        : "entry-expense";


    const typeText =
      entry.type === "income"
        ? "Tulo"
        : "Meno";


    if (entry.type === "income") {

      incomeNet += entry.net;

      salesVat += entry.vat;

    } else {

      expenseNet += entry.net;

      purchaseVat += entry.vat;

    }


    const vatKey =
      String(entry.vatRate);


    if (!vatMap[vatKey]) {

      vatMap[vatKey] = {

        salesNet: 0,
        salesVat: 0,

        purchaseNet: 0,
        purchaseVat: 0

      };

    }


    if (entry.type === "income") {

      vatMap[vatKey].salesNet += entry.net;

      vatMap[vatKey].salesVat += entry.vat;

    } else {

      vatMap[vatKey].purchaseNet += entry.net;

      vatMap[vatKey].purchaseVat += entry.vat;

    }
        tr.innerHTML = `

      <td>
        ${entry.date}
      </td>

      <td>
        ${typeText}
      </td>

      <td>
        ${entry.categoryName || ""}
      </td>

      <td>
        ${entry.description || ""}
        <br>
        <small>
          ${entry.payment || ""}
        </small>
      </td>

      <td>
        ${entry.vatRate}
      </td>

      <td class="money">
        ${formatEuro(entry.net)}
      </td>

      <td class="money">
        ${formatEuro(entry.vat)}
      </td>

      <td class="money">
        ${formatEuro(entry.gross)}
      </td>

      <td class="no-print">

        <button
          data-id="${entry.id}"
          class="deleteBtn">

          Poista

        </button>

      </td>

    `;


    els.entriesBody.appendChild(tr);

  });


  document
    .querySelectorAll(".deleteBtn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const ok = confirm(
          "Poistetaanko tapahtuma?"
        );

        if (!ok) return;


        entries = entries.filter(entry =>
          entry.id !== btn.dataset.id
        );


        saveEntries();


        render();

      });

    });



  els.incomeNet.textContent =
    formatEuro(incomeNet);


  els.expenseNet.textContent =
    formatEuro(expenseNet);


  els.profitNet.textContent =
    formatEuro(
      incomeNet - expenseNet
    );



  els.salesVat.textContent =
    formatEuro(salesVat);


  els.purchaseVat.textContent =
    formatEuro(purchaseVat);


  els.vatPayable.textContent =
    formatEuro(
      salesVat - purchaseVat
    );


  renderVatBreakdown(vatMap);

}

function renderVatBreakdown(vatMap) {

  els.vatBreakdownBody.innerHTML = "";


  Object.keys(vatMap)
    .sort((a, b) => Number(a) - Number(b))
    .forEach(vatRate => {


      const row =
        vatMap[vatRate];


      const tr =
        document.createElement("tr");


      tr.innerHTML = `

        <td>
          ${vatRate}
        </td>

        <td class="money">
          ${formatEuro(row.salesNet)}
        </td>

        <td class="money">
          ${formatEuro(row.salesVat)}
        </td>

        <td class="money">
          ${formatEuro(row.purchaseNet)}
        </td>

        <td class="money">
          ${formatEuro(row.purchaseVat)}
        </td>

      `;


      els.vatBreakdownBody.appendChild(tr);


    });

}




function exportJson() {


  const data = {

    exportedAt:
      new Date().toISOString(),


    app:
      "Raponet Office Book v1.0",


    entries:
      entries

  };


  const blob = new Blob(
    [
      JSON.stringify(data, null, 2)
    ],
    {
      type: "application/json"
    }
  );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");


  link.href = url;


  link.download =
    `raponet-paivakirja-${isoDate(new Date())}.json`;


  link.click();


  URL.revokeObjectURL(url);

}




function importJson(event) {


  const file =
    event.target.files[0];


  if (!file) return;


  const reader =
    new FileReader();


  reader.onload = () => {


    try {


      const data =
        JSON.parse(reader.result);


      const imported =
        Array.isArray(data)
          ? data
          : data.entries;


      if (!Array.isArray(imported)) {

        throw new Error(
          "JSON ei sisällä entries-taulukkoa."
        );

      }


      entries = imported;


      saveEntries();


      render();


      alert(
        "JSON-tuonti onnistui."
      );


    } catch (error) {


      alert(
        "JSON-tuonti epäonnistui: " +
        error.message
      );

    }


  };


  reader.readAsText(file);

}

async function init() {


  await loadCategories();


  loadEntries();


  els.entryDate.value =
    isoDate(new Date());


  els.filterYear.value =
    new Date().getFullYear();


  populateCategories();


  render();



  els.entryType.addEventListener(
    "change",
    populateCategories
  );


  els.entryCategory.addEventListener(
    "change",
    updateVatFromCategory
  );


  els.addEntryBtn.addEventListener(
    "click",
    addEntry
  );


  els.clearEntriesBtn.addEventListener(
    "click",
    clearEntries
  );


  els.exportBtn.addEventListener(
    "click",
    exportJson
  );


  els.importInput.addEventListener(
    "change",
    importJson
  );


  els.printBtn.addEventListener(
    "click",
    () => window.print()
  );


  els.filterYear.addEventListener(
    "input",
    render
  );


  els.filterMonth.addEventListener(
    "change",
    render
  );


}



init();
