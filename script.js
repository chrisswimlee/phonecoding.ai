const phone = document.querySelector("#phone");
const screen = document.querySelector("#screen");
const note = document.querySelector("#demo-note");
const beats = document.querySelectorAll("[data-step]");
const scenarioButtons = document.querySelectorAll("[data-scenario]");
const phoneModeButtons = document.querySelectorAll("[data-phone-mode]");
const beatTriggers = document.querySelectorAll("[data-jump]");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SCENARIOS = {
  actor: {
    kicker: "phonecoding-ios · feat/voice",
    voiceTag: "Voice prompt · 0:05",
    prompt: "Add jittered backoff to the voice reconnect and keep the audio buffer thread-safe.",
    steps: [
      ["Read", "VoiceStreamActor.swift"],
      ["Edit", "reconnectWithBackoff()"],
      ["Test", "42/42 passing (1.8s)"],
    ],
    diffFile: "VoiceStreamActor.swift",
    diffStat: "+6 −2",
    diffLines: [
      ["del", "- func reconnect()"],
      ["add", "+ func reconnectWithBackoff()"],
      ["add", "+ let delay = min(backoff, 16)"],
    ],
    phoneLesson: {
      kicker: "From VoiceStreamActor.swift",
      title: "Why recheck state after await?",
      question:
        "Two tasks call reconnectWithBackoff() while Task.sleep is suspended. What happens without a guard?",
      choices: [
        {
          label: "Both tasks resume and open duplicate sockets",
          correct: true,
          reply:
            "Right. Actors serialize access, but await suspends the method and lets another caller enter before openSocketStream() runs.",
        },
        {
          label: "The actor locks the thread until sleep finishes",
          correct: false,
          reply:
            "Not in Swift actors. Await is a suspension point, so another caller can interleave while the first sleeps.",
        },
      ],
    },
    sheet: {
      file: "Services/VoiceStreamActor.swift",
      add: "+19",
      del: "−5",
      summary:
        "Isolate WebSocket audio buffering inside an actor, and retry with jitter so a cellular handoff does not stampede the socket.",
      code: [
        ["ctx", "actor VoiceStreamActor {"],
        ["del", "-   var retryCount = 0"],
        ["del", "-   func reconnect() {"],
        ["add", "+   var attempt = 0"],
        ["add", "+   var frameBuffer: [Data] = []"],
        ["add", "+   func reconnectWithBackoff() {"],
        ["add", "+       let delay = min(backoff, 16)"],
        ["ctx", "        try await openSocketStream()"],
        ["ctx", "    }"],
      ],
    },
    lab: {
      kicker: "From Services/VoiceStreamActor.swift",
      title: "Actor re-entrancy & backoff",
      locate: {
        prompt:
          "Tap the line where a second caller can sneak in before the socket finishes connecting:",
        lines: [
          "actor VoiceStreamActor {",
          "  var isConnected = false",
          "  func connect() async throws {",
          "    guard !isConnected else { return }",
          "    try await Task.sleep(for: .seconds(1))",
          "    try await openSocketStream()",
          "    isConnected = true",
          "  }",
        ],
        correctIndex: 4,
        correctWhy:
          "Line 5 suspends at await while isConnected is still false. A second caller passes line 4 before line 7 ever runs.",
        wrongWhy:
          "Look for the first await after the guard—that suspension point lets a second caller enter while isConnected is still false.",
      },
      patch: {
        prompt:
          "Tap the token that deduplicates concurrent callers before the first await:",
        before: [
          "actor VoiceStreamActor {",
          "  private var inFlight: Task<Void, Error>?",
          "  func ensureConnected() async throws {",
        ],
        slotLinePrefix: "    if let task = ",
        slotLineSuffix: " { return try await task.value }",
        after: [
          "    let task = Task { try await openSocketStream() }",
          "    inFlight = task",
          "  }",
        ],
        choices: ["inFlight", "DispatchQueue.main", "nonisolated"],
        correctChoice: "inFlight",
        explanation:
          "Storing the in-flight Task synchronously before awaiting lets any second caller await the same connection attempt instead of opening a second socket.",
      },
      why: {
        prompt:
          "Socratic check: why did we also add 0–350ms of random jitter to the backoff delay?",
        choices: [
          {
            label: "So dropped clients don't all reconnect on the exact same second",
            correct: true,
            explanation:
              "Takeaway: exponential backoff spreads retries over time; jitter spreads them across clients after a shared outage.",
          },
          {
            label: "Because Swift Task.sleep requires a random Double",
            correct: false,
            explanation:
              "Task.sleep accepts any duration. Jitter is there to prevent synchronized retry spikes against the server.",
          },
          {
            label: "To make actor isolation run on the main thread",
            correct: false,
            explanation:
              "Jitter only changes retry timing; actor isolation is handled by the actor's serial executor.",
          },
        ],
      },
    },
  },
  font: {
    kicker: "phonecoding-ios · feat/a11y-diff",
    voiceTag: "Voice prompt · 0:04",
    prompt: "Make the diff file header scale with Dynamic Type while keeping a monospaced font.",
    steps: [
      ["Read", "ThumbDiffCard.swift"],
      ["Edit", "font(.system(.subheadline, design: .monospaced))"],
      ["Test", "Accessibility audit passed"],
    ],
    diffFile: "ThumbDiffCard.swift",
    diffStat: "+4 −1",
    diffLines: [
      ["del", "- .font(.system(size: 13))"],
      ["add", "+ .font(.system(.subheadline,"],
      ["add", "+   design: .monospaced))"],
    ],
    phoneLesson: {
      kicker: "From ThumbDiffCard.swift",
      title: "Why avoid fixed font sizes in code views?",
      question:
        "What happens to .font(.system(size: 13)) when a user sets Larger Accessibility Text in iOS Settings?",
      choices: [
        {
          label: "It stays locked at 13pt and ignores Dynamic Type",
          correct: true,
          reply:
            "Exactly. Semantic styles like .subheadline with .design(.monospaced) keep code aligned while scaling with the reader's text size.",
        },
        {
          label: "SwiftUI automatically converts 13pt to Dynamic Type",
          correct: false,
          reply:
            "Fixed point sizes opt out of automatic scaling unless paired with @ScaledMetric or replaced with a semantic text style.",
        },
      ],
    },
    sheet: {
      file: "Views/Studio/ThumbDiffCard.swift",
      add: "+14",
      del: "−3",
      summary:
        "Replace fixed 13pt code labels with semantic monospaced Dynamic Type and an explicit accessibility label.",
      code: [
        ["ctx", "HStack(spacing: 12) {"],
        ["del", "-   Text(diff.filePath).font(.system(size: 13))"],
        ["add", "+   Text(diff.filePath)"],
        ["add", "+       .font(.system(.subheadline, design: .monospaced))"],
        ["add", "+       .accessibilityLabel(\"Modified file \\(diff.filePath)\")"],
        ["ctx", "}"],
      ],
    },
    lab: {
      kicker: "From Views/Studio/ThumbDiffCard.swift",
      title: "Dynamic Type for monospaced code",
      locate: {
        prompt:
          "Tap the line that prevents the file path from scaling when the user increases iOS text size:",
        lines: [
          "HStack(spacing: 12) {",
          "  Image(systemName: diff.status.icon)",
          "  Text(diff.filePath)",
          "    .font(.system(size: 13))",
          "    .lineLimit(1)",
          "}",
        ],
        correctIndex: 3,
        correctWhy:
          "Line 4 hardcodes 13pt, so iOS Dynamic Type cannot scale the file path on a small screen.",
        wrongWhy:
          "Find the modifier that hardcodes a fixed point size instead of a semantic text style.",
      },
      patch: {
        prompt:
          "Tap the token that keeps the font monospaced while scaling with Dynamic Type:",
        before: ["Text(diff.filePath)"],
        slotLinePrefix: "  .font(",
        slotLineSuffix: ")",
        after: ["  .foregroundStyle(.primary)"],
        choices: [
          ".system(.subheadline, design: .monospaced)",
          ".system(size: 13, weight: .medium)",
          ".custom(\"Menlo\", fixedSize: 13)",
        ],
        correctChoice: ".system(.subheadline, design: .monospaced)",
        explanation:
          "Pairing a semantic style (.subheadline) with design: .monospaced gives you aligned code characters that still respect user accessibility settings.",
      },
      why: {
        prompt:
          "Socratic check: why do diff lines also show explicit + and − prefixes instead of green and red backgrounds alone?",
        choices: [
          {
            label: "So color-blind readers and VoiceOver can distinguish additions from deletions",
            correct: true,
            explanation:
              "Takeaway: color is a reinforcement, never the sole carrier of meaning in a mobile diff.",
          },
          {
            label: "Because SwiftUI cannot render background colors inside ScrollView",
            correct: false,
            explanation:
              "SwiftUI renders background tints fine—the prefix symbols are there for accessibility and scannability.",
          },
          {
            label: "To make the file compile faster",
            correct: false,
            explanation:
              "Prefix glyphs are purely for human clarity and accessibility.",
          },
        ],
      },
    },
  },
};

let activeScenarioKey = "actor";
let runToken = 0;

const hunkStatuses = {
  actor: "Pending review",
  font: "Pending review",
};

let activeDrill = "locate";
const solvedDrills = {
  actor: { locate: false, patch: false, why: false },
  font: { locate: false, patch: false, why: false },
};

function setBeat(name) {
  beats.forEach((beat) => {
    beat.classList.toggle("is-current", beat.dataset.step === name);
  });
}

function setPhoneModeUI(mode) {
  phone.dataset.mode = mode;
  phoneModeButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.phoneMode === mode);
  });
}

function pinLatest() {
  screen.scrollTop = screen.scrollHeight;
}

function wait(ms) {
  if (reducedMotion) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toolRow(name, detail) {
  const row = document.createElement("div");
  row.className = "tool";
  row.innerHTML = `<b>${name}</b><span>${detail}</span>`;
  return row;
}

function buildDiffCardMarkup(scenario) {
  const lines = scenario.diffLines
    .map(([kind, text]) => `<span class="${kind}">${text}</span>`)
    .join("\n");
  return `
    <article class="diff-card">
      <header>
        <span>${scenario.diffFile}</span>
        <span>${scenario.diffStat}</span>
      </header>
      <pre><code>${lines}</code></pre>
      <div class="diff-actions">
        <button type="button" id="approve">Approve</button>
        <button type="button" class="ghost" id="explain">Explain</button>
      </div>
    </article>
  `;
}

function renderPhoneIdle() {
  runToken += 1;
  const scenario = SCENARIOS[activeScenarioKey];
  phone.dataset.state = "idle";
  setPhoneModeUI("studio");
  setBeat("send");

  screen.innerHTML = `
    <p class="screen-kicker">${scenario.kicker}</p>
    <article class="prompt-card">
      <span class="voice-tag">${scenario.voiceTag}</span>
      <p>${scenario.prompt}</p>
      <button type="button" class="phone-cta" id="send">Send task</button>
    </article>
    <p class="screen-hint">Interactive walkthrough · no model calls</p>
  `;

  note.innerHTML =
    'Tap <strong>Send task</strong> inside the phone, or switch it to <strong>Learn</strong>.';

  screen.querySelector("#send").addEventListener("click", () => {
    runPhoneStudioDemo();
  });
}

function attachDiffCardHandlers(scenario) {
  const approveBtn = screen.querySelector("#approve");
  const explainBtn = screen.querySelector("#explain");

  if (approveBtn) {
    approveBtn.addEventListener("click", () => {
      approveBtn.textContent = "Approved ✓";
      approveBtn.disabled = true;
      hunkStatuses[activeScenarioKey] = "Approved ✓";
      renderDiffSheet();
      note.innerHTML =
        'Hunk approved. Tap <strong>Explain</strong> to study it, or <button type="button" class="inline-reset" id="reset-demo">reset phone</button>.';
      bindResetButton();
    });
  }

  if (explainBtn) {
    explainBtn.addEventListener("click", () => {
      renderPhoneLearnCard(scenario);
    });
  }
}

function bindResetButton() {
  const btn = note.querySelector("#reset-demo");
  if (btn) {
    btn.addEventListener("click", () => {
      renderPhoneIdle();
    });
  }
}

async function runPhoneStudioDemo(stopAtBeat = "review") {
  const myToken = ++runToken;
  const scenario = SCENARIOS[activeScenarioKey];
  setPhoneModeUI("studio");
  phone.dataset.state = "working";
  setBeat("send");

  screen.innerHTML = `
    <p class="screen-kicker">${scenario.kicker}</p>
    <article class="bubble user">
      <span class="voice-tag">${scenario.voiceTag}</span>
      <p>${scenario.prompt}</p>
    </article>
  `;

  if (stopAtBeat === "send") {
    note.innerHTML =
      'Beat 01: prompt dispatched. <button type="button" class="inline-reset" id="reset-demo">Reset</button>';
    bindResetButton();
    return;
  }

  await wait(240);
  if (myToken !== runToken) return;

  setBeat("work");
  for (const [name, detail] of scenario.steps) {
    screen.append(toolRow(name, detail));
    pinLatest();
    if (stopAtBeat !== "work") {
      await wait(340);
      if (myToken !== runToken) return;
    }
  }

  if (stopAtBeat === "work") {
    note.innerHTML =
      'Beat 02: inspectable tool steps. <button type="button" class="inline-reset" id="reset-demo">Reset</button>';
    bindResetButton();
    return;
  }

  setBeat("review");
  screen.insertAdjacentHTML("beforeend", buildDiffCardMarkup(scenario));
  pinLatest();
  note.innerHTML =
    'Beat 03: approve the hunk, or tap <strong>Explain</strong> to turn it into a lesson.';
  attachDiffCardHandlers(scenario);
}

function renderPhoneLearnCard(scenario = SCENARIOS[activeScenarioKey]) {
  runToken += 1;
  setPhoneModeUI("learn");
  phone.dataset.state = "lesson";
  const lesson = scenario.phoneLesson;

  const existingLesson = screen.querySelector(".lesson-card");
  if (existingLesson) existingLesson.remove();

  if (!screen.querySelector(".diff-card")) {
    screen.innerHTML = `
      <p class="screen-kicker">${scenario.kicker}</p>
      ${buildDiffCardMarkup(scenario)}
    `;
    attachDiffCardHandlers(scenario);
  }

  const card = document.createElement("article");
  card.className = "lesson-card";
  card.innerHTML = `
    <p class="lesson-kicker">${lesson.kicker}</p>
    <h3>${lesson.title}</h3>
    <p>${lesson.question}</p>
    <div class="quiz-choices">
      ${lesson.choices
        .map(
          (c, idx) =>
            `<button type="button" class="quiz-choice" data-choice="${idx}">${c.label}</button>`
        )
        .join("")}
    </div>
    <p class="quiz-feedback" id="phone-quiz-feedback" hidden></p>
  `;

  screen.append(card);
  pinLatest();
  note.innerHTML =
    'Tap an answer inside the phone, or <button type="button" class="inline-reset" id="reset-demo">reset phone</button>.';
  bindResetButton();

  const choiceButtons = card.querySelectorAll(".quiz-choice");
  const feedback = card.querySelector("#phone-quiz-feedback");

  choiceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.choice);
      const picked = lesson.choices[idx];
      choiceButtons.forEach((b) => {
        b.classList.remove("is-correct", "is-wrong");
      });
      btn.classList.add(picked.correct ? "is-correct" : "is-wrong");
      feedback.hidden = false;
      feedback.textContent = picked.reply;
      pinLatest();
    });
  });
}

/* Diff Review Sheet */
const diffTabs = document.querySelectorAll("[data-hunk]");
const sheetFile = document.querySelector("#sheet-file");
const sheetAdd = document.querySelector("#sheet-add");
const sheetDel = document.querySelector("#sheet-del");
const sheetBadge = document.querySelector("#sheet-badge");
const sheetSummary = document.querySelector("#sheet-summary");
const sheetCode = document.querySelector("#sheet-code");
const sheetApprove = document.querySelector("#sheet-approve");
const sheetFlag = document.querySelector("#sheet-flag");

function renderDiffSheet() {
  const scenario = SCENARIOS[activeScenarioKey];
  const s = scenario.sheet;

  diffTabs.forEach((tab) => {
    const active = tab.dataset.hunk === activeScenarioKey;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  sheetFile.textContent = s.file;
  sheetAdd.textContent = s.add;
  sheetDel.textContent = s.del;
  sheetSummary.textContent = s.summary;

  const status = hunkStatuses[activeScenarioKey];
  sheetBadge.textContent = status;
  sheetBadge.className = "sheet-badge";
  if (status.startsWith("Approved")) {
    sheetBadge.classList.add("is-approved");
  } else if (status.startsWith("Change")) {
    sheetBadge.classList.add("is-flagged");
  }

  sheetCode.innerHTML = `<code>${s.code
    .map(([kind, line]) => `<span class="${kind}">${line}</span>`)
    .join("\n")}</code>`;
}

sheetApprove.addEventListener("click", () => {
  hunkStatuses[activeScenarioKey] = "Approved ✓";
  renderDiffSheet();
});

sheetFlag.addEventListener("click", () => {
  hunkStatuses[activeScenarioKey] = "Change requested";
  renderDiffSheet();
});

diffTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectScenario(tab.dataset.hunk);
  });
});

/* Interactive Mobile Lesson Lab */
const labKicker = document.querySelector("#lab-kicker");
const labTitle = document.querySelector("#lab-title");
const labProgress = document.querySelector("#lab-progress");
const labTabs = document.querySelectorAll("[data-drill]");
const labStage = document.querySelector("#lab-stage");

function updateLabHeader() {
  const lab = SCENARIOS[activeScenarioKey].lab;
  const solvedMap = solvedDrills[activeScenarioKey];
  const solvedCount = Object.values(solvedMap).filter(Boolean).length;

  labKicker.textContent = lab.kicker;
  labTitle.textContent = lab.title;
  labProgress.textContent = `${solvedCount} / 3 solved`;

  labTabs.forEach((tab) => {
    const drill = tab.dataset.drill;
    const isActive = drill === activeDrill;
    tab.classList.toggle("is-active", isActive);
    tab.classList.toggle("is-done", Boolean(solvedMap[drill]));
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderLabLocate(lab) {
  const d = lab.locate;
  labStage.innerHTML = `
    <p class="lab-prompt">${d.prompt}</p>
    <div class="code-lines" role="group" aria-label="Tappable code lines">
      ${d.lines
        .map(
          (line, idx) => `
          <button type="button" class="code-line-btn" data-line="${idx}">
            <span class="ln">${idx + 1}</span>
            <span>${line.replace(/</g, "&lt;")}</span>
          </button>`
        )
        .join("")}
    </div>
    <div class="lab-feedback" id="lab-feedback" hidden></div>
  `;

  const buttons = labStage.querySelectorAll(".code-line-btn");
  const feedback = labStage.querySelector("#lab-feedback");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.line);
      const isRight = idx === d.correctIndex;
      buttons.forEach((b) => b.classList.remove("is-correct", "is-wrong"));
      btn.classList.add(isRight ? "is-correct" : "is-wrong");

      feedback.hidden = false;
      if (isRight) {
        solvedDrills[activeScenarioKey].locate = true;
        updateLabHeader();
        feedback.innerHTML = `
          <strong>Spot on.</strong>
          <span>${d.correctWhy}</span><br />
          <button type="button" class="lab-next-btn" data-next="patch">Next: 2 · Tap the token →</button>
        `;
        feedback.querySelector("[data-next]").addEventListener("click", () => {
          activeDrill = "patch";
          renderLab();
        });
      } else {
        feedback.innerHTML = `
          <strong>That line is safe.</strong>
          <span>${d.wrongWhy}</span>
        `;
      }
    });
  });
}

function renderLabPatch(lab) {
  const d = lab.patch;
  const beforeHtml = d.before
    .map((l) => `<div class="code-line-btn"><span class="ln">·</span><span>${l.replace(/</g, "&lt;")}</span></div>`)
    .join("");
  const afterHtml = d.after
    .map((l) => `<div class="code-line-btn"><span class="ln">·</span><span>${l.replace(/</g, "&lt;")}</span></div>`)
    .join("");

  labStage.innerHTML = `
    <p class="lab-prompt">${d.prompt}</p>
    <div class="code-lines">
      ${beforeHtml}
      <div class="code-line-btn">
        <span class="ln">★</span>
        <span>${d.slotLinePrefix}<span class="token-slot" id="token-slot">/* tap token */</span>${d.slotLineSuffix}</span>
      </div>
      ${afterHtml}
    </div>
    <div class="chip-row" role="group" aria-label="Token choices">
      ${d.choices
        .map(
          (choice) =>
            `<button type="button" class="token-chip" data-token="${choice}">${choice}</button>`
        )
        .join("")}
    </div>
    <div class="lab-feedback" id="lab-feedback" hidden></div>
  `;

  const slot = labStage.querySelector("#token-slot");
  const chips = labStage.querySelectorAll(".token-chip");
  const feedback = labStage.querySelector("#lab-feedback");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const token = chip.dataset.token;
      const isRight = token === d.correctChoice;
      chips.forEach((c) => c.classList.remove("is-correct", "is-wrong"));
      chip.classList.add(isRight ? "is-correct" : "is-wrong");

      slot.textContent = token;
      slot.classList.toggle("is-filled", isRight);

      feedback.hidden = false;
      if (isRight) {
        solvedDrills[activeScenarioKey].patch = true;
        updateLabHeader();
        feedback.innerHTML = `
          <strong>Patched cleanly.</strong>
          <span>${d.explanation}</span><br />
          <button type="button" class="lab-next-btn" data-next="why">Next: 3 · Socratic why →</button>
        `;
        feedback.querySelector("[data-next]").addEventListener("click", () => {
          activeDrill = "why";
          renderLab();
        });
      } else {
        feedback.innerHTML = `
          <strong>Not quite.</strong>
          <span>Pick the token that references the stored state or semantic style in the snippet above.</span>
        `;
      }
    });
  });
}

function renderLabWhy(lab) {
  const d = lab.why;
  labStage.innerHTML = `
    <p class="lab-prompt">${d.prompt}</p>
    <div class="chip-row" role="group" aria-label="Socratic replies">
      ${d.choices
        .map(
          (c, idx) =>
            `<button type="button" class="token-chip" data-why="${idx}">${c.label}</button>`
        )
        .join("")}
    </div>
    <div class="lab-feedback" id="lab-feedback" hidden></div>
  `;

  const chips = labStage.querySelectorAll(".token-chip");
  const feedback = labStage.querySelector("#lab-feedback");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const idx = Number(chip.dataset.why);
      const picked = d.choices[idx];
      chips.forEach((c) => c.classList.remove("is-correct", "is-wrong"));
      chip.classList.add(picked.correct ? "is-correct" : "is-wrong");

      feedback.hidden = false;
      if (picked.correct) {
        solvedDrills[activeScenarioKey].why = true;
        updateLabHeader();
        feedback.innerHTML = `
          <strong>Locked in · queued for tomorrow's commute</strong>
          <span>${picked.explanation}</span>
        `;
      } else {
        feedback.innerHTML = `
          <strong>Think about the real-world failure mode.</strong>
          <span>${picked.explanation}</span>
        `;
      }
    });
  });
}

function renderLab() {
  updateLabHeader();
  const lab = SCENARIOS[activeScenarioKey].lab;
  if (activeDrill === "locate") {
    renderLabLocate(lab);
  } else if (activeDrill === "patch") {
    renderLabPatch(lab);
  } else {
    renderLabWhy(lab);
  }
}

labTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeDrill = tab.dataset.drill;
    renderLab();
  });
});

/* Scenario & Mode Wiring */
function selectScenario(key) {
  if (!SCENARIOS[key]) return;
  activeScenarioKey = key;
  scenarioButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.scenario === key);
  });
  renderPhoneIdle();
  renderDiffSheet();
  renderLab();
}

scenarioButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectScenario(btn.dataset.scenario);
  });
});

phoneModeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.phoneMode;
    if (mode === "learn") {
      renderPhoneLearnCard();
    } else {
      renderPhoneIdle();
    }
  });
});

beatTriggers.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.jump;
    runPhoneStudioDemo(target);
  });
});

const androidNotifyBtn = document.querySelector("#android-notify-btn");
const androidStatusNote = document.querySelector("#android-status-note");

if (androidNotifyBtn && androidStatusNote) {
  androidNotifyBtn.addEventListener("click", () => {
    androidStatusNote.hidden = !androidStatusNote.hidden;
    androidNotifyBtn.textContent = androidStatusNote.hidden
      ? "Follow Android build status →"
      : "Hide Android build status ↑";
  });
}

/* Initial render */
selectScenario("actor");
