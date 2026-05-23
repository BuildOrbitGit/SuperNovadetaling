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

function setupComparisonScroll() {
  const stories = Array.from(document.querySelectorAll("[data-comparison-story]"));
  if (!stories.length) return;

  const clamp = (value) => Math.min(1, Math.max(0, value));

  const updateComparisons = () => {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const startLine = viewportHeight * 0.78;
    const endLine = viewportHeight * 0.18;
    const travel = startLine - endLine;

    stories.forEach((story) => {
      const isBottomUp = story.dataset.direction === "bottom-up";
      const afterReveal = story.querySelector("[data-after-reveal]");
      const sliderLine = story.querySelector("[data-slider-line]");
      if (!afterReveal || !sliderLine) return;

      const rect = story.getBoundingClientRect();
      const progress = clamp((startLine - rect.top) / travel);
      const hidden = 100 - progress * 100;
      const lineTop = isBottomUp ? 100 - progress * 100 : progress * 100;

      afterReveal.style.clipPath = isBottomUp
        ? `inset(${hidden}% 0 0 0)`
        : `inset(0 0 ${hidden}% 0)`;
      sliderLine.style.top = `${lineTop}%`;
    });
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateComparisons();
      ticking = false;
    });
  };

  updateComparisons();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", updateComparisons);
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

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty("--business-name", `"${SITE_CONFIG.businessName}"`);
  setupNavigation();
  setupGsapAnimations();
  setupComparisonScroll();
  setupTiltCards();
  setupCarousel();
});
