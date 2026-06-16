let products = [];

const els = {
  itemsBody: document.getElementById("itemsBody"),
  rowTemplate: document.getElementById("rowTemplate"),

  addRowBtn: document.getElementById("addRowBtn"),
  printBtn: document.getElementById("printBtn"),
  clearBtn: document.getElementById("clearBtn"),
  reserveNumberBtn: document.getElementById("reserveNumberBtn"),
  resetCounterBtn: document.getElementById("resetCounterBtn"),

  invoiceNumber: document.getElementById("invoiceNumber"),
  referenceNumber: document.getElementById("referenceNumber"),

  invoiceDate: document.getElementById("invoiceDate"),
  dueDate: document.getElementById("dueDate"),

  referenceText: document.getElementById("referenceText"),
  dueDateText: document.getElementById("dueDateText"),

  netTotal: document.getElementById("netTotal"),
  vatTotal: document.getElementById("vatTotal"),
  grossTotal: document.getElementById("grossTotal")
};


function formatEuro(value) {
  return new Intl.NumberFormat("fi-FI", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}


function isoDate(date) {
  return date.toISOString().slice(0, 10);
}


function addDays(date, days) {
  const copy = new Date(date);

  copy.setDate(
    copy.getDate() + days
  );

  return copy;
}

function finnishReferenceNumber(base) {

  const clean = String(base)
    .replace(/\D/g, "");

  if (!clean) return "";

  const weights = [7, 3, 1];

  const digits = clean
    .split("")
    .reverse();

  const sum = digits.reduce((total, digit, index) => {

    return total +
      Number(digit) *
      weights[index % 3];

  }, 0);


  const checkDigit =
    (10 - (sum % 10)) % 10;

  return clean + String(checkDigit);
}



function reserveInvoiceNumber() {

  if (els.invoiceNumber.value) {

    const ok = confirm(
      "Laskunumero on jo varattu tälle laskulle. Haluatko varmasti varata uuden numeron?"
    );

    if (!ok) return;
  }


  const year = new Date().getFullYear();

  const key =
    `raponet_last_invoice_${year}`;


  const last = Number(
    localStorage.getItem(key) || 0
  );


  const next = last + 1;


  localStorage.setItem(
    key,
    String(next)
  );


  const invoiceNumber =
    `${year}-${String(next).padStart(3, "0")}`;


  const referenceBase =
    invoiceNumber.replace(/\D/g, "");


  const referenceNumber =
    finnishReferenceNumber(referenceBase);


  els.invoiceNumber.value =
    invoiceNumber;


  els.referenceNumber.value =
    referenceNumber;


  els.referenceText.textContent =
    referenceNumber;
}
function resetCounter() {

  const year = new Date().getFullYear();

  const key =
    `raponet_last_invoice_${year}`;


  const current = Number(
    localStorage.getItem(key) || 0
  );


  const value = prompt(
    `Nykyinen viimeisin laskunumero vuodelle ${year} on ${current}.\nAnna uusi viimeisin juokseva numero:`,
    String(current)
  );


  if (value === null) return;


  const parsed = Number(value);


  if (!Number.isInteger(parsed) || parsed < 0) {

    alert(
      "Anna kokonaisluku 0 tai suurempi."
    );

    return;
  }


  localStorage.setItem(
    key,
    String(parsed)
  );


  alert(
    `Laskuri päivitetty. Seuraava lasku on ${year}-${String(parsed + 1).padStart(3, "0")}.`
  );
}




async function loadProducts() {

  try {

    const response =
      await fetch("products.json");


    products =
      await response.json();


  } catch (error) {

    console.warn(
      "Tuotteita ei voitu ladata. Käytetään tyhjää listaa.",
      error
    );

    products = [];
  }
}




function populateProductSelect(select) {


  products.forEach((product, index) => {

    const option =
      document.createElement("option");


    option.value =
      String(index);


    option.textContent =
      product.name;


    select.appendChild(option);

  });

}
function addRow() {

  const row =
    els.rowTemplate.content
      .firstElementChild
      .cloneNode(true);


  const select =
    row.querySelector(".productSelect");


  populateProductSelect(select);


  select.addEventListener("change", () => {

    const product =
      products[Number(select.value)];


    if (!product) return;


    row.querySelector(".description").value =
      product.description || product.name || "";


    row.querySelector(".unitPrice").value =
      product.price ?? 0;


    row.querySelector(".vatRate").value =
      product.vat ?? 25.5;


    calculateTotals();

  });


  row.querySelectorAll(
    "input, textarea"
  ).forEach(input => {

    input.addEventListener(
      "input",
      calculateTotals
    );

  });


  row.querySelector(
    ".removeRowBtn"
  ).addEventListener("click", () => {

    row.remove();

    calculateTotals();

  });


  els.itemsBody.appendChild(row);


  calculateTotals();

}

function calculateTotals() {

  let netTotal = 0;
  let vatTotal = 0;


  els.itemsBody
    .querySelectorAll("tr")
    .forEach(row => {

      const quantity = Number(
        row.querySelector(".quantity").value || 0
      );

      const unitPrice = Number(
        row.querySelector(".unitPrice").value || 0
      );

      const vatRate = Number(
        row.querySelector(".vatRate").value || 0
      );


      const net =
        quantity * unitPrice;


      const vat =
        net * vatRate / 100;


      netTotal += net;
      vatTotal += vat;


      row.querySelector(".lineNet")
        .textContent = formatEuro(net);

    });


  els.netTotal.textContent =
    formatEuro(netTotal);


  els.vatTotal.textContent =
    formatEuro(vatTotal);


  els.grossTotal.textContent =
    formatEuro(netTotal + vatTotal);


  els.referenceText.textContent =
    els.referenceNumber.value || "";


  els.dueDateText.textContent =
    els.dueDate.value || "";

}

function clearForm() {

  const ok = confirm(
    "Tyhjennetäänkö lomake? Tämä ei pienennä varattua laskunumeroa."
  );

  if (!ok) return;


  document
    .querySelectorAll("input:not([readonly]), textarea")
    .forEach(input => {

      if (input.type === "date") return;

      input.value = "";

    });


  els.itemsBody.innerHTML = "";


  addRow();


  const today = new Date();

  els.invoiceDate.value =
    isoDate(today);


  els.dueDate.value =
    isoDate(addDays(today, 14));


  calculateTotals();

}



function setDefaultDates() {

  const today = new Date();


  els.invoiceDate.value =
    isoDate(today);


  els.dueDate.value =
    isoDate(addDays(today, 14));


  calculateTotals();

}



async function init() {


  await loadProducts();


  setDefaultDates();


  addRow();



  els.addRowBtn
    .addEventListener(
      "click",
      addRow
    );


  els.printBtn
    .addEventListener(
      "click",
      () => window.print()
    );


  els.clearBtn
    .addEventListener(
      "click",
      clearForm
    );


  els.reserveNumberBtn
    .addEventListener(
      "click",
      reserveInvoiceNumber
    );


  els.resetCounterBtn
    .addEventListener(
      "click",
      resetCounter
    );


  els.dueDate
    .addEventListener(
      "input",
      calculateTotals
    );


  els.referenceNumber
    .addEventListener(
      "input",
      calculateTotals
    );

}


init();
