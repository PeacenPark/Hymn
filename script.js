
const cableData = {
  CV: {
    "1.5": 18, "2.5": 24, "4": 32, "6": 41, "10": 57, "16": 76, "25": 101
  },
  HFIX: {
    "1.5": 15, "2.5": 21, "4": 28, "6": 36, "10": 50, "16": 68
  }
};

const installFactor = { "공기": 1.0, "관": 0.87, "지중": 0.75 };
const coreFactor = { "1": 1.0, "2": 0.94, "3": 0.9, "4": 0.87 };

function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (tabId === "cable") updateCableOptions();
}

function updateCableOptions() {
  const cableType = document.getElementById("cableType").value;
  const sizeSelect = document.getElementById("cableSize");
  sizeSelect.innerHTML = "";

  Object.keys(cableData[cableType]).forEach(size => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size + " ㎟";
    sizeSelect.appendChild(option);
  });

  updateCableResult();
}

function updateCableResult() {
  const type = document.getElementById("cableType").value;
  const size = document.getElementById("cableSize").value;
  const method = document.getElementById("installMethod").value;
  const cores = document.getElementById("coreCount").value;

  if (!size || !method || !cores) {
    document.getElementById("cableResult").innerText = "모든 항목을 선택해주세요.";
    return;
  }

  const baseCurrent = cableData[type][size];
  const corrected = Math.round(baseCurrent * installFactor[method] * coreFactor[cores] * 10) / 10;

  document.getElementById("cableResult").innerHTML = `
    <strong>기준 허용전류:</strong> ${baseCurrent} A<br>
    <strong>보정 후 허용전류:</strong> ${corrected} A<br>
    <small>계산식: ${baseCurrent} × ${installFactor[method]} × ${coreFactor[cores]} = ${corrected}</small>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCableOptions();
  ["cableSize", "installMethod", "coreCount"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateCableResult);
  });
});


const resistTable = {
  "1.5": 12.1, "2.5": 7.41, "4": 4.61, "6": 3.08, "10": 1.83, "16": 1.15,
  "25": 0.727, "35": 0.524, "50": 0.387, "70": 0.268, "95": 0.193,
  "120": 0.153
};

function updateVdropResult() {
  const I = parseFloat(document.getElementById("vdropCurrent").value);
  const L = parseFloat(document.getElementById("vdropLength").value);
  const Vtype = document.getElementById("vdropVoltageType").value;
  const size = document.getElementById("vdropSize").value;
  const R = resistTable[size];

  if (!I || !L || !Vtype || !size) {
    document.getElementById("vdropResult").innerText = "모든 값을 입력하세요.";
    return;
  }

  const voltage = (Vtype === "단상") ? 220 : 380;
  const factor = (Vtype === "단상") ? 2 : Math.sqrt(3);

  const dropV = (factor * L * I * R) / 1000;
  const percent = (dropV / voltage) * 100;

  document.getElementById("vdropResult").innerHTML = `
    <strong>전압강하:</strong> ${dropV.toFixed(2)} V<br>
    <strong>전압강하율:</strong> ${percent.toFixed(2)} %<br>
    <small>계산식: ${factor} × ${L}m × ${I}A × ${R}Ω/km ÷ 1000 = ${dropV.toFixed(2)}V</small>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  ["vdropCurrent", "vdropLength", "vdropVoltageType", "vdropSize"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateVdropResult);
  });
});


function updateConduitResult() {
  const d = parseFloat(document.getElementById("wireDiameter").value); // mm
  const n = parseInt(document.getElementById("wireCount").value);
  const type = document.getElementById("conduitType").value;
  const inner = parseFloat(document.getElementById("conduitInnerDia").value);

  if (!d || !n || !inner || !type) {
    document.getElementById("conduitResult").innerText = "모든 값을 입력하세요.";
    return;
  }

  const area = Math.PI * Math.pow(d / 2, 2);
  const totalArea = area * n;

  const conduitArea = (type === "TRAY")
    ? inner * 40 // 트레이는 폭 기준, 깊이 40mm 가정
    : Math.PI * Math.pow(inner / 2, 2);

  const fillPercent = (totalArea / conduitArea) * 100;
  const limit = (type === "CD" || type === "PE") ? 40 : (type === "ELP") ? 40 : (type === "STEEL") ? 50 : 50;

  const result = fillPercent <= limit
    ? `<strong style='color:green'>적합</strong>`
    : `<strong style='color:red'>부적합</strong>`;

  document.getElementById("conduitResult").innerHTML = `
    <strong>총 전선 단면적:</strong> ${totalArea.toFixed(2)} mm²<br>
    <strong>관/트레이 유효 면적:</strong> ${conduitArea.toFixed(2)} mm²<br>
    <strong>채움률:</strong> ${fillPercent.toFixed(2)} % (기준 ${limit}%)<br>
    결과: ${result}
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  ["wireDiameter", "wireCount", "conduitInnerDia", "conduitType"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateConduitResult);
  });
});


const breakerSizes = [15, 20, 30, 32, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300];

function updateBreakerResult() {
  const current = parseFloat(document.getElementById("breakerCurrent").value);
  if (!current || current <= 0) {
    document.getElementById("breakerResult").innerText = "보정 후 허용전류를 입력하세요.";
    return;
  }

  const max = Math.floor(current * 1.25);
  const candidates = breakerSizes.filter(size => size >= current && size <= max);

  const result = candidates.length > 0
    ? `<strong>추천 차단기:</strong> ${candidates.join(" / ")} A<br><small>조건: ${current}A 이상, ${max}A 이하 (보정전류 × 125%)</small>`
    : `<span style="color:red">적절한 차단기 없음 – 전선 굵기 또는 조건 재검토 필요</span>`;

  document.getElementById("breakerResult").innerHTML = result;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("breakerCurrent").addEventListener("input", updateBreakerResult);
});


function addLoadInput() {
  const div = document.createElement("div");
  div.className = "load-item";
  const index = document.querySelectorAll(".loadInput").length + 1;
  div.innerHTML = \`
    <label>부하 \${index} (W):
      <input type="number" class="loadInput" placeholder="예: 500" />
    </label>
  \`;
  document.getElementById("loadList").appendChild(div);
  div.querySelector("input").addEventListener("input", updateLoadResult);
}

function updateLoadResult() {
  const loadInputs = document.querySelectorAll(".loadInput");
  const voltageType = document.getElementById("loadVoltageType").value;
  const pf = parseFloat(document.getElementById("loadPowerFactor").value);
  const voltage = voltageType === "단상" ? 220 : 380;

  let totalWatt = 0;
  loadInputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) totalWatt += val;
  });

  if (totalWatt === 0 || !pf || !voltage) {
    document.getElementById("loadResult").innerText = "모든 값을 입력하세요.";
    return;
  }

  let current;
  if (voltageType === "단상") {
    current = totalWatt / (voltage * pf);
  } else {
    current = totalWatt / (Math.sqrt(3) * voltage * pf);
  }

  document.getElementById("loadResult").innerHTML = \`
    <strong>총 부하:</strong> \${totalWatt} W<br>
    <strong>전원:</strong> \${voltageType} (\${voltage}V)<br>
    <strong>역률:</strong> \${pf}<br>
    <strong>예상 전류:</strong> \${current.toFixed(2)} A
  \`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".loadInput").forEach(input =>
    input.addEventListener("input", updateLoadResult)
  );
  document.getElementById("loadVoltageType").addEventListener("change", updateLoadResult);
  document.getElementById("loadPowerFactor").addEventListener("input", updateLoadResult);
});


function updateGroundResult() {
  const size = parseFloat(document.getElementById("mainCableSize").value);
  let ground;

  if (size <= 16) ground = size;
  else if (size <= 35) ground = 16;
  else ground = size / 2;

  const standard = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400];
  const recommended = standard.find(s => s >= ground);

  document.getElementById("groundResult").innerHTML = `
    <strong>주 전선 굵기:</strong> ${size} ㎟<br>
    <strong>접지선 최소 굵기:</strong> ${recommended} ㎟<br>
    <small>※ 기준: 16㎟ 이하 동일, 16~35㎟는 16㎟, 35㎟ 초과는 1/2</small>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const groundSelect = document.getElementById("mainCableSize");
  groundSelect.addEventListener("change", updateGroundResult);
  updateGroundResult();
});


function updateShortResult() {
  const kva = parseFloat(document.getElementById("xfmrKVA").value);
  const volt = parseFloat(document.getElementById("xfmrVolt").value);
  const z = parseFloat(document.getElementById("xfmrZ").value);

  if (!kva || !volt || !z) {
    document.getElementById("shortResult").innerText = "모든 값을 입력하세요.";
    return;
  }

  const baseCurrent = kva * 1000 / (Math.sqrt(3) * volt); // 정상전류
  const shortCurrent = baseCurrent * 100 / z;

  document.getElementById("shortResult").innerHTML = `
    <strong>정상전류:</strong> ${baseCurrent.toFixed(1)} A<br>
    <strong>예상 단락전류:</strong> ${shortCurrent.toFixed(1)} A<br>
    <small>공식: (${kva} × 1000) / (√3 × ${volt}) × (100 / ${z})</small>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  ["xfmrKVA", "xfmrVolt", "xfmrZ"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateShortResult);
  });
});


function updateLuxResult() {
  const area = parseFloat(document.getElementById("roomArea").value);
  const lux = parseFloat(document.getElementById("targetLux").value);
  const lumen = parseFloat(document.getElementById("lampLumen").value);
  const cu = parseFloat(document.getElementById("cuFactor").value);

  if (!area || !lux || !lumen || !cu) {
    document.getElementById("luxResult").innerText = "모든 값을 입력하세요.";
    return;
  }

  const requiredLumen = area * lux;
  const numLamps = Math.ceil(requiredLumen / (lumen * cu));

  document.getElementById("luxResult").innerHTML = `
    <strong>총 필요 광속:</strong> ${requiredLumen.toFixed(1)} lm<br>
    <strong>필요 조명 수:</strong> ${numLamps} 개<br>
    <small>계산식: (${area}㎡ × ${lux}lux) ÷ (${lumen}lm × ${cu})</small>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  ["roomArea", "targetLux", "lampLumen", "cuFactor"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateLuxResult);
  });
});


function convertUnit() {
  const type = document.getElementById("convertType").value;
  const input = parseFloat(document.getElementById("convertInput").value);
  if (isNaN(input)) {
    document.getElementById("unitResult").innerText = "숫자를 입력하세요.";
    return;
  }

  let result = "";
  switch (type) {
    case "length":
      result = `${input} m = ${(input * 3.28084).toFixed(2)} ft<br>
                ${input} ft = ${(input / 3.28084).toFixed(2)} m`;
      break;
    case "area":
      result = `${input} ㎡ = ${(input * 0.3025).toFixed(2)} 평<br>
                ${input} 평 = ${(input / 0.3025).toFixed(2)} ㎡`;
      break;
    case "power":
      result = `${input} kW = ${(input * 1.341).toFixed(2)} HP<br>
                ${input} HP = ${(input / 1.341).toFixed(2)} kW`;
      break;
    case "current":
      result = `${input} A = ${(input * 1000).toFixed(0)} mA<br>
                ${input} mA = ${(input / 1000).toFixed(3)} A`;
      break;
  }

  document.getElementById("unitResult").innerHTML = `<strong>변환 결과:</strong><br>${result}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("convertType").addEventListener("change", () => {
    document.getElementById("convertInput").value = "";
    document.getElementById("unitResult").innerHTML = "";
  });
});
