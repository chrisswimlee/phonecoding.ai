const MODULES = {
  counter: {
    kicker: "iOS · SwiftUI · CounterCard.swift",
    title: "01 · State on a screen",
    xp: 40,
    takeaway:
      "@State tells SwiftUI to watch a value and re-render the card whenever a tap mutates it.",
    output: {
      beforeStatus: "Broken · UI frozen at 0",
      afterStatus: "Patched · Live tap counter",
      beforeCaption:
        "Without @State, tapping +1 cannot mutate count or trigger a view refresh.",
      afterCaption:
        "With @State, SwiftUI stores count outside the struct and re-renders on every tap.",
    },
    locate: {
      prompt:
        "Tap the line where `count` is declared as a plain property that SwiftUI refuses to mutate on button tap:",
      lines: [
        "struct StreakCard: View {",
        "  var count = 0",
        "  var body: some View {",
        "    Button(\"Complete Lesson (+1)\") {",
        "      count += 1",
        "    }",
        "  }",
        "}",
      ],
      correctIndex: 1,
      correctWhy:
        "Line 2 declares `var count = 0` without `@State`. Because SwiftUI views are value types, mutating a plain property inside `body` fails to compile and never refreshes the screen.",
      wrongWhy:
        "Look at line 2 where `count` is declared—what wrapper tells SwiftUI to persist and observe that value?",
    },
    patch: {
      prompt:
        "Tap the token that lets `count` update the live phone preview when tapped:",
      before: ["struct StreakCard: View {"],
      slotLinePrefix: "  ",
      slotLineSuffix: " private var count = 0",
      after: [
        "  var body: some View {",
        "    Button(\"Complete (+1)\") { count += 1 }",
        "  }",
        "}",
      ],
      choices: ["@State", "let", "static"],
      correctChoice: "@State",
      explanation:
        "Adding `@State` moves storage into SwiftUI's managed state box so tapping the button increments the counter and re-renders the view.",
    },
    why: {
      prompt:
        "Socratic check: why doesn't `count` reset to 0 every time SwiftUI re-creates the `StreakCard` struct?",
      choices: [
        {
          label: "SwiftUI stores @State outside the struct and reconnects it by view identity",
          correct: true,
          explanation:
            "Spot on. The struct is a lightweight description; `@State` lives in SwiftUI's persistent attribute graph.",
        },
        {
          label: "Because structs in Swift are reference types stored on the heap",
          correct: false,
          explanation:
            "Structs are value types in Swift. It is specifically `@State` that gives the value persistent storage.",
        },
        {
          label: "Because `private` variables never re-initialize",
          correct: false,
          explanation:
            "`private` only controls access visibility; `@State` is what persists the value across renders.",
        },
      ],
    },
  },

  guard: {
    kicker: "iOS · SwiftUI · PromptSender.swift",
    title: "02 · Empty sends",
    xp: 45,
    takeaway:
      "A top-of-function `guard ! trimmed.isEmpty else { return }` exits early before any network call runs.",
    output: {
      beforeStatus: "Buggy · Sends blank prompts",
      afterStatus: "Guarded · Blocks empty dispatch",
      beforeCaption:
        "Tapping Send with an empty prompt dispatches a blank agent task and wastes a run.",
      afterCaption:
        "The guard clause exits immediately when the trimmed string is empty.",
    },
    locate: {
      prompt:
        "Tap the line that dispatches a network call even when the user's voice transcript is completely blank:",
      lines: [
        "func sendTask(rawText: String) {",
        "  let cleaned = rawText.trimmingCharacters(in: .whitespaces)",
        "  // Missing empty check here",
        "  AgentBridge.shared.dispatch(prompt: cleaned)",
        "  Haptics.playSuccess()",
        "}",
      ],
      correctIndex: 3,
      correctWhy:
        "Line 4 calls `AgentBridge.shared.dispatch(prompt: cleaned)` unconditionally, so an empty string goes straight to the server.",
      wrongWhy:
        "Find the line that actually sends `cleaned` over the network without checking if it's empty first.",
    },
    patch: {
      prompt:
        "Tap the token that exits `sendTask` early whenever `cleaned` is empty:",
      before: [
        "func sendTask(rawText: String) {",
        "  let cleaned = rawText.trimmingCharacters(in: .whitespaces)",
      ],
      slotLinePrefix: "  ",
      slotLineSuffix: " { return }",
      after: ["  AgentBridge.shared.dispatch(prompt: cleaned)", "}"],
      choices: [
        "guard !cleaned.isEmpty else",
        "if !cleaned.isEmpty",
        "while cleaned.isEmpty",
      ],
      correctChoice: "guard !cleaned.isEmpty else",
      explanation:
        "`guard !cleaned.isEmpty else { return }` states the requirement up front and forces an early exit when it fails.",
    },
    why: {
      prompt:
        "Socratic check: why do Swift codebases prefer `guard ... else { return }` at the top of a method over nesting the whole method inside `if !cleaned.isEmpty { ... }`?",
      choices: [
        {
          label: "It keeps the happy path un-indented and makes failure exits impossible to miss",
          correct: true,
          explanation:
            "Exactly. On a narrow phone screen especially, flat indentation keeps the main logic readable.",
        },
        {
          label: "Because `if` statements cannot return from functions in Swift",
          correct: false,
          explanation:
            "`if` statements can return too, but `guard` enforces the early exit at compile time and avoids pyramid nesting.",
        },
        {
          label: "Because `guard` runs on a background thread automatically",
          correct: false,
          explanation:
            "`guard` is synchronous control flow—its advantage is clarity and compiler-checked early exit.",
        },
      ],
    },
  },

  actor: {
    kicker: "iOS · SwiftUI · VoiceStreamActor.swift",
    title: "03 · Reconnect on the move",
    xp: 60,
    takeaway:
      "Swift actors serialize property access, but state can change across any `await` unless you track an in-flight Task.",
    output: {
      beforeStatus: "Race · 2 sockets opened",
      afterStatus: "Deduplicated · 1 shared socket",
      beforeCaption:
        "When Wi-Fi drops to 5G, two callers pass the guard while `Task.sleep` is suspended.",
      afterCaption:
        "Storing `inFlight` before the first `await` makes concurrent callers share one socket handshake.",
    },
    locate: {
      prompt:
        "Tap the suspension line where a second caller can enter the actor before `isConnected` becomes true:",
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
        "Line 5 suspends at `await` while `isConnected` is still false. A second caller passes line 4 before line 7 ever executes.",
      wrongWhy:
        "Look for the first `await` after the `guard`—that suspension point is where actor re-entrancy happens.",
    },
    patch: {
      prompt:
        "Tap the token that deduplicates concurrent callers before the first `await`:",
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
        "Checking and storing `inFlight` synchronously before awaiting guarantees that concurrent callers await the same connection task.",
    },
    why: {
      prompt:
        "Socratic check: why did we also add 0–350ms of random jitter to the exponential backoff delay?",
      choices: [
        {
          label: "So thousands of dropped phones don't reconnect on the exact same second",
          correct: true,
          explanation:
            "Locked in. Backoff spaces out a single client; jitter prevents a synchronized retry storm across all clients.",
        },
        {
          label: "Because Swift actors require random delays to prevent deadlocks",
          correct: false,
          explanation:
            "Actors don't deadlock on `await`; jitter protects the remote server from thundering-herd spikes.",
        },
      ],
    },
  },

  font: {
    kicker: "iOS · SwiftUI · ThumbDiffCard.swift",
    title: "04 · Type that scales",
    xp: 50,
    takeaway:
      "Use `.system(.subheadline, design: .monospaced)` so code views stay aligned AND scale with iOS Dynamic Type.",
    output: {
      beforeStatus: "Fixed 13pt · Ignores user zoom",
      afterStatus: "Dynamic Type · Scales cleanly",
      beforeCaption:
        "Hardcoded `.system(size: 13)` stays tiny even when the user enables Larger Accessibility Text.",
      afterCaption:
        "Semantic `.subheadline` with `.monospaced` scales smoothly with the reader's accessibility slider.",
    },
    locate: {
      prompt:
        "Tap the line that locks the diff filename to a fixed pixel size and breaks iOS Dynamic Type:",
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
        "Line 4 hardcodes `size: 13`, opting out of automatic Dynamic Type scaling on mobile screens.",
      wrongWhy:
        "Tap the `.font(...)` modifier that specifies a fixed number instead of a semantic text style.",
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
        "Pairing semantic `.subheadline` with `design: .monospaced` preserves character alignment while scaling for every reader.",
    },
    why: {
      prompt:
        "Socratic check: why do diff cards also include `+` and `−` text badges instead of green and red colors alone?",
      choices: [
        {
          label: "So color-blind readers and VoiceOver can distinguish additions from deletions",
          correct: true,
          explanation:
            "Takeaway unlocked. Color reinforces meaning, but explicit symbols ensure every reader can parse the diff.",
        },
        {
          label: "Because iOS dark mode disables green and red tints",
          correct: false,
          explanation:
            "Dark mode supports tints fine; explicit `+` and `−` prefixes are for accessibility and instant scannability.",
        },
      ],
    },
  },
};

let currentModuleKey = "counter";
let currentStep = "locate";
let previewCount = 3;

const progressState = {
  counter: { locate: false, patch: false, why: false },
  guard: { locate: false, patch: false, why: false },
  actor: { locate: false, patch: false, why: false },
  font: { locate: false, patch: false, why: false },
};

const moduleCards = document.querySelectorAll("[data-module]");
const stepTabs = document.querySelectorAll("[data-edu-step]");
const labKicker = document.querySelector("#edu-lab-kicker");
const labTitle = document.querySelector("#edu-lab-title");
const labProgress = document.querySelector("#edu-lab-progress");
const labStage = document.querySelector("#edu-lab-stage");

const outputStatus = document.querySelector("#edu-output-status");
const outputScreen = document.querySelector("#edu-output-screen");
const outputCaption = document.querySelector("#edu-output-caption");
const recallList = document.querySelector("#edu-recall-list");

const solvedCountEl = document.querySelector("#edu-solved-count");
const xpCountEl = document.querySelector("#edu-xp-count");
const streakNoteEl = document.querySelector("#edu-streak-note");

function isModulePatched(key) {
  return progressState[key].patch;
}

function isModuleComplete(key) {
  const s = progressState[key];
  return s.locate && s.patch && s.why;
}

function updateScorecardAndRecall() {
  const keys = Object.keys(MODULES);
  let completedModules = 0;
  let totalXP = 0;
  const unlockedItems = [];

  keys.forEach((k) => {
    const s = progressState[k];
    const stepCount = [s.locate, s.patch, s.why].filter(Boolean).length;
    if (stepCount === 3) {
      completedModules += 1;
      totalXP += MODULES[k].xp;
      unlockedItems.push({ title: MODULES[k].title, takeaway: MODULES[k].takeaway });
    } else if (stepCount > 0) {
      totalXP += stepCount * 10;
    }
  });

  solvedCountEl.textContent = `${completedModules} / ${keys.length}`;
  xpCountEl.textContent = `${totalXP} XP`;

  if (completedModules > 0) {
    streakNoteEl.textContent = `${completedModules} takeaway card${
      completedModules > 1 ? "s" : ""
    } pinned to your Spaced Recall Deck below.`;
  }

  moduleCards.forEach((card) => {
    const k = card.dataset.module;
    card.classList.toggle("is-active", k === currentModuleKey);
    card.classList.toggle("is-completed", isModuleComplete(k));
    card.setAttribute("aria-selected", String(k === currentModuleKey));
  });

  if (unlockedItems.length === 0) {
    recallList.innerHTML =
      '<li class="recall-empty">Complete step 3 of any module to pin its takeaway card for tomorrow\'s commute.</li>';
  } else {
    recallList.innerHTML = unlockedItems
      .map(
        (item) =>
          `<li><strong>${item.title}</strong><span>${item.takeaway}</span></li>`
      )
      .join("");
  }
}

function renderLiveOutput() {
  const mod = MODULES[currentModuleKey];
  const patched = isModulePatched(currentModuleKey);

  outputStatus.textContent = patched ? mod.output.afterStatus : mod.output.beforeStatus;
  outputStatus.classList.toggle("is-healthy", patched);
  outputCaption.textContent = patched ? mod.output.afterCaption : mod.output.beforeCaption;

  if (currentModuleKey === "counter") {
    outputScreen.innerHTML = `
      <div class="mini-app">
        <p class="mini-label">StreakCard Preview</p>
        <p class="mini-big">${patched ? previewCount : 0} day streak</p>
        <button type="button" class="mini-btn" id="mini-counter-btn">
          ${patched ? "Tap to test: Complete (+1)" : "Complete (+1) · Frozen without @State"}
        </button>
      </div>
    `;
    const btn = outputScreen.querySelector("#mini-counter-btn");
    btn.addEventListener("click", () => {
      if (patched) {
        previewCount += 1;
        renderLiveOutput();
      }
    });
  } else if (currentModuleKey === "guard") {
    outputScreen.innerHTML = `
      <div class="mini-app">
        <p class="mini-label">Prompt Dispatcher</p>
        <p class="mini-code">input: "   " (blank spaces)</p>
        <p class="mini-result ${patched ? "ok" : "bad"}">
          ${
            patched
              ? "✔ Guard triggered: returned early (0 network calls)"
              : "✖ Dispatched empty prompt to cloud agent"
          }
        </p>
      </div>
    `;
  } else if (currentModuleKey === "actor") {
    outputScreen.innerHTML = `
      <div class="mini-app">
        <p class="mini-label">Wi-Fi → 5G Handoff Simulation</p>
        <p class="mini-code">Caller A + Caller B arrive 40ms apart</p>
        <p class="mini-result ${patched ? "ok" : "bad"}">
          ${
            patched
              ? "✔ Caller B awaits inFlight Task · 1 socket opened"
              : "✖ Both callers pass guard during sleep · 2 sockets opened"
          }
        </p>
      </div>
    `;
  } else {
    outputScreen.innerHTML = `
      <div class="mini-app">
        <p class="mini-label">iOS Accessibility Text: AX3</p>
        <p class="mini-code" style="font-size: ${patched ? "17px" : "11px"}">
          Services/VoiceStreamActor.swift +19 −5
        </p>
        <p class="mini-result ${patched ? "ok" : "bad"}">
          ${
            patched
              ? "✔ Scales cleanly with Dynamic Type + explicit +/− symbols"
              : "✖ Locked at tiny 13pt despite user accessibility preference"
          }
        </p>
      </div>
    `;
  }
}

function renderWorkbenchHeader() {
  const mod = MODULES[currentModuleKey];
  const state = progressState[currentModuleKey];
  const solvedSteps = [state.locate, state.patch, state.why].filter(Boolean).length;

  labKicker.textContent = mod.kicker;
  labTitle.textContent = mod.title;
  labProgress.textContent = `${solvedSteps} / 3 steps`;

  stepTabs.forEach((tab) => {
    const step = tab.dataset.eduStep;
    const active = step === currentStep;
    tab.classList.toggle("is-active", active);
    tab.classList.toggle("is-done", Boolean(state[step]));
    tab.setAttribute("aria-selected", String(active));
  });
}

function renderLocateStep(mod) {
  const d = mod.locate;
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
    <div class="lab-feedback" id="edu-feedback" hidden></div>
  `;

  const buttons = labStage.querySelectorAll(".code-line-btn");
  const feedback = labStage.querySelector("#edu-feedback");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.line);
      const isRight = idx === d.correctIndex;
      buttons.forEach((b) => b.classList.remove("is-correct", "is-wrong"));
      btn.classList.add(isRight ? "is-correct" : "is-wrong");

      feedback.hidden = false;
      if (isRight) {
        progressState[currentModuleKey].locate = true;
        renderWorkbenchHeader();
        updateScorecardAndRecall();
        feedback.innerHTML = `
          <strong>Spot on.</strong>
          <span>${d.correctWhy}</span><br />
          <button type="button" class="lab-next-btn" data-next="patch">Next: 2 · Tap the token →</button>
        `;
        feedback.querySelector("[data-next]").addEventListener("click", () => {
          currentStep = "patch";
          renderCurrentModule();
        });
      } else {
        feedback.innerHTML = `
          <strong>Not that line.</strong>
          <span>${d.wrongWhy}</span>
        `;
      }
    });
  });
}

function renderPatchStep(mod) {
  const d = mod.patch;
  const alreadyPatched = progressState[currentModuleKey].patch;
  const slotText = alreadyPatched ? d.correctChoice : "/* tap token */";

  const beforeHtml = d.before
    .map(
      (l) =>
        `<div class="code-line-btn"><span class="ln">·</span><span>${l.replace(
          /</g,
          "&lt;"
        )}</span></div>`
    )
    .join("");
  const afterHtml = d.after
    .map(
      (l) =>
        `<div class="code-line-btn"><span class="ln">·</span><span>${l.replace(
          /</g,
          "&lt;"
        )}</span></div>`
    )
    .join("");

  labStage.innerHTML = `
    <p class="lab-prompt">${d.prompt}</p>
    <div class="code-lines">
      ${beforeHtml}
      <div class="code-line-btn">
        <span class="ln">★</span>
        <span>${d.slotLinePrefix}<span class="token-slot ${
    alreadyPatched ? "is-filled" : ""
  }" id="edu-token-slot">${slotText}</span>${d.slotLineSuffix}</span>
      </div>
      ${afterHtml}
    </div>
    <div class="chip-row" role="group" aria-label="Token choices">
      ${d.choices
        .map(
          (choice) =>
            `<button type="button" class="token-chip ${
              alreadyPatched && choice === d.correctChoice ? "is-correct" : ""
            }" data-token="${choice}">${choice}</button>`
        )
        .join("")}
    </div>
    <div class="lab-feedback" id="edu-feedback" ${alreadyPatched ? "" : "hidden"}>
      ${
        alreadyPatched
          ? `<strong>Patched — check the Live Phone Output Preview!</strong><span>${d.explanation}</span><br /><button type="button" class="lab-next-btn" data-next="why">Next: 3 · Socratic why →</button>`
          : ""
      }
    </div>
  `;

  const slot = labStage.querySelector("#edu-token-slot");
  const chips = labStage.querySelectorAll(".token-chip");
  const feedback = labStage.querySelector("#edu-feedback");

  const bindNext = () => {
    const nextBtn = feedback.querySelector("[data-next]");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentStep = "why";
        renderCurrentModule();
      });
    }
  };
  bindNext();

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
        progressState[currentModuleKey].patch = true;
        renderWorkbenchHeader();
        renderLiveOutput();
        updateScorecardAndRecall();
        feedback.innerHTML = `
          <strong>Patched — watch the Live Phone Output Preview update!</strong>
          <span>${d.explanation}</span><br />
          <button type="button" class="lab-next-btn" data-next="why">Next: 3 · Socratic why →</button>
        `;
        bindNext();
      } else {
        feedback.innerHTML = `
          <strong>Try another token.</strong>
          <span>Pick the token that fixes the runtime behavior shown in the preview card.</span>
        `;
      }
    });
  });
}

function renderWhyStep(mod) {
  const d = mod.why;
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
    <div class="lab-feedback" id="edu-feedback" hidden></div>
  `;

  const chips = labStage.querySelectorAll(".token-chip");
  const feedback = labStage.querySelector("#edu-feedback");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const idx = Number(chip.dataset.why);
      const picked = d.choices[idx];
      chips.forEach((c) => c.classList.remove("is-correct", "is-wrong"));
      chip.classList.add(picked.correct ? "is-correct" : "is-wrong");

      feedback.hidden = false;
      if (picked.correct) {
        progressState[currentModuleKey].why = true;
        renderWorkbenchHeader();
        updateScorecardAndRecall();
        feedback.innerHTML = `
          <strong>Module complete · +${mod.xp} XP &amp; Takeaway Pinned</strong>
          <span>${picked.explanation}</span>
        `;
      } else {
        feedback.innerHTML = `
          <strong>Re-check the snippet.</strong>
          <span>${picked.explanation}</span>
        `;
      }
    });
  });
}

function renderCurrentModule() {
  const mod = MODULES[currentModuleKey];
  renderWorkbenchHeader();
  renderLiveOutput();
  updateScorecardAndRecall();

  if (currentStep === "locate") {
    renderLocateStep(mod);
  } else if (currentStep === "patch") {
    renderPatchStep(mod);
  } else {
    renderWhyStep(mod);
  }
}

moduleCards.forEach((card) => {
  card.addEventListener("click", () => {
    currentModuleKey = card.dataset.module;
    currentStep = "locate";
    renderCurrentModule();
  });
});

stepTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentStep = tab.dataset.eduStep;
    renderCurrentModule();
  });
});

renderCurrentModule();
