const socket = io();

function sendAMCP() {
    const cmd = document.getElementById('amcpInput').value;
    socket.emit('amcp', cmd);
}

function sendOsc() {
  socket.emit('send-osc', {
    address: '/example',
    args: [
      { type: 'f', value: 1.0 }
    ]
  });
}

function loadTemplates() {
  return new Promise((resolve) => {
    socket.emit("amcp", "TLS");
    socket.once("amcp-response", (data) => {
      if (data.command === "TLS") {
        const rawTemplates = data.response || "";
        const templates = rawTemplates
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/^(Templates:|200 TLS OK)$/));

        updateTemplateList(templates);
        resolve(templates);
      } else {
        resolve(null);
      }
    });
  });
}

// Bruk slik:
loadTemplates().then(response => {
  console.log("Templates:", response);
});

// Når svaret kommer retur
socket.on("amcp-response", (data) => {
  if (data && data.command && data.response) {
    const responseLine = data.response.trim().split('\n')[0];
    updateStatus(`${data.command} → ${responseLine}`);
  } else {
    updateStatus("Ukendt svar fra CasparCG", true);
  }
});


// Opdater statusfeltet
function updateStatus(msg, isError = false) {
  const el = document.getElementById("status");
  el.textContent = `Status: ${msg}`;
  el.style.color = isError ? "red" : "inherit";
}



function formatTemplateName(name) {
  const maxLength = 33;
  return name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name;
}

function updateTemplateList(templates) {
  console.log("Opdeterer templateList med:", templates);
  const select = document.getElementById("templateList");
  select.innerHTML = ""; // ryd tidligere indhold

  templates.forEach(template => {
    const option = document.createElement("option");
    option.value = template;
    option.textContent = formatTemplateName(template);
    select.appendChild(option);    
  });
}

document.getElementById("refreshTemplatesBtn").addEventListener("click", () => {
  console.log("Templates opdateres...");
  // Erstat med din faktiske funktion, fx:
  loadTemplates();
});

window.addEventListener("load", () => {
  loadTemplates();
});

function addKeyValueRow() {
  const container = document.getElementById("data-rows");

  const currentCount = container.querySelectorAll(".data-row").length;

  const row = document.createElement("div");
  row.className = "data-row";

  row.innerHTML = `
    <input type="text" value="f${currentCount}" />
    <input type="text" placeholder="Value" />
    <button class="deleteBtn" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(row);
}

// Opret en linje i sekvenslisten
function addSequenceRow() {
  const container = document.getElementById("sequence-rows");

  // Hent template navn
  const templateSelect = document.getElementById("templateList")
  const selectedTemplate = templateSelect.options[templateSelect.selectedIndex]?.text || "";

  // Hent valgt channel og layer
  const chSelect = document.getElementById("channelList");
  const layerSelect = document.getElementById("layerList");
  const selectedCh = chSelect.value;
  const slectedLayer = layerSelect.value;
  const chLayer = `${selectedCh}-${slectedLayer}`

  // Hent alle key og value par fra data-rows
  const dataRows = document.querySelectorAll("#data-rows .data-row");
  const keyValueObject = {};
  const valueList = [];

  dataRows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const key = inputs[0]?.value.trim();
    const value = inputs[1]?.value.trim();

    if (key && value) {
      keyValueObject[key] = value;
      valueList.push(value);
    }
  });

  // Formater data til visning og lagring
  const dataDisplay = valueList.join(" | ");
  const dataJson = JSON.stringify(keyValueObject);

  const row = document.createElement("div");
  row.className = "sequence-row";

  row.innerHTML = `
    <input type="text" name="template" value="${selectedTemplate}" />
    <input type="text" name="ch" value="${chLayer}" />
    <input type="text" name="data" value="${dataDisplay}" data-json='${dataJson}' />
    <button class="deleteBtn" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(row);
}

let activeSequenceRow = null;

document.addEventListener("focusin", (e) => {
  const row = e.target.closest(".sequence-row");
  if (row) {
    document.querySelectorAll(".sequence-row").forEach(r => r.classList.remove("active"));
    row.classList.add("active");
    activeSequenceRow = row;
  }
});

function playActiveTemplate() {
  if (!activeSequenceRow) {
    alert("Vælg en række i sekvensen først.");
    return;
  }

  const template = activeSequenceRow.querySelector('input[name="template"]').value;
  const chLayer = activeSequenceRow.querySelector('input[name="ch"]').value;
  const dataInput = activeSequenceRow.querySelector('input[name="data"]');

  if (!template || !chLayer || !dataInput || !dataInput.dataset.json) {
    alert("Mangler data i rækken.");
    return;
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(dataInput.dataset.json);
  } catch (err) {
    alert("Ugyldig JSON i data-feltet.");
    return;
  }

  // Escape JSON dobbelt til AMCP-format
  const escapedJson = JSON.stringify(parsedJson).replace(/"/g, '\\"');

  const cmd = `CG ${chLayer} ADD 1 "${template}" 1 "${escapedJson}"\r\n`;
  console.log("Sender kommando:", cmd);

  // Hvis du har en socket-forbindelse:
  socket.emit("amcp", cmd);
}



function stopActiveTemplate() {
  if (!activeSequenceRow) {
    alert("Vælg en række i sekvensen først.");
    return;
  }

  const chLayer = activeSequenceRow.querySelector('input[name="ch"]').value;

  if (!chLayer) {
    alert("Mangler channel/layer information.");
    return;
  }

  const cmd = `CG ${chLayer} STOP 1\r\n`;
  console.log("Sender stop-kommando:", cmd);

  socket.emit("amcp", cmd);
}

function playNextTemplate() {
  const allRows = Array.from(document.querySelectorAll(".sequence-row"));

  if (!activeSequenceRow) {
    alert("Vælg først en række i sekvensen.");
    return;
  }

  const currentIndex = allRows.indexOf(activeSequenceRow);

  if (currentIndex === -1 || currentIndex + 1 >= allRows.length) {
    alert("Ingen flere rækker.");
    return;
  }

  const nextRow = allRows[currentIndex + 1];

  // Opdater aktiv række
  document.querySelectorAll(".sequence-row").forEach(r => r.classList.remove("active"));
  nextRow.classList.add("active");
  activeSequenceRow = nextRow;
}


socket.on('casparcg-status', (data) => {
  const statusDiv = document.getElementById('status');
  if (data.connected) {
    statusDiv.textContent = '✅ Forbundet til CasparCG';
    statusDiv.style.color = 'green';
  } else {
    statusDiv.textContent = '❌ Ikke forbundet til CasparCG';
    statusDiv.style.color = 'red';
  }
});