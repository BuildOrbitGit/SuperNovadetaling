// Supernova site constants: edit these first for quick brand/pricing updates.
const SITE_CONFIG = {
  businessName: "Supernova Automobile Detailing",
  phone: "6047283247",
  city: "Kelowna, BC",
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupNavigation() {
  const header = document.querySelector("[data-site-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 20);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.classList.toggle("is-open");
    navLinks?.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle?.classList.remove("is-open");
      navLinks.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    });
  });
}

function setupGsapAnimations() {
  if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) {
    document.querySelectorAll(".reveal").forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "none";
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.to(".hero-bg", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.to(".why-depth", {
    yPercent: 10,
    ease: "none",
    scrollTrigger: {
      trigger: ".why-supernova",
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });

  gsap.to("[data-route-progress]", {
    height: "100%",
    ease: "none",
    scrollTrigger: {
      trigger: ".why-supernova",
      start: "top 72%",
      end: "bottom 62%",
      scrub: true,
    },
  });

  gsap.utils.toArray(".reveal").forEach((element) => {
    gsap.to(element, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 86%",
      },
    });
  });

  gsap.utils.toArray("[data-hud-panel]").forEach((panel, index) => {
    const fromLeft = panel.classList.contains("hud-left");
    gsap.fromTo(panel, {
      opacity: 0,
      x: fromLeft ? -96 : 96,
      y: 44,
      rotationZ: fromLeft ? -4 : 4,
      rotationY: fromLeft ? 10 : -10,
      filter: "blur(8px)",
    }, {
      opacity: 1,
      x: 0,
      y: 0,
      rotationZ: 0,
      rotationY: 0,
      filter: "blur(0px)",
      duration: 1.05,
      ease: "power3.out",
      delay: index * 0.03,
      scrollTrigger: {
        trigger: panel,
        start: "top 82%",
      },
    });
  });

  const packageScreen = document.querySelector("[data-package-screen]");
  const packageTitle = document.querySelector("[data-package-title]");
  const packageShell = document.querySelector("[data-package-scroll]");

  if (packageScreen && packageShell) {
    const packageTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: packageShell,
        start: "top bottom",
        end: "center 35%",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    packageTimeline
      .fromTo(packageTitle, {
        y: 90,
        opacity: 0.72,
      }, {
        y: -26,
        opacity: 1,
        ease: "none",
      }, 0)
      .fromTo(packageScreen, {
        rotateX: 18,
        scale: 0.86,
        y: 120,
        opacity: 0.72,
      }, {
        rotateX: 0,
        scale: 1,
        y: 0,
        opacity: 1,
        ease: "none",
      }, 0);
  }

  gsap.utils.toArray(".parallax-media img").forEach((image) => {
    gsap.to(image, {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: image.closest("section"),
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

function setupComparisonWipe() {
  const frames = Array.from(document.querySelectorAll("[data-comparison]"));
  if (!frames.length) return;

  const DURATION = 1.5;

  const playWipe = (frame) => {
    const afterReveal = frame.querySelector("[data-after-reveal]");
    const sliderLine = frame.querySelector("[data-slider-line]");
    if (!afterReveal || !sliderLine) return;

    frame.classList.remove("wipe-done");

    if (window.gsap) gsap.killTweensOf([afterReveal, sliderLine]);
    afterReveal.style.clipPath = "inset(0 100% 0 0)";
    sliderLine.style.left = "0%";

    if (window.gsap && !prefersReducedMotion) {
      const tl = gsap.timeline({ onComplete: () => frame.classList.add("wipe-done") });
      tl.to(sliderLine,   { left: "100%",                  duration: DURATION, ease: "power2.inOut" }, 0)
        .to(afterReveal,  { clipPath: "inset(0 0% 0 0)",   duration: DURATION, ease: "power2.inOut" }, 0);
    } else {
      afterReveal.style.transition = `clip-path ${DURATION}s ease-in-out`;
      sliderLine.style.transition  = `left ${DURATION}s ease-in-out`;
      requestAnimationFrame(() => {
        afterReveal.style.clipPath = "inset(0 0% 0 0)";
        sliderLine.style.left = "100%";
      });
      setTimeout(() => frame.classList.add("wipe-done"), DURATION * 1000 + 100);
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => playWipe(entry.target), 250);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.45 });

  frames.forEach((frame) => {
    const hint = document.createElement("span");
    hint.className = "replay-hint";
    hint.textContent = "↺ tap to replay";
    frame.appendChild(hint);

    observer.observe(frame);
    frame.style.cursor = "pointer";
    frame.addEventListener("click", () => playWipe(frame));
  });
}

function setupTiltCards() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = ((0.5 - y / rect.height) * 10);

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}

function setupCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  const cards = Array.from(document.querySelectorAll(".gallery-card"));
  const prevButton = document.querySelector("[data-carousel-prev]");
  const nextButton = document.querySelector("[data-carousel-next]");
  let activeIndex = 0;
  let startX = 0;

  const render = () => {
    cards.forEach((card, index) => {
      card.classList.remove("active", "prev-card", "next-card");
      if (index === activeIndex) card.classList.add("active");
      if (index === (activeIndex - 1 + cards.length) % cards.length) card.classList.add("prev-card");
      if (index === (activeIndex + 1) % cards.length) card.classList.add("next-card");
    });
  };

  const move = (direction) => {
    activeIndex = (activeIndex + direction + cards.length) % cards.length;
    render();
  };

  prevButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));

  carousel?.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
  });

  carousel?.addEventListener("pointerup", (event) => {
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 42) move(delta > 0 ? -1 : 1);
  });

  render();
  window.setInterval(() => move(1), 5200);
}

// ── CAR DATA ─────────────────────────────────────────────────────────────
const CAR_MAKES_MODELS = {
  Acura: ["ILX","MDX","RDX","TLX","NSX","Integra"],
  Audi: ["A3","A4","A5","A6","A7","A8","Q3","Q5","Q7","Q8","TT","R8","e-tron","RS3","RS5","S3","S4","S5"],
  BMW: ["2 Series","3 Series","4 Series","5 Series","7 Series","8 Series","X1","X2","X3","X4","X5","X6","X7","M2","M3","M4","M5","Z4"],
  Buick: ["Enclave","Encore","Envision","LaCrosse"],
  Cadillac: ["CT4","CT5","Escalade","XT4","XT5","XT6"],
  Chevrolet: ["Blazer","Camaro","Colorado","Corvette","Equinox","Malibu","Silverado 1500","Suburban","Tahoe","Trailblazer","Traverse"],
  Chrysler: ["300","Pacifica"],
  Dodge: ["Challenger","Charger","Durango","RAM 1500"],
  Ferrari: ["296 GTB","F8 Tributo","Roma","SF90 Stradale"],
  Ford: ["Bronco","Edge","Escape","Explorer","F-150","Maverick","Mustang","Ranger","Transit"],
  GMC: ["Acadia","Canyon","Sierra 1500","Terrain","Yukon"],
  Honda: ["Accord","Civic","CR-V","HR-V","Odyssey","Passport","Pilot","Ridgeline"],
  Hyundai: ["Elantra","Ioniq 5","Ioniq 6","Kona","Palisade","Santa Fe","Sonata","Tucson"],
  Infiniti: ["Q50","Q60","QX50","QX55","QX60","QX80"],
  Jaguar: ["E-Pace","F-Pace","F-Type","I-Pace","XE","XF"],
  Jeep: ["Cherokee","Compass","Gladiator","Grand Cherokee","Renegade","Wrangler"],
  Kia: ["Carnival","EV6","K5","Sorento","Soul","Sportage","Stinger","Telluride"],
  Lamborghini: ["Huracán","Urus","Revuelto"],
  "Land Rover": ["Defender","Discovery","Range Rover","Range Rover Sport","Range Rover Velar"],
  Lexus: ["ES","IS","LC","LS","NX","RX","GX","LX","RC","UX"],
  Lincoln: ["Aviator","Corsair","Nautilus","Navigator"],
  Maserati: ["Ghibli","Grecale","Levante","MC20","Quattroporte"],
  Mazda: ["CX-30","CX-5","CX-50","CX-90","Mazda3","Mazda6","MX-5 Miata"],
  Mercedes: ["A-Class","C-Class","E-Class","GLA","GLB","GLC","GLE","GLS","G-Class","S-Class","CLA","AMG GT","EQS","Sprinter"],
  "Mini Cooper": ["Clubman","Convertible","Countryman","Hardtop"],
  Nissan: ["Altima","Armada","Frontier","Kicks","Leaf","Maxima","Murano","Pathfinder","Rogue","Sentra","Titan","Z"],
  Porsche: ["911","Boxster","Cayenne","Cayman","Macan","Panamera","Taycan"],
  RAM: ["1500","2500","3500","ProMaster"],
  Subaru: ["Ascent","BRZ","Crosstrek","Forester","Impreza","Legacy","Outback","Solterra","WRX"],
  Tesla: ["Model 3","Model S","Model X","Model Y","Cybertruck"],
  Toyota: ["4Runner","Camry","Corolla","Crown","GR86","Highlander","Land Cruiser","Prius","RAV4","Sequoia","Sienna","Tacoma","Tundra","Venza"],
  Volkswagen: ["Atlas","Golf","Golf GTI","ID.4","Jetta","Passat","Taos","Tiguan"],
  Volvo: ["S60","S90","V60","XC40","XC60","XC90"],
  Other: ["Other (specify in notes)"],
};

const TIME_SLOTS = ["8:00 AM","9:30 AM","11:00 AM","12:30 PM","2:00 PM","3:30 PM","5:00 PM"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── BOOKING MODAL ─────────────────────────────────────────────────────────
function setupBookingModal() {
  const modal   = document.getElementById("bookingModal");
  const body    = document.getElementById("bkBody");
  const progress = document.getElementById("bkProgressBar");
  if (!modal) return;

  let currentStep = 1;
  const TOTAL_STEPS = 5;

  // State
  const state = {
    date: null, dateLabel: null, time: null,
    make: "", model: "", year: "", color: "", vehicleType: "Car / Sedan",
    service: "Lunar Detail — Deep Clean", addons: [],
    name: "", phone: "", email: "", address: "", notes: "",
    photos: [], // base64 strings
  };

  // ── Open / Close ──────────────────────────────────────────────
  function openModal() {
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    goToStep(1);
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-open-booking]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
  });

  modal.querySelectorAll("[data-booking-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hasAttribute("hidden")) closeModal();
  });

  // ── Step Navigation ───────────────────────────────────────────
  function goToStep(n) {
    const steps = modal.querySelectorAll("[data-bk-step]");
    steps.forEach((s) => {
      const num = parseInt(s.dataset.bkStep, 10);
      s.hidden = num !== n;
    });

    // Indicators
    modal.querySelectorAll("[data-bk-ind]").forEach((ind) => {
      const num = parseInt(ind.dataset.bkInd, 10);
      ind.classList.toggle("active", num === n);
      ind.classList.toggle("done", num < n);
    });

    // Progress bar (steps 1-5 only)
    const pct = Math.min(((n - 1) / (TOTAL_STEPS - 1)) * 100, 100);
    progress.style.width = `${pct}%`;

    // Footer buttons
    const backBtn   = modal.querySelector("[data-bk-back]");
    const nextBtn   = modal.querySelector("[data-bk-next]");
    const submitBtn = modal.querySelector("[data-bk-submit]");

    backBtn.hidden   = n === 1 || n === 6;
    nextBtn.hidden   = n === 5 || n === 6;
    submitBtn.hidden = n !== 5;

    if (n === 5) renderReview();
    if (n === 6) progress.style.width = "100%";

    modal.querySelector("[data-bk-footer]").hidden = n === 6;

    currentStep = n;
    body.scrollTop = 0;
  }

  modal.querySelector("[data-bk-next]").addEventListener("click", () => {
    if (validateStep(currentStep)) goToStep(currentStep + 1);
  });

  modal.querySelector("[data-bk-back]").addEventListener("click", () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  // ── Validation ────────────────────────────────────────────────
  function validateStep(n) {
    if (n === 1) {
      if (!state.date) { alert("Please select a date."); return false; }
      if (!state.time) { alert("Please select a time."); return false; }
    }
    if (n === 2) {
      const fields = [
        { key: "make",  id: "bkMake",  label: "vehicle make" },
        { key: "model", id: "bkModel", label: "vehicle model" },
        { key: "year",  id: "bkYear",  label: "year" },
      ];
      for (const f of fields) {
        const el = document.getElementById(f.id);
        if (!el.value) {
          el.closest("[data-bk-field]").classList.add("error");
          el.focus();
          return false;
        }
        el.closest("[data-bk-field]").classList.remove("error");
        state[f.key] = el.value;
      }
      state.color = document.getElementById("bkColor").value;
      state.vehicleType = modal.querySelector("[name='vehicleType']:checked")?.value || "Car / Sedan";
    }
    if (n === 3) {
      state.service = modal.querySelector("[name='service']:checked")?.value || "";
      state.addons  = [...modal.querySelectorAll("[name='addon']:checked")].map((cb) => cb.value);
    }
    if (n === 4) {
      const fields = [
        { key: "name",    id: "bkName",    label: "full name" },
        { key: "phone",   id: "bkPhone",   label: "phone number" },
        { key: "email",   id: "bkEmail",   label: "email address" },
        { key: "address", id: "bkAddress", label: "service address" },
      ];
      let firstError = null;
      for (const f of fields) {
        const el = document.getElementById(f.id);
        const fieldEl = el.closest("[data-bk-field]");
        if (!el.value.trim()) {
          fieldEl.classList.add("error");
          firstError = firstError || el;
        } else {
          fieldEl.classList.remove("error");
          state[f.key] = el.value.trim();
        }
      }
      if (firstError) { firstError.focus(); return false; }

      // Basic email check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
        document.getElementById("bkEmail").closest("[data-bk-field]").classList.add("error");
        document.getElementById("bkEmail").focus();
        return false;
      }
      state.notes = document.getElementById("bkNotes").value.trim();
    }
    return true;
  }

  // ── Calendar ──────────────────────────────────────────────────
  const calWrap = modal.querySelector("[data-bk-calendar]");
  let calYear  = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  function renderCalendar() {
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const first  = new Date(calYear, calMonth, 1);
    const days   = new Date(calYear, calMonth + 1, 0).getDate();
    const offset = first.getDay();

    const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    let html = `<div class="bk-cal-header">
      <span class="bk-cal-month">${MONTH_NAMES[calMonth]} ${calYear}</span>
      <div class="bk-cal-nav">
        <button type="button" data-cal-prev aria-label="Previous month">‹</button>
        <button type="button" data-cal-next aria-label="Next month">›</button>
      </div>
    </div>
    <div class="bk-cal-grid">
      ${dayLabels.map((d) => `<div class="bk-cal-lbl">${d}</div>`).join("")}
      ${Array(offset).fill('<div class="bk-cal-day empty"></div>').join("")}`;

    for (let d = 1; d <= days; d++) {
      const date = new Date(calYear, calMonth, d);
      date.setHours(0, 0, 0, 0);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const dateStr = `${MONTH_NAMES[calMonth]} ${d}, ${calYear}`;
      const isSelected = state.dateLabel === dateStr;
      let cls = "bk-cal-day";
      if (isPast) cls += " past";
      if (isToday) cls += " today";
      if (isSelected) cls += " selected";
      html += `<div class="${cls}" data-date="${dateStr}" data-ts="${date.getTime()}">${d}</div>`;
    }

    html += "</div>";
    calWrap.innerHTML = html;

    calWrap.querySelector("[data-cal-prev]").addEventListener("click", () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar();
    });
    calWrap.querySelector("[data-cal-next]").addEventListener("click", () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar();
    });

    calWrap.querySelectorAll(".bk-cal-day:not(.past):not(.empty)").forEach((day) => {
      day.addEventListener("click", () => {
        state.dateLabel = day.dataset.date;
        state.date = day.dataset.date;
        state.time = null;
        renderCalendar();
        renderSlots();
      });
    });
  }

  function renderSlots() {
    const wrap  = modal.querySelector("[data-bk-slots-wrap]");
    const grid  = modal.querySelector("[data-bk-slots-grid]");
    const label = modal.querySelector("[data-bk-date-label]");
    if (!state.dateLabel) { wrap.hidden = true; return; }

    wrap.hidden = false;
    label.textContent = state.dateLabel;

    grid.innerHTML = TIME_SLOTS.map((t) => {
      const sel = state.time === t ? " selected" : "";
      return `<div class="bk-slot${sel}" data-time="${t}">${t}</div>`;
    }).join("");

    grid.querySelectorAll(".bk-slot").forEach((slot) => {
      slot.addEventListener("click", () => {
        state.time = slot.dataset.time;
        grid.querySelectorAll(".bk-slot").forEach((s) => s.classList.remove("selected"));
        slot.classList.add("selected");
      });
    });
  }

  renderCalendar();

  // ── Make / Model Dropdowns ────────────────────────────────────
  const makeEl  = document.getElementById("bkMake");
  const modelEl = document.getElementById("bkModel");
  const yearEl  = document.getElementById("bkYear");

  Object.keys(CAR_MAKES_MODELS).sort().forEach((make) => {
    makeEl.appendChild(Object.assign(document.createElement("option"), { value: make, textContent: make }));
  });

  const curYear = new Date().getFullYear();
  for (let y = curYear; y >= 1990; y--) {
    yearEl.appendChild(Object.assign(document.createElement("option"), { value: y, textContent: y }));
  }

  makeEl.addEventListener("change", () => {
    const models = CAR_MAKES_MODELS[makeEl.value] || [];
    modelEl.innerHTML = models.length
      ? models.map((m) => `<option value="${m}">${m}</option>`).join("")
      : "<option value=''>No models found</option>";
    modelEl.disabled = !models.length;
    makeEl.closest("[data-bk-field]").classList.remove("error");
  });

  modelEl.addEventListener("change", () => modelEl.closest("[data-bk-field]").classList.remove("error"));
  yearEl.addEventListener("change",  () => yearEl.closest("[data-bk-field]").classList.remove("error"));

  // ── Photo Upload ──────────────────────────────────────────────
  const photoInput   = modal.querySelector("[data-bk-photo-input]");
  const photoPreviews = modal.querySelector("[data-bk-photo-previews]");
  const MAX_PHOTOS   = 4;

  async function resizeImage(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, 900 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoPreviews() {
    photoPreviews.innerHTML = state.photos.map((src, i) => `
      <div class="bk-thumb">
        <img src="${src}" alt="Vehicle photo ${i + 1}">
        <button class="bk-thumb-rm" data-rm="${i}" type="button" aria-label="Remove photo">×</button>
      </div>`).join("");

    photoPreviews.querySelectorAll("[data-rm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.photos.splice(parseInt(btn.dataset.rm, 10), 1);
        renderPhotoPreviews();
      });
    });
  }

  photoInput.addEventListener("change", async () => {
    const files = [...photoInput.files].slice(0, MAX_PHOTOS - state.photos.length);
    for (const file of files) {
      if (state.photos.length >= MAX_PHOTOS) break;
      if (file.size > 10 * 1024 * 1024) continue; // skip >10MB
      state.photos.push(await resizeImage(file));
    }
    photoInput.value = "";
    renderPhotoPreviews();
  });

  // ── Review Summary ────────────────────────────────────────────
  function renderReview() {
    const el = modal.querySelector("[data-bk-review]");
    const rows = [
      ["Date & Time", `${state.date} · ${state.time}`],
      ["Location",    state.address],
      ["Vehicle",     `${state.year} ${state.make} ${state.model}${state.color ? " · " + state.color : ""} · ${state.vehicleType}`],
      ["Package",     state.service],
      ["Add-Ons",     state.addons.length ? state.addons.join(", ") : "None"],
      state.notes ? ["Notes", state.notes] : null,
    ].filter(Boolean);

    el.innerHTML = rows.map(([l, v]) =>
      `<div class="bk-review-row"><span class="rl">${l}</span><span class="rv">${v}</span></div>`
    ).join("") + `<div class="bk-review-row total"><span class="rl">Estimated Total</span><span class="rv">Confirm on-site</span></div>`;
  }

  // ── Submit ────────────────────────────────────────────────────
  const submitBtn = modal.querySelector("[data-bk-submit]");
  const errorEl   = modal.querySelector("[data-bk-error]");

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    errorEl.hidden = true;

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.name, email: state.email, phone: state.phone, address: state.address,
          date: state.date, time: state.time,
          make: state.make, model: state.model, year: state.year,
          color: state.color, vehicleType: state.vehicleType,
          service: state.service, addons: state.addons, notes: state.notes,
          photos: state.photos,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      goToStep(6);
    } catch (err) {
      errorEl.textContent = err.message || "Could not send. Please text us at 604-728-3247.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Booking Request";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty("--business-name", `"${SITE_CONFIG.businessName}"`);
  setupNavigation();
  setupGsapAnimations();
  setupComparisonWipe();
  setupTiltCards();
  setupCarousel();
  setupBookingModal();
});
