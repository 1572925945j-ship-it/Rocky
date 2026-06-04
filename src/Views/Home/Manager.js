import GSAP from "gsap";
import Views from "../../../lib/Routing/Views";
import { Route } from "./Config";
import { portfolioPages, projects } from "./Data";
import { createOptimizedImageHTML, getStageImage, resolveAssetUrl } from "./ImageUtils";

const isMobileViewport = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
};

export default class Manager extends Views {
  constructor() {
    super(Route);
    this.Elements = {
      views: `[data-key='${Route}']`,
      root: ".GRBPortfolio",
      loader: ".LoaderLocal",
      loaderLetters: ".LoaderLocal__letters span",
      enter: ".EnterButton",
      percent: ".EnterButton__percent",
      header: ".HeaderLocal",
      contactToggle: ".ContactToggle",
      contactPanel: ".ContactPanel",
      stageMetaIndex: ".StageMeta__index",
      stageMetaTitle: ".StageMeta__title",
      filters: ".FilterLocal",
      prev: ".ArrowLocal--left",
      next: ".ArrowLocal--right",
      openAll: ".OpenAll",
      centerTitle: ".CenterTitle",
      spaceStage: ".SpaceStage",
      spaceCamera: ".SpaceCamera",
      dust: ".SpaceDust__dot",
      cards: ".SpaceCard",
      nearPanels: ".NearPanel",
      aboutWord: ".AboutWord",
      workWord: ".WorkWord",
      labWord: ".LabWord",
      featurePanels: ".FeaturePanel",
      aboutSheet: ".Sheet--about",
      worksSheet: ".Sheet--works",
      detail: ".ProjectDetail",
      detailClose: ".DetailClose",
      detailHero: ".DetailHero",
      detailPreview: ".DetailPreview",
      detailPreviewImage: ".DetailPreview__image",
      detailIndex: ".DetailIndex",
      detailTitle: ".DetailTitle h2",
      detailSummary: ".DetailTitle p",
      detailGallery: ".DetailGallery",
      detailToplineCurrent: ".DetailTopline__current",
      detailNextCue: ".DetailNextCue",
      detailNextCueTitle: ".DetailNextCue__title",
      scrollProgress: ".ScrollProgress span",
      cursor: ".CursorLocal",
      cursorBorder: ".CursorLocal__border",
    };
    this.pageByNumber = new Map(portfolioPages.map((page) => [page.number, page]));
    this.detailProjectSequence = ["BUSINESS", "BRAND", "IP DESIGN", "AIGC VISUAL"];
    this.activeFilter = "all";
    this.activeIndex = 0;
    this.mouse = { x: 0.5, y: 0.5 };
    this.cursor = { x: 0, y: 0 };
    this.border = { x: 0, y: 0 };
    this.progress = 0;
    this.targetProgress = 0;
    this.sceneTime = 0;
    this.lastSceneTime = -1;
    this.lastProgress = -1;
    this.lastMouseX = -1;
    this.lastMouseY = -1;
    this.lastScrollY = 0;
    this.isEntered = false;
    this.dragState = null;
    this.swallowNextClick = false;
    this.isLoopingToStart = false;
    this.bottomProjectOpened = false;
    this.homeBottomReadyAt = 0;
    this.homeBottomIntent = 0;
    this.homeBottomIntentAt = 0;
    this.currentDetailProjectIndex = -1;
    this.detailBottomLocked = false;
    this.detailSuppressBottomTrigger = false;
    this.detailIgnoreScrollUntil = 0;
    this.lastDetailScrollTop = 0;
    this.detailBottomReadyAt = 0;
    this.detailBottomIntent = 0;
    this.detailBottomIntentAt = 0;
    this.currentStageLabel = "";
    this.isMobile = isMobileViewport();
    this.mode = null;
    this.commonEvents = [];
    this.desktopEvents = [];
    this.mobileEvents = [];
    this.boundFilterHandlers = [];
    this.boundCardHandlers = [];
    this.boundNearPanelHandlers = [];
    this.boundFeaturePanelHandlers = [];
    this.mobileFrame = 0;
    this.lastMobileSceneY = -1;
    this.lastMobileSceneAt = 0;
    this.mobileScrollRaf = null;
    this.galleryAppendToken = 0;
    this.galleryIdleHandle = null;
    this.galleryTimeoutHandle = null;
    this.preloadedStageImages = new Set();
    this.lastCameraTransform = "";
  }

  in({ InFinish }) {
    this.cacheDom();
    this.preloadInitialImages();
    this.isMobile = isMobileViewport();
    this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.border = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.bindEvents();
    if (this.isMobile) {
      this.setupMobileMode();
    } else {
      this.setupDesktopMode();
    }
    this.prepareLoader();
    this.animation = GSAP.timeline({
      onComplete: InFinish,
      defaults: { duration: 0.8, ease: "expo.out" },
    }).fromTo(this.DOM.views, { opacity: 0 }, { opacity: 1 });
  }

  out({ NextShow, OutFinish }) {
    this.unbindEvents();
    this.teardownDesktopMode();
    this.teardownMobileMode();
    this.cancelGalleryAppend();
    window.clearTimeout(this.detailBottomUnlockTimer);
    this.animation = GSAP.timeline({
      onStart: NextShow,
      onComplete: OutFinish,
      defaults: { duration: 0.8, ease: "expo.inOut" },
    }).to(this.DOM.views, { opacity: 0 });
  }

  cacheDom() {
    this.cards = Array.isArray(this.DOM.cards) ? this.DOM.cards : [...document.querySelectorAll(".SpaceCard")];
    this.filters = Array.isArray(this.DOM.filters) ? this.DOM.filters : [...document.querySelectorAll(".FilterLocal")];
    this.featurePanels = Array.isArray(this.DOM.featurePanels) ? this.DOM.featurePanels : [...document.querySelectorAll(".FeaturePanel")];
    this.dust = Array.isArray(this.DOM.dust) ? this.DOM.dust : [...document.querySelectorAll(".SpaceDust__dot")];
    this.nearPanels = Array.isArray(this.DOM.nearPanels) ? this.DOM.nearPanels : [...document.querySelectorAll(".NearPanel")];
    this.cardMetrics = this.cards.map((card) => this.createCardMetric(card));
    this.panelMetrics = this.featurePanels.map((panel) => this.createPanelMetric(panel));
    this.dustMetrics = this.dust.map((dot, index) => this.createDustMetric(dot, index));
    this.nearMetrics = this.nearPanels.map((panel) => this.createNearMetric(panel));
  }

  preloadImage(src, priority = "high") {
    const href = resolveAssetUrl(src);
    if (!href || this.preloadedStageImages.has(href)) return;
    this.preloadedStageImages.add(href);
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.fetchPriority = priority;
    document.head.appendChild(link);
  }

  preloadInitialImages() {
    const firstPage = portfolioPages[0];
    const firstShowcase = projects.find((project) => project.title === "BUSINESS");
    if (firstPage?.thumb) this.preloadImage(firstPage.thumb, "high");
    if (firstShowcase?.image) this.preloadImage(getStageImage(firstShowcase.image).src, "high");
  }

  random(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  createCardMetric(card) {
    const page = this.pageByNumber.get(card.dataset.page);
    const order = Number(card.dataset.order || page.index);
    const layer = Number(card.dataset.layer || 0);
    const seed = order + 11;
    const lane = this.random(seed + 1) > 0.5 ? 1 : -1;
    return {
      card,
      page,
      order,
      layer,
      xFactor: (this.random(seed + 2) - 0.5) * 2.65 + lane * 0.18,
      yFactor: (this.random(seed + 3) - 0.5) * 1.78,
      z: -this.random(seed + 4) * 7600 - layer * 2100,
      rx: (this.random(seed + 5) - 0.5) * 90,
      ry: (this.random(seed + 6) - 0.5) * 110,
      rz: (this.random(seed + 7) - 0.5) * 80,
      spin: this.random(seed + 8) > 0.5 ? 1 : -1,
      floatSpeed: 0.55 + this.random(seed + 10) * 0.8,
      floatRange: 10 + this.random(seed + 11) * 28,
      depthRange: 55 + this.random(seed + 12) * 125,
      scale: card.classList.contains("SpaceCard--feature") ? 1.45 + this.random(seed + 9) * 0.68 : 0.34 + this.random(seed + 9) * 0.44,
    };
  }

  createPanelMetric(panel) {
    const index = Number(panel.dataset.index || 0);
    const project = projects.find((item) => item.title === panel.dataset.project);
    const side = index % 2 === 0 ? -1 : 1;
    return {
      panel,
      project,
      index,
      start: 0.58 + index * 0.055,
      end: 0.79 + index * 0.062,
      x: side * (260 + index * 70),
      y: index === 1 ? -16 : index === 2 ? 16 : 0,
      zStart: -4200 - index * 800,
      zEnd: 720 + index * 210,
      rx: index === 2 ? -18 : 12,
      ry: side * (24 + index * 8),
      rz: side * (-11 - index * 5),
    };
  }

  createDustMetric(dot, index) {
    const seed = index + 191;
    return {
      dot,
      index,
      xFactor: (this.random(seed) - 0.5) * 3.1,
      yFactor: (this.random(seed + 1) - 0.5) * 2.2,
      z: -this.random(seed + 2) * 9000 - 300,
      scale: 0.32 + this.random(seed + 3) * 1.8,
      rotate: this.random(seed + 4) * 360,
      spin: this.random(seed + 5) > 0.5 ? 1 : -1,
      floatSpeed: 0.45 + this.random(seed + 6) * 0.9,
    };
  }

  createNearMetric(panel) {
    const page = this.pageByNumber.get(panel.dataset.page);
    const index = Number(panel.dataset.nearIndex || 0);
    const seed = index + 311;
    const side = index % 2 === 0 ? -1 : 1;
    return {
      panel,
      page,
      index,
      side,
      angle: index * 0.72 + this.random(seed) * 0.3,
      x: side * (220 + this.random(seed + 1) * 720),
      y: (this.random(seed + 2) - 0.5) * 520,
      z: -3800 - index * 520 - this.random(seed + 3) * 600,
      rx: -14 + this.random(seed + 4) * 28,
      ry: side * (32 + this.random(seed + 5) * 42),
      rz: -22 + this.random(seed + 6) * 44,
      scale: 0.82 + this.random(seed + 7) * 0.6,
    };
  }

  prepareLoader() {
    GSAP.set(this.DOM.header, { autoAlpha: 0, y: 24 });
    GSAP.set(".CenterTitle", { autoAlpha: 0, scale: 0.94 });
    GSAP.set(this.DOM.aboutSheet, { autoAlpha: 0 });
    GSAP.set(this.DOM.loader, { autoAlpha: 1 });
    GSAP.set(this.DOM.enter, { pointerEvents: "none" });
    GSAP.set(this.DOM.percent, { yPercent: 0 });
    GSAP.set(".EnterButton__copy", { yPercent: -130 });
    GSAP.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(this.DOM.loaderLetters, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.9, stagger: 0.012 })
      .to(this.DOM.loaderLetters, { autoAlpha: 0.16, duration: 0.95, stagger: 0.006, ease: "expo.inOut" }, 0.78)
      .fromTo(".LoaderLocal__rings", { autoAlpha: 0, scale: 0.5, rotate: -28 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.25 }, 0.8)
      .fromTo(".LoaderLocal__stamp", { autoAlpha: 0, scale: 0.7, rotate: 12 }, { autoAlpha: 0.07, scale: 1, rotate: -4, duration: 1.05 }, 0.95)
      .fromTo(this.DOM.enter, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.85 }, 1.08);

    const progress = { value: 0 };
    GSAP.to(progress, {
      value: 100,
      duration: 1.65,
      ease: "power2.out",
      onUpdate: () => {
        this.DOM.percent.textContent = Math.round(progress.value);
      },
      onComplete: () => {
        this.DOM.enter.classList.add("is-ready");
        GSAP.set(this.DOM.enter, { pointerEvents: "all" });
      },
    });
  }

  enterSite() {
    if (this.DOM.root.classList.contains("is-entered")) return;
    window.scrollTo(0, 0);
    this.targetProgress = 0;
    this.progress = 0;
    this.bottomProjectOpened = false;
    this.DOM.root.classList.add("is-entered");
    this.isEntered = true;
    GSAP.timeline()
      .to(this.DOM.enter, { scale: 0.42, rotate: -24, autoAlpha: 0, duration: 0.75, ease: "expo.inOut" }, 0)
      .to(".LoaderLocal__rings", { scale: 1.85, rotate: 44, autoAlpha: 0, duration: 1.28, ease: "expo.inOut" }, 0)
      .to(this.DOM.loaderLetters, { autoAlpha: 0, duration: 0.9, stagger: 0.004, ease: "expo.inOut" }, 0)
      .to(".LoaderLocal__stamp", { scale: 1.22, y: -70, autoAlpha: 0, duration: 1.05, ease: "expo.inOut" }, 0.02)
      .to(".LoaderLocal__corner", { y: 32, autoAlpha: 0, duration: 0.72, stagger: 0.04, ease: "expo.inOut" }, 0)
      .to(this.DOM.loader, { scale: 1.1, autoAlpha: 0, duration: 1.1, ease: "expo.inOut" }, 0.18)
      .fromTo(".CenterTitle", { scale: 0.94, autoAlpha: 0, y: 10 }, { scale: 1, autoAlpha: 0, y: 0, duration: 0.8, ease: "expo.out" }, 0.66)
      .to(this.DOM.header, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }, 0.72);
    this.updateScene(true);
  }

  bindEvents() {
    this.commonEvents = [];
    this.desktopEvents = [];
    this.boundFilterHandlers = [];
    this.boundCardHandlers = [];
    this.boundNearPanelHandlers = [];
    this.boundFeaturePanelHandlers = [];

    this.enterHandler = () => this.enterSite();
    this.contactHandler = () => this.toggleContact();
    this.prevHandler = () => this.changeProject(-1);
    this.nextHandler = () => this.changeProject(1);
    this.openAllHandler = () => this.openProject(projects[0]);
    this.scrollHandler = () => this.onScroll();
    this.pageWheelHandler = (event) => this.onPageWheel(event);
    this.detailScrollHandler = () => this.onDetailScroll();
    this.detailWheelHandler = (event) => this.onDetailWheel(event);
    this.pointerHandler = (event) => this.onPointerMove(event);
    this.keyHandler = (event) => this.onKey(event);
    this.dragStartHandler = (event) => this.onDragStart(event);
    this.dragMoveHandler = (event) => this.onDragMove(event);
    this.dragEndHandler = () => this.onDragEnd();
    this.clickCaptureHandler = (event) => this.onClickCapture(event);
    this.mobileStageClickHandler = (event) => this.onMobileStageClick(event);
    this.detailCloseHandler = () => this.closeDetail();
    this.cursorOverHandler = (event) => this.onCursorOver(event);
    this.cursorOutHandler = (event) => this.onCursorOut(event);

    this.addEvent(this.DOM.enter, "click", this.enterHandler);
    this.addEvent(this.DOM.contactToggle, "click", this.contactHandler);
    this.addEvent(this.DOM.prev, "click", this.prevHandler);
    this.addEvent(this.DOM.next, "click", this.nextHandler);
    this.addEvent(this.DOM.openAll, "click", this.openAllHandler);
    this.addEvent(this.DOM.detailClose, "click", this.detailCloseHandler);
    this.addEvent(window, "keydown", this.keyHandler);

    this.filters.forEach((button) => {
      const handler = () => this.setFilter(button.dataset.filter);
      this.boundFilterHandlers.push({ button, handler });
      this.addEvent(button, "click", handler);
    });

    this.cards.forEach((card) => {
      const handler = () => this.openPageDetail(this.pageByNumber.get(card.dataset.page));
      this.boundCardHandlers.push({ card, handler });
      this.addEvent(card, "click", handler);
    });
    this.nearPanels.forEach((panel) => {
      const handler = () => this.openPageDetail(this.pageByNumber.get(panel.dataset.page));
      this.boundNearPanelHandlers.push({ panel, handler });
      this.addEvent(panel, "click", handler);
    });
    this.featurePanels.forEach((panel) => {
      const handler = () => {
        const project = projects.find((item) => item.title === panel.dataset.project);
        if (project) this.openProject(project);
      };
      this.boundFeaturePanelHandlers.push({ panel, handler });
      this.addEvent(panel, "click", handler);
    });
  }

  unbindEvents() {
    this.removeEvents("desktopEvents");
    this.removeEvents("mobileEvents");
    this.removeEvents("commonEvents");
    this.boundFilterHandlers = [];
    this.boundCardHandlers = [];
    this.boundNearPanelHandlers = [];
    this.boundFeaturePanelHandlers = [];
  }

  addEvent(target, type, handler, options, bucket = "commonEvents") {
    if (!target || !handler) return;
    target.addEventListener(type, handler, options);
    this[bucket].push({ target, type, handler, options });
  }

  removeEvents(bucket) {
    this[bucket].forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    this[bucket] = [];
  }

  onScroll() {
    this.updateTargetProgress();
    if (!this.isMobile || !this.isEntered || this.DOM.root.classList.contains("is-detail-open") || this.DOM.root.classList.contains("is-contact-open")) return;
    if (this.mobileScrollRaf) return;
    this.mobileScrollRaf = window.requestAnimationFrame(() => {
      this.mobileScrollRaf = null;
      this.updateTargetProgress();
      const progress = this.targetProgress;
      this.DOM.root?.style.setProperty("--scene-progress", `${progress}`);
      if (this.DOM.scrollProgress) {
        this.DOM.scrollProgress.style.transform = `scaleX(${progress})`;
      }
    });
  }

  setupDesktopMode() {
    if (this.mode === "desktop") return;
    this.teardownMobileMode();
    this.mode = "desktop";
    this.isMobile = false;
    this.DOM.root?.classList.remove("is-mobile-mode");
    this.DOM.root?.classList.add("is-desktop-mode");
    this.removeEvents("mobileEvents");
    this.addEvent(window, "scroll", this.scrollHandler, { passive: true }, "desktopEvents");
    this.addEvent(window, "wheel", this.pageWheelHandler, { passive: true }, "desktopEvents");
    this.addEvent(this.DOM.detail, "scroll", this.detailScrollHandler, { passive: true }, "desktopEvents");
    this.addEvent(this.DOM.detail, "wheel", this.detailWheelHandler, { passive: true }, "desktopEvents");
    this.addEvent(window, "mousemove", this.pointerHandler, { passive: true }, "desktopEvents");
    this.addEvent(window, "pointermove", this.dragMoveHandler, { passive: true }, "desktopEvents");
    this.addEvent(window, "pointerup", this.dragEndHandler, { passive: true }, "desktopEvents");
    this.addEvent(this.DOM.spaceStage, "pointerdown", this.dragStartHandler, { passive: true }, "desktopEvents");
    this.addEvent(document, "click", this.clickCaptureHandler, true, "desktopEvents");
    this.addEvent(document, "mouseover", this.cursorOverHandler, undefined, "desktopEvents");
    this.addEvent(document, "mouseout", this.cursorOutHandler, undefined, "desktopEvents");
    this.updateScene(true);
  }

  teardownDesktopMode() {
    this.removeEvents("desktopEvents");
    this.dragState = null;
    this.swallowNextClick = false;
    if (this.mode === "desktop") this.mode = null;
  }

  setupMobileMode() {
    if (this.mode === "mobile") return;
    this.teardownDesktopMode();
    this.mode = "mobile";
    this.isMobile = true;
    this.dragState = null;
    this.swallowNextClick = false;
    this.DOM.root?.classList.remove("is-desktop-mode");
    this.DOM.root?.classList.add("is-mobile-mode");
    this.addEvent(window, "scroll", this.scrollHandler, { passive: true }, "mobileEvents");
    this.addEvent(this.DOM.detail, "scroll", this.detailScrollHandler, { passive: true }, "mobileEvents");
    this.addEvent(document, "click", this.mobileStageClickHandler, true, "mobileEvents");
    this.updateScene(true);
  }

  teardownMobileMode() {
    if (this.mode !== "mobile") return;
    this.removeEvents("mobileEvents");
    if (this.mobileScrollRaf) {
      window.cancelAnimationFrame(this.mobileScrollRaf);
      this.mobileScrollRaf = null;
    }
    this.DOM.root?.classList.remove("is-mobile-mode");
    this.mode = null;
  }

  syncViewportMode() {
    const nextIsMobile = isMobileViewport();
    if (nextIsMobile === this.isMobile && this.mode) return false;
    this.isMobile = nextIsMobile;
    if (this.isMobile) {
      this.setupMobileMode();
    } else {
      this.setupDesktopMode();
    }
    return true;
  }

  resetMobileScene() {
    this.mouse = { x: 0.5, y: 0.5 };
    this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.border = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.progress = 0;
    this.targetProgress = 0;
    this.lastProgress = -1;
    this.lastMobileSceneY = -1;
    this.lastMobileSceneAt = 0;
    this.currentStageLabel = "";
    if (this.DOM.spaceCamera) this.DOM.spaceCamera.style.transform = "";
    if (this.DOM.scrollProgress) this.DOM.scrollProgress.style.transform = "";
    [this.DOM.centerTitle, this.DOM.aboutSheet, this.DOM.worksSheet].forEach((element) => {
      if (!element) return;
      element.style.opacity = "";
      element.style.visibility = "";
      element.style.transform = "";
      element.style.pointerEvents = "";
    });
    [...this.cards, ...this.featurePanels, ...this.nearPanels, ...this.dust].forEach((element) => {
      element.style.opacity = "";
      element.style.filter = "";
      element.style.transform = "";
      element.style.pointerEvents = "";
      element.style.willChange = "";
    });
    if (this.DOM.detailToplineCurrent) this.DOM.detailToplineCurrent.textContent = "01";
    const detailToplineText = this.DOM.detail?.querySelector(".DetailTopline span:last-child");
    if (detailToplineText) detailToplineText.textContent = "SCROLL GALLERY";
    this.updateScene(true);
  }

  updateMobileScene(force = false) {
    if (!this.isMobile || !this.DOM?.root) return;
    if (document.visibilityState === "hidden") return;

    const now = Date.now();
    const scrollY = window.scrollY || 0;
    if (!force && Math.abs(scrollY - this.lastMobileSceneY) < 2 && now - this.lastMobileSceneAt < 80) return;

    this.lastMobileSceneY = scrollY;
    this.lastMobileSceneAt = now;
    this.updateTargetProgress();

    const viewportHeight = Math.max(1, window.innerHeight);
    const progress = this.targetProgress;
    this.DOM.root.style.setProperty("--scene-progress", `${progress}`);
    this.DOM.root.style.setProperty("--center-opacity", `${Math.max(0.18, 1 - progress * 1.2)}`);
    if (this.DOM.scrollProgress) {
      this.DOM.scrollProgress.style.transform = `scaleX(${progress})`;
    }

    if (this.DOM.centerTitle && !this.DOM.root.classList.contains("is-detail-open")) {
      const titleShift = Math.max(-24, Math.min(16, -scrollY * 0.035));
      this.DOM.centerTitle.style.transform = `translate3d(0, ${titleShift}px, 0)`;
    }

    const animateMobileItem = (element, index, strength = 1) => {
      if (!element || element.classList.contains("is-hidden")) return;
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > viewportHeight + 160) return;
      const centerOffset = (rect.top + rect.height * 0.5 - viewportHeight * 0.5) / viewportHeight;
      const y = Math.max(-18, Math.min(18, centerOffset * -26 * strength));
      const scale = 0.975 + Math.max(0, 1 - Math.abs(centerOffset) * 1.4) * 0.025;
      const opacity = 0.72 + Math.max(0, 1 - Math.abs(centerOffset) * 1.5) * 0.28;
      element.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      element.style.opacity = opacity;
      element.classList.toggle("is-mobile-active", opacity > 0.88);
      element.style.setProperty("--mobile-delay", `${Math.min(index, 8) * 0.035}s`);
    };

    this.featurePanels.forEach((panel, index) => animateMobileItem(panel, index, 0.8));
    this.cards.forEach((card, index) => {
      if (card.dataset.layer !== "0") return;
      animateMobileItem(card, index, 0.55);
    });
    if (this.DOM.aboutSheet && !this.DOM.root.classList.contains("is-detail-open")) {
      animateMobileItem(this.DOM.aboutSheet, 0, 0.45);
    }
  }

  onClickCapture(event) {
    if (!this.swallowNextClick) return;
    if (!this.isMobile && event.cancelable) {
      event.preventDefault();
    }
    event.stopImmediatePropagation();
    this.swallowNextClick = false;
  }

  onMobileStageClick(event) {
    if (!this.isMobile) return;
    if (!this.isEntered || this.DOM.root.classList.contains("is-detail-open") || this.DOM.root.classList.contains("is-contact-open")) return;
    if (event.target.closest("button, a")) return;

    const point = { x: event.clientX, y: event.clientY };
    const stageRect = this.DOM.spaceStage?.getBoundingClientRect();
    if (!stageRect || point.x < stageRect.left || point.x > stageRect.right || point.y < stageRect.top || point.y > stageRect.bottom) return;
    const candidates = [...this.featurePanels, ...this.nearPanels, ...this.cards]
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const contains = point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
        return {
          element,
          index,
          rect,
          contains,
          opacity: Number(style.opacity || 0),
          pointerEvents: style.pointerEvents,
          area: rect.width * rect.height,
        };
      })
      .filter((item) => item.contains && item.opacity > 0.12 && item.area > 1)
      .sort((a, b) => {
        const aFeature = a.element.classList.contains("FeaturePanel") ? 1 : 0;
        const bFeature = b.element.classList.contains("FeaturePanel") ? 1 : 0;
        if (aFeature !== bFeature) return bFeature - aFeature;
        return b.opacity - a.opacity;
      });

    const target = candidates[0]?.element;
    if (!target) return;

    const project = target.dataset.project ? projects.find((item) => item.title === target.dataset.project) : null;
    if (project) {
      this.openProject(project);
      return;
    }

    const page = target.dataset.page ? this.pageByNumber.get(target.dataset.page) : null;
    if (page) this.openPageDetail(page);
  }

  onDragStart(event) {
    if (this.isMobile) return;
    if (!this.isEntered || this.DOM.root.classList.contains("is-detail-open") || this.DOM.root.classList.contains("is-contact-open")) return;
    this.dragState = {
      y: event.clientY,
      scrollY: window.scrollY,
      active: false,
    };
  }

  onDragMove(event) {
    if (this.isMobile) return;
    if (!this.dragState) return;
    const delta = this.dragState.y - event.clientY;
    if (Math.abs(delta) > 8) this.dragState.active = true;
    if (!this.dragState.active) return;
    window.scrollTo(0, this.dragState.scrollY + delta * 3.4);
  }

  onDragEnd() {
    if (!this.dragState) return;
    this.swallowNextClick = this.dragState.active;
    this.dragState = null;
  }

  resetBottomPushIntent(scope = "detail") {
    if (scope === "home") {
      this.homeBottomReadyAt = 0;
      this.homeBottomIntent = 0;
      this.homeBottomIntentAt = 0;
      return;
    }

    this.detailBottomReadyAt = 0;
    this.detailBottomIntent = 0;
    this.detailBottomIntentAt = 0;
  }

  isStrongBottomPush(scope, deltaY) {
    const now = Date.now();
    const readyKey = scope === "home" ? "homeBottomReadyAt" : "detailBottomReadyAt";
    const intentKey = scope === "home" ? "homeBottomIntent" : "detailBottomIntent";
    const intentAtKey = scope === "home" ? "homeBottomIntentAt" : "detailBottomIntentAt";

    if (!this[readyKey]) {
      this[readyKey] = now + 320;
      this[intentKey] = 0;
      this[intentAtKey] = 0;
      return false;
    }

    if (now < this[readyKey]) return false;
    if (now - this[intentAtKey] > 820) this[intentKey] = 0;

    this[intentKey] += Math.min(Math.abs(deltaY), 500);
    this[intentAtKey] = now;

    return Math.abs(deltaY) >= 540 || this[intentKey] >= 760;
  }

  onPageWheel(event) {
    if (this.isMobile) return;
    if (!this.isEntered || this.DOM.root.classList.contains("is-detail-open") || this.DOM.root.classList.contains("is-contact-open")) return;

    const maxScroll = this.getMaxScroll();
    const threshold = Math.max(24, window.innerHeight * 0.015);
    const reachedBottom = window.scrollY >= maxScroll - threshold;

    if (!reachedBottom) {
      this.bottomProjectOpened = false;
      this.resetBottomPushIntent("home");
      return;
    }

    if (event.deltaY <= 0 || this.bottomProjectOpened) return;
    if (this.isStrongBottomPush("home", event.deltaY)) this.openBottomProject();
  }

  onDetailScroll() {
    if (this.isMobile) return;
    if (!this.DOM.root.classList.contains("is-detail-open")) return;
    if (this.currentDetailProjectIndex < 0) return;
    if (Date.now() < this.detailIgnoreScrollUntil) return;

    const scrollTop = this.DOM.detail.scrollTop;
    this.lastDetailScrollTop = scrollTop;

    const maxScroll = Math.max(1, this.DOM.detail.scrollHeight - this.DOM.detail.clientHeight);
    const threshold = Math.max(32, this.DOM.detail.clientHeight * 0.02);
    const reachedBottom = scrollTop >= maxScroll - threshold;
    const leftBottomZone = scrollTop < maxScroll - threshold * 3;

    if (this.detailSuppressBottomTrigger) {
      if (leftBottomZone) {
        this.detailSuppressBottomTrigger = false;
        this.detailBottomLocked = false;
        this.resetBottomPushIntent("detail");
      }
      return;
    }

    if (scrollTop > threshold * 3 && leftBottomZone) {
      this.detailBottomLocked = false;
      this.resetBottomPushIntent("detail");
    }

    if (reachedBottom && !this.detailBottomReadyAt) this.detailBottomReadyAt = Date.now() + 320;
  }

  onDetailWheel(event) {
    if (this.isMobile) return;
    if (!this.DOM.root.classList.contains("is-detail-open")) return;
    if (this.currentDetailProjectIndex < 0) return;
    if (Date.now() < this.detailIgnoreScrollUntil || this.detailBottomLocked) return;

    const maxScroll = Math.max(1, this.DOM.detail.scrollHeight - this.DOM.detail.clientHeight);
    const threshold = Math.max(32, this.DOM.detail.clientHeight * 0.02);
    if (this.detailSuppressBottomTrigger && event.deltaY > 0) return;
    if (event.deltaY > 0 && this.DOM.detail.scrollTop >= maxScroll - threshold) {
      if (this.isStrongBottomPush("detail", event.deltaY)) this.openNextDetailProject();
    } else if (event.deltaY < 0 && this.DOM.detail.scrollTop <= threshold) {
      this.resetBottomPushIntent("detail");
      this.openPreviousDetailProject();
    } else if (event.deltaY < 0) {
      this.resetBottomPushIntent("detail");
    }
  }

  onPointerMove(event) {
    if (this.isMobile) return;
    this.mouse.x = event.clientX / window.innerWidth;
    this.mouse.y = event.clientY / window.innerHeight;
    GSAP.set(this.DOM.cursor, { autoAlpha: 1 });
    GSAP.set(this.DOM.cursorBorder, { autoAlpha: 1 });
  }

  onCursorOver(event) {
    const target = event.target.closest("[data-cursor], a, button");
    this.DOM.root.classList.remove("cursor-click", "cursor-eye", "cursor-arrow");
    if (!target) return;
    this.DOM.root.classList.add(`cursor-${target.dataset.cursor || "click"}`);
  }

  onCursorOut(event) {
    if (event.target.closest("[data-cursor], a, button")) {
      this.DOM.root.classList.remove("cursor-click", "cursor-eye", "cursor-arrow");
    }
  }

  onKey(event) {
    if (event.key === "Escape") {
      this.closeDetail();
      if (this.DOM.root.classList.contains("is-contact-open")) this.toggleContact();
    }
    if (event.key === "ArrowDown") this.changeProject(1);
    if (event.key === "ArrowUp") this.changeProject(-1);
  }

  updateTargetProgress() {
    if (
      this.isEntered &&
      !this.isLoopingToStart &&
      !this.DOM.root.classList.contains("is-detail-open") &&
      !this.DOM.root.classList.contains("is-contact-open")
    ) {
      const maxScroll = this.getMaxScroll();
      const currentScroll = window.scrollY;
      const scrollDirection = currentScroll - this.lastScrollY;
      const bottomThreshold = Math.max(24, window.innerHeight * 0.015);
      const reachedBottom = currentScroll >= maxScroll - bottomThreshold;

      if (currentScroll < maxScroll - bottomThreshold * 2) {
        this.bottomProjectOpened = false;
        this.resetBottomPushIntent("home");
      }

      if (reachedBottom && scrollDirection > 0 && !this.homeBottomReadyAt) this.homeBottomReadyAt = Date.now() + 320;
    }

    const maxScroll = this.getMaxScroll();
    this.lastScrollY = window.scrollY;
    this.targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  }

  openBottomProject() {
    if (this.bottomProjectOpened) return false;
    const businessProject = projects.find((item) => item.title === "BUSINESS");
    if (!businessProject) return false;
    this.bottomProjectOpened = true;
    this.lastScrollY = window.scrollY;
    this.targetProgress = 1;
    this.openProject(businessProject);
    return true;
  }

  getMaxScroll() {
    const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    return Math.max(1, scrollHeight - window.innerHeight);
  }

  getActivePages() {
    if (this.activeFilter === "all") return portfolioPages;
    return portfolioPages.filter((page) => page.type === this.activeFilter);
  }

  setFilter(filter) {
    this.activeFilter = filter;
    this.activeIndex = 0;
    this.updateFilterState(filter);
    this.jumpToFilter(filter);
    this.updateScene(true);
  }

  updateFilterState(filter) {
    this.activeFilter = filter;
    this.filters.forEach((button) => button.classList.toggle("is-active", button.dataset.filter === filter));
  }

  updateMobileListState() {
    if (!this.isMobile) return;
    this.cards.forEach((card) => {
      const matchesFilter = this.activeFilter === "all" || card.dataset.type === this.activeFilter;
      const isPrimaryLayer = card.dataset.layer === "0";
      card.classList.toggle("is-hidden", !matchesFilter || !isPrimaryLayer);
    });
    this.nearPanels.forEach((panel) => {
      panel.classList.toggle("is-hidden", true);
    });
    this.featurePanels.forEach((panel) => {
      panel.classList.remove("is-hidden");
    });
  }

  getFilterFromProgress(progress) {
    if (progress < 0.52) return "all";
    if (progress < 0.9) return "work";
    return "lab";
  }

  getStageFromProgress(progress) {
    if (progress < 0.16) return { index: "01", title: "ABOUT / PROFILE" };
    if (progress < 0.58) return { index: "02", title: "PORTFOLIO SPACE" };
    if (progress < 0.86) return { index: "03", title: "SELECTED WORKS" };
    return { index: "04", title: "LAB / AIGC VISUAL" };
  }

  syncFilterWithProgress() {
    const nextFilter = this.getFilterFromProgress(this.progress);
    if (nextFilter !== this.activeFilter) this.updateFilterState(nextFilter);
  }

  syncStageMeta() {
    const next = this.getStageFromProgress(Math.max(this.progress, this.targetProgress));
    const label = `${next.index}-${next.title}`;
    if (label === this.currentStageLabel) return;
    this.currentStageLabel = label;
    if (this.DOM.stageMetaIndex) this.DOM.stageMetaIndex.textContent = next.index;
    if (this.DOM.stageMetaTitle) this.DOM.stageMetaTitle.textContent = next.title;
    GSAP.fromTo([this.DOM.stageMetaIndex, this.DOM.stageMetaTitle], { y: 8, autoAlpha: 0.25 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "expo.out" });
  }

  jumpToFilter(filter) {
    const progressByFilter = {
      all: 0.02,
      work: 0.66,
      lab: 0.92,
    };
    const targetProgress = progressByFilter[filter];
    if (targetProgress === undefined) return;
    window.scrollTo({
      top: targetProgress * this.getMaxScroll(),
      behavior: "smooth",
    });
  }

  changeProject(direction) {
    const activePages = this.getActivePages();
    if (!activePages.length) return;
    this.activeIndex = (this.activeIndex + direction + activePages.length) % activePages.length;
    const activePage = activePages[this.activeIndex];
    const target = activePage.index / Math.max(portfolioPages.length - 1, 1);
    window.scrollTo({
      top: target * this.getMaxScroll(),
      behavior: "smooth",
    });
  }

  getCardTransform(metric, focusIndex) {
    const cameraZ = this.progress * 9000;
    const idle = this.sceneTime * metric.floatSpeed + metric.order * 0.37;
    const depth = metric.z + cameraZ + Math.sin(idle * 0.74) * metric.depthRange;
    const drift = Math.sin(this.progress * 8 + metric.order * 0.3 + idle) * metric.floatRange;
    const driftX = Math.cos(idle * 0.82) * metric.floatRange * 0.54;
    const focusBoost = Math.max(0, 1 - Math.abs(metric.page.index - focusIndex) / 2.4);
    const approach = this.clamp((depth + 2600) / 3200);
    const afterPass = this.clamp((2200 - depth) / 1400);
    const brightness = approach * afterPass;
    const scale = metric.scale + focusBoost * 0.2;
    return {
      transform: `translate3d(${metric.xFactor * window.innerWidth + driftX}px, ${
        metric.yFactor * window.innerHeight + drift
      }px, ${depth}px) rotateX(${metric.rx + this.progress * 36 * metric.spin + Math.sin(idle) * 5}deg) rotateY(${
        metric.ry + this.progress * 42 * metric.spin + Math.cos(idle * 0.9) * 6
      }deg) rotateZ(${metric.rz + Math.sin(idle * 0.55) * 3}deg) scale(${scale})`,
      brightness,
      depth,
      focus: brightness > 0.42 || (focusBoost > 0.55 && depth > -900 && depth < 1200),
    };
  }

  clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  getPanelTransform(metric) {
    const nearSuppression = this.clamp((0.5 - this.progress) / 0.18);
    const phase = this.clamp((this.progress - metric.start) / Math.max(metric.end - metric.start, 0.001));
    const eased = phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2;
    const exit = this.clamp((this.progress - metric.end) / 0.16);
    const x = metric.x * (1 - eased) + (metric.x * -0.18) * eased + (metric.index % 2 === 0 ? -560 : 560) * exit;
    const idle = Math.sin(this.sceneTime * 0.9 + metric.index * 1.8);
    const y = metric.y * (1 - eased) + (metric.index % 2 === 0 ? -4 : 6) * eased + (metric.index % 2 === 0 ? -12 : 14) * exit + idle * 2.5;
    const z = metric.zStart * (1 - eased) + metric.zEnd * eased + 1600 * exit + idle * 70;
    const scale = 0.42 + eased * 1.3 + exit * 0.56;
    const approachLight = this.clamp(phase * 1.55) * this.clamp(1 - exit * 1.15);
    const opacity = this.clamp(phase * 3.4) * this.clamp(1 - exit * 1.35) * (1 - nearSuppression * 0.58);
    return {
      approachLight,
      opacity,
      phase,
      exit,
      transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}vh), ${z}px) rotateX(${
        metric.rx * (1 - eased) - 5 * exit
      }deg) rotateY(${metric.ry * (1 - eased) + metric.ry * 0.45 * exit + idle * 1.4}deg) rotateZ(${
        metric.rz * (1 - eased) + metric.rz * 1.15 * exit + idle * 0.8
      }deg) scale(${scale})`,
    };
  }

  getDustTransform(metric) {
    const cameraZ = this.progress * 9800;
    const idle = this.sceneTime * metric.floatSpeed + metric.index * 0.19;
    const z = metric.z + cameraZ + Math.sin(idle) * 120;
    const near = this.clamp((z + 1900) / 2700);
    const opacity = this.clamp((z + 7600) / 3000) * this.clamp((2200 - z) / 1600) * (0.18 + near * 0.72);
    const x = metric.xFactor * window.innerWidth + Math.sin(idle * 0.7) * 35 + (this.mouse.x - 0.5) * 70;
    const y = metric.yFactor * window.innerHeight + Math.cos(idle * 0.8) * 28 + (this.mouse.y - 0.5) * 48;
    return {
      opacity,
      z,
      transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateZ(${
        metric.rotate + this.sceneTime * 42 * metric.spin
      }deg) rotateY(${this.progress * 120 + metric.index * 3}deg) scale(${metric.scale + near * 0.95})`,
    };
  }

  getNearTransform(metric) {
    const timeline = Math.max(this.progress, this.targetProgress);
    const intro = this.clamp((this.progress - 0.55) / 0.1);
    const pass = this.clamp((this.progress - 0.58) / 0.18);
    const exit = this.clamp((timeline - 0.76) / 0.08);
    const idle = this.sceneTime * 0.28 + metric.index;
    const depth = metric.z + pass * 6100 + Math.sin(idle) * 95;
    const tunnelCurve = Math.sin(metric.angle + pass * 5.2);
    const x = metric.x * (1 - pass * 0.55) + tunnelCurve * 360 + (this.mouse.x - 0.5) * 120;
    const y = metric.y * (1 - pass * 0.42) + Math.cos(metric.angle + pass * 3.4) * 210 + (this.mouse.y - 0.5) * 90;
    const nearBoost = this.clamp((depth + 900) / 1900);
    const opacity = this.clamp(intro * 2.5) * this.clamp(1 - exit * 2.2) * this.clamp((2800 - depth) / 1300);
    return {
      opacity,
      depth,
      transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${depth}px) rotateX(${
        metric.rx + pass * 22 - exit * 35
      }deg) rotateY(${metric.ry - tunnelCurve * 58 + pass * metric.side * 38}deg) rotateZ(${
        metric.rz + pass * 52 * metric.side
      }deg) scale(${metric.scale + nearBoost * 1.65})`,
      active: opacity > 0.18 && depth > -1300 && depth < 1700,
    };
  }

  getSceneRanges() {
    return {
      visibleRange: this.isMobile ? 1.6 : 2.2,
      preloadRange: this.isMobile ? 2.2 : 3,
      dustDepthRange: this.isMobile ? 4300 : 5600,
    };
  }

  shouldUpdateByOpacity(metric, opacity, force = false) {
    const visible = opacity >= 0.01;
    if (!force && !visible && !metric.wasVisible) return false;
    metric.wasVisible = visible;
    return true;
  }

  setVisibilityClass(element, isVisible) {
    element.classList.toggle("is-visible", Boolean(isVisible));
  }

  updateScene(force = false) {
    this.updateTargetProgress();
    this.progress = force ? this.targetProgress : this.progress + (this.targetProgress - this.progress) * 0.15;
    const progressDelta = Math.abs(this.progress - this.lastProgress);
    const mouseDelta = Math.abs(this.mouse.x - this.lastMouseX) + Math.abs(this.mouse.y - this.lastMouseY);
    const timeDelta = Math.abs(this.sceneTime - this.lastSceneTime);
    if (!force && progressDelta < 0.0008 && mouseDelta < 0.002 && timeDelta < 0.032) return;
    this.lastProgress = this.progress;
    this.lastMouseX = this.mouse.x;
    this.lastMouseY = this.mouse.y;
    this.lastSceneTime = this.sceneTime;
    const focusIndex = Math.round(this.progress * (portfolioPages.length - 1));
    const ranges = this.getSceneRanges();
    const tiltX = (this.mouse.y - 0.5) * -6;
    const tiltY = (this.mouse.x - 0.5) * 8;

    if (this.DOM.spaceCamera) {
      const cameraTransform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      if (force || cameraTransform !== this.lastCameraTransform) {
        this.DOM.spaceCamera.style.transform = cameraTransform;
        this.lastCameraTransform = cameraTransform;
      }
    }
    this.DOM.root.style.setProperty("--title-x", `${tiltX * 0.8}deg`);
    this.DOM.root.style.setProperty("--title-y", `${tiltY * 0.8}deg`);
    this.DOM.root.style.setProperty("--scene-progress", `${Math.max(this.progress, this.targetProgress)}`);
    if (this.DOM.scrollProgress) {
      this.DOM.scrollProgress.style.transform = `scaleX(${Math.max(this.progress, this.targetProgress)})`;
    }
    const visibleProgress = Math.max(this.progress, this.targetProgress);
    const titleIntro = this.clamp((visibleProgress - 0.035) / 0.055);
    const titleExit = this.clamp((visibleProgress - 0.58) / 0.12);
    const centerOpacity = titleIntro * this.clamp(1 - titleExit) * 0.95;
    this.DOM.root.style.setProperty("--center-opacity", `${centerOpacity}`);
    if (this.DOM.centerTitle) {
      this.DOM.centerTitle.style.opacity = centerOpacity;
      this.DOM.centerTitle.style.visibility = centerOpacity > 0.01 ? "visible" : "hidden";
    }
    this.syncFilterWithProgress();
    this.syncStageMeta();

    if (this.DOM.aboutSheet) {
      const aboutSheetIntro = this.clamp((this.progress - 0.055) / 0.055);
      const aboutSheetTravel = this.clamp((this.progress - 0.055) / 0.36);
      const aboutSheetExit = this.clamp((this.progress - 0.48) / 0.08);
      const aboutSheetOpacity = aboutSheetIntro * this.clamp(1 - aboutSheetExit * 1.1);
      this.DOM.aboutSheet.style.opacity = aboutSheetOpacity;
      this.DOM.aboutSheet.style.visibility = aboutSheetOpacity > 0.01 ? "visible" : "hidden";
      this.DOM.aboutSheet.style.transform = `translate3d(-50%, ${112 - aboutSheetTravel * 142 - aboutSheetExit * 18}vh, ${
        120 + aboutSheetExit * 1100
      }px) rotateX(${aboutSheetExit * 18}deg) rotateZ(${-3 + this.progress * 4 + aboutSheetExit * 8}deg)`;
    }
    if (this.DOM.aboutWord) {
      const aboutPhase = this.clamp((this.progress - 0.045) / 0.2);
      const aboutExit = this.clamp((this.progress - 0.24) / 0.13);
      const aboutOpacity = this.clamp(aboutPhase * 2.4) * this.clamp(1 - aboutExit * 1.7);
      const aboutIdle = Math.sin(this.sceneTime * 0.8) * 2;
      this.DOM.aboutWord.style.opacity = aboutOpacity;
      this.DOM.aboutWord.style.transform = `translate3d(-50%, calc(-50% + ${44 - aboutPhase * 42 - aboutExit * 20}vh), ${
        -1400 + aboutPhase * 2200 + aboutExit * 900
      }px) rotateX(${10 - aboutPhase * 14 + aboutIdle}deg) rotateY(${22 - aboutPhase * 18}deg) rotateZ(${
        18 - aboutPhase * 28 - aboutIdle
      }deg)`;
    }
    if (this.DOM.worksSheet) {
      this.DOM.worksSheet.style.transform = `translate3d(-50%, ${150 - this.progress * 155}vh, 90px) rotateZ(${
        4 - this.progress * 5
      }deg)`;
    }
    if (this.DOM.workWord) {
      const workPhase = this.clamp((this.progress - 0.62) / 0.12);
      const workExit = this.clamp((this.progress - 0.78) / 0.08);
      const workOpacity = this.clamp(workPhase * 2) * this.clamp(1 - workExit * 2.2);
      const workIdle = Math.sin(this.sceneTime * 0.72) * 2.5;
      this.DOM.workWord.style.opacity = workExit > 0.96 ? 0 : workOpacity;
      this.DOM.workWord.style.transform = `translate3d(-50%, calc(-50% + ${47 - workPhase * 36 - workExit * 38}vh), ${
        -1800 + workPhase * 2500 + workExit * 1150
      }px) rotateX(${8 - workPhase * 8 + workIdle}deg) rotateY(${-28 + workPhase * 16}deg) rotateZ(${
        -24 + workPhase * 37 + workExit * 22 - workIdle
      }deg)`;
    }
    if (this.DOM.labWord) {
      const labPhase = this.clamp((this.progress - 0.94) / 0.06);
      const labExit = this.clamp((this.progress - 0.86) / 0.12);
      const labOpacity = this.clamp(labPhase * 2.2) * this.clamp(1 - labExit * 1.6);
      const labIdle = Math.sin(this.sceneTime * 0.82) * 3;
      this.DOM.labWord.style.opacity = labOpacity;
      this.DOM.labWord.style.transform = `translate3d(-50%, calc(-50% + ${28 - labPhase * 44 - labExit * 24}vh), ${
        -1600 + labPhase * 2500 + labExit * 850
      }px) rotateX(${14 - labPhase * 18 + labIdle}deg) rotateY(${32 - labPhase * 30}deg) rotateZ(${
        20 - labPhase * 42 + labExit * 12 - labIdle
      }deg)`;
    }

    this.cardMetrics.forEach((metric) => {
      const { card, page } = metric;
      const pageDistance = Math.abs(page.index - focusIndex);
      const inPreloadRange = pageDistance <= ranges.preloadRange;
      if (!force && !inPreloadRange && !metric.wasInPreloadRange) {
        this.setVisibilityClass(card, false);
        return;
      }
      const isShown = this.activeFilter === "all" || page.type === this.activeFilter;
      const next = this.getCardTransform(metric, focusIndex);
      const shownOpacity = 0.18 + next.brightness * 0.82;
      const hiddenOpacity = 0.04 + next.brightness * 0.14;
      const cardOpacity = isShown ? shownOpacity : hiddenOpacity;
      const isVisible = inPreloadRange && cardOpacity > 0.01 && Math.abs(next.depth) < 3600;
      card.style.transform = next.transform;
      card.style.opacity = cardOpacity;
      card.style.filter = `brightness(${0.72 + next.brightness * 0.62}) saturate(${
        0.86 + next.brightness * 0.28
      }) contrast(${0.96 + next.brightness * 0.12})`;
      card.classList.toggle("is-focus", next.focus);
      card.classList.toggle("is-hidden", !isShown);
      this.setVisibilityClass(card, isVisible);
      metric.wasInPreloadRange = inPreloadRange;
    });

    this.dustMetrics.forEach((metric) => {
      const next = this.getDustTransform(metric);
      if (!this.shouldUpdateByOpacity(metric, next.opacity, force)) return;
      metric.dot.style.transform = next.transform;
      metric.dot.style.opacity = next.opacity;
      this.setVisibilityClass(metric.dot, next.opacity > 0.01 && Math.abs(next.z) < ranges.dustDepthRange);
    });

    this.nearMetrics.forEach((metric) => {
      const isShown = this.activeFilter === "all" || metric.page?.type === this.activeFilter;
      const next = this.getNearTransform(metric);
      const panelOpacity = isShown ? next.opacity : next.opacity * 0.1;
      if (!this.shouldUpdateByOpacity(metric, panelOpacity, force)) return;
      metric.panel.style.transform = next.transform;
      metric.panel.style.opacity = panelOpacity;
      metric.panel.style.pointerEvents = next.active && isShown ? "all" : "none";
      this.setVisibilityClass(metric.panel, panelOpacity > 0.01 && Math.abs(next.depth) < 2400);
    });

    this.panelMetrics.forEach((metric) => {
      const next = this.getPanelTransform(metric);
      const matchesFilter = this.activeFilter === "all" || metric.project?.type === this.activeFilter;
      const inOwnPass = next.approachLight > 0.08;
      const isShown = matchesFilter || inOwnPass;
      const panelOpacity = isShown ? next.opacity : next.opacity * 0.08;
      if (!this.shouldUpdateByOpacity(metric, panelOpacity, force)) return;
      const panelLight = next.approachLight;
      metric.panel.style.transform = next.transform;
      metric.panel.style.opacity = panelOpacity;
      metric.panel.style.filter = `brightness(${0.78 + panelLight * 0.56}) saturate(${
        0.88 + panelLight * 0.22
      }) contrast(${0.96 + panelLight * 0.12})`;
      metric.panel.style.setProperty("--panel-image-brightness", `${0.82 + panelLight * 0.36}`);
      metric.panel.style.setProperty("--panel-image-saturation", `${0.88 + panelLight * 0.2}`);
      metric.panel.style.pointerEvents = next.opacity > 0.35 && isShown ? "all" : "none";
      this.setVisibilityClass(metric.panel, panelOpacity > 0.01);
    });
  }

  getGalleryImages(project) {
    const customImages = project.customImages || [];
    const extraImages = project.extraImages || [];
    return [
      ...customImages.map((image) => ({
        ...image,
        fitFull: true,
        preserveFrame: true,
      })),
      ...extraImages.map((src) => ({ src, title: "个人简历", size: "xlarge" })),
      ...(customImages.length ? [] : project.pages.map((number, index) => {
        const page = this.pageByNumber.get(number);
        return {
          src: page.src,
          number: page.number,
          pageNumber: page.number,
          chapter: page.chapter,
          title: page.title,
          size: index === 0 ? "xlarge" : "large",
          preserveFrame: project.title === "BUSINESS" && index === 0,
          fitFull: project.title === "BUSINESS" && ["05", "06", "07", "08", "09"].includes(page.number),
        };
      })),
    ];
  }

  getGalleryImageSizes(image = {}) {
    if (image.size === "brand-cover" || image.size === "brand-long") return "(max-width: 768px) 92vw, 86vw";
    if (image.size === "ip-cover" || image.size === "other-cover") return "(max-width: 768px) 92vw, 82vw";
    if (image.size === "ip-pair" || image.size === "other-pair") return "(max-width: 768px) 46vw, 44vw";
    if (image.fitFull || image.preserveFrame || image.size === "xlarge") return "(max-width: 768px) 100vw, 92vw";
    if (image.size === "large") return "(max-width: 768px) 100vw, 46vw";
    return "(max-width: 768px) 100vw, 24vw";
  }

  renderGalleryItem(image, index = 0, project) {
    const loading = index === 0 ? "eager" : "lazy";
    const fetchPriority = index === 0 ? "high" : undefined;
    const imageHTML = createOptimizedImageHTML(image.src, image.alt || image.title || project.title, {
      loading,
      fetchPriority,
      sizes: this.getGalleryImageSizes(image),
    });
    return `
      <figure class="GalleryItem ${image.size}${image.preserveFrame ? " is-preserve" : ""}${image.fitFull ? " is-fit-full" : ""}">
        ${imageHTML}
      </figure>
    `;
  }

  getGalleryPlan(project, selectedPage = null) {
    const images = this.getGalleryImages(project);
    const items = [];
    let shell = "";
    let itemIndex = 0;

    const pushItem = (image, target = "root", before = null) => {
      items.push({
        image,
        target,
        before,
        index: itemIndex,
      });
      itemIndex += 1;
    };

    if (selectedPage && !project.customImages) {
      pushItem({
        src: selectedPage.src,
        title: selectedPage.title,
        size: "xlarge",
        preserveFrame: false,
        fitFull: false,
      });
    }

    if (project.title === "BRAND") {
      shell = `<div class="GalleryBrand" data-gallery-target="brand"></div>`;
      images.forEach((image) => pushItem(image, "[data-gallery-target='brand']"));
      return { shell, items };
    }

    if (project.title === "IP DESIGN" || project.title === "AIGC VISUAL") {
      const [cover, ...pairs] = images;
      shell = `
        <div class="GalleryIP${project.title === "AIGC VISUAL" ? " GalleryOther" : ""}" data-gallery-target="ip">
          <div class="GalleryPairGrid GalleryPairGrid--ip" data-gallery-target="pairs"></div>
        </div>
      `;
      if (cover) pushItem(cover, "[data-gallery-target='ip']", "[data-gallery-target='pairs']");
      pairs.forEach((image) => pushItem(image, "[data-gallery-target='pairs']"));
      return { shell, items };
    }

    if (project.title === "BUSINESS") {
      const imageByNumber = new Map(images.map((image) => [image.pageNumber, image]));
      const cover = imageByNumber.get("04");
      if (this.isMobile) {
        const mobileSequence = ["05", "06", "07", "09", "08"].map((number) => imageByNumber.get(number)).filter(Boolean);
        if (cover) pushItem(cover);
        mobileSequence.forEach((image) => pushItem(image));
        return { shell, items };
      }

      const leftColumn = ["05", "07"].map((number) => imageByNumber.get(number)).filter(Boolean);
      const rightColumn = ["06", "09", "08"].map((number) => imageByNumber.get(number)).filter(Boolean);

      shell = `
        <div class="GalleryColumns GalleryColumns--business">
          <div class="GalleryColumn" data-gallery-target="business-left"></div>
          <div class="GalleryColumn" data-gallery-target="business-right"></div>
        </div>
      `;
      if (cover) pushItem(cover, "root", ".GalleryColumns--business");
      leftColumn.forEach((image) => pushItem(image, "[data-gallery-target='business-left']"));
      rightColumn.forEach((image) => pushItem(image, "[data-gallery-target='business-right']"));
      return { shell, items };
    }

    images.forEach((image) => pushItem(image));
    return { shell, items };
  }

  cancelGalleryAppend() {
    this.galleryAppendToken += 1;
    if (this.galleryIdleHandle && window.cancelIdleCallback) window.cancelIdleCallback(this.galleryIdleHandle);
    if (this.galleryTimeoutHandle) window.clearTimeout(this.galleryTimeoutHandle);
    this.galleryIdleHandle = null;
    this.galleryTimeoutHandle = null;
  }

  createNodesFromHTML(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return [...template.content.childNodes];
  }

  appendGalleryItem(item, project) {
    const target = item.target === "root" ? this.DOM.detailGallery : this.DOM.detailGallery.querySelector(item.target);
    if (!target) return [];
    const nodes = this.createNodesFromHTML(this.renderGalleryItem(item.image, item.index, project));
    const before = item.before ? this.DOM.detailGallery.querySelector(item.before) : null;
    nodes.forEach((node) => {
      if (before && target.contains(before)) {
        target.insertBefore(node, before);
      } else {
        target.appendChild(node);
      }
    });
    return nodes.filter((node) => node.nodeType === 1);
  }

  scheduleGalleryAppend(project, items, startIndex, token) {
    if (startIndex >= items.length) return;
    const run = () => {
      if (token !== this.galleryAppendToken || !this.DOM.root.classList.contains("is-detail-open")) return;
      this.galleryIdleHandle = null;
      this.galleryTimeoutHandle = null;
      const batchSize = this.isMobile ? 2 : 3;
      const batch = items.slice(startIndex, startIndex + batchSize);
      const appended = batch.flatMap((item) => this.appendGalleryItem(item, project));
      this.revealGalleryItems(appended, startIndex);
      this.scheduleGalleryAppend(project, items, startIndex + batch.length, token);
    };

    if (window.requestIdleCallback) {
      this.galleryIdleHandle = window.requestIdleCallback(run, { timeout: 260 });
    } else {
      this.galleryTimeoutHandle = window.setTimeout(run, 80);
    }
  }

  setDetailGallery(project, selectedPage = null) {
    this.cancelGalleryAppend();
    const token = this.galleryAppendToken;
    const { shell, items } = this.getGalleryPlan(project, selectedPage);
    this.DOM.detailGallery.innerHTML = shell;
    const firstBatchSize = Math.min(1, items.length);
    items.slice(0, firstBatchSize).forEach((item) => this.appendGalleryItem(item, project));
    this.scheduleGalleryAppend(project, items, firstBatchSize, token);
  }

  setDetailHero({ title, summary, image, indexLabel, project }) {
    this.DOM.detailTitle.textContent = title;
    this.DOM.detailSummary.textContent = summary;
    if (this.DOM.detailIndex) this.DOM.detailIndex.textContent = indexLabel;
    if (this.DOM.detailPreviewImage) {
      const preview = this.DOM.detailPreviewImage.closest(".DetailPreview");
      if (preview) {
        preview.innerHTML = createOptimizedImageHTML(image, "", {
          className: "DetailPreview__image",
          loading: "lazy",
          sizes: "(max-width: 768px) 88vw, 58vw",
          maxWidth: 1920,
          useStageFallback: true,
        });
        this.DOM.detailPreviewImage = preview.querySelector(".DetailPreview__image");
      } else {
        const stageImage = getStageImage(image);
        this.DOM.detailPreviewImage.src = stageImage.src;
      }
    }
    if (this.DOM.detailToplineCurrent) this.DOM.detailToplineCurrent.textContent = indexLabel || "01";
    if (this.DOM.detailNextCueTitle) {
      const nextTitle = this.getNextProjectTitle(project);
      this.DOM.detailNextCueTitle.textContent = nextTitle ? `NEXT / ${nextTitle}` : "END / BACK TO SPACE";
    }
    const hasCopy = Boolean(title || summary || indexLabel);
    this.DOM.detailHero?.classList.toggle("is-image-only", !hasCopy);
  }

  getNextProjectTitle(project) {
    if (!project) return "";
    const index = this.detailProjectSequence.indexOf(project.title);
    const nextTitle = this.detailProjectSequence[index + 1];
    const nextProject = projects.find((item) => item.title === nextTitle);
    return nextProject?.titleZh || nextProject?.title || "";
  }

  openProject(project) {
    this.currentDetailProjectIndex = this.detailProjectSequence.indexOf(project.title);
    this.detailSuppressBottomTrigger = false;
    this.resetBottomPushIntent("detail");
    if (!this.isMobile) this.lockDetailBottomBriefly();
    this.DOM.root.classList.add("is-detail-open");
    this.DOM.detail.classList.add("is-gallery-only");
    this.DOM.detail.setAttribute("aria-hidden", "false");
    const projectIndex = Math.max(0, projects.findIndex((item) => item.title === project.title));
    this.setDetailHero({
      title: "",
      summary: "",
      image: project.image,
      indexLabel: "",
      project,
    });
    this.setDetailGallery(project);
    this.DOM.detail.scrollTo({ top: 0, behavior: "instant" });
    this.lastDetailScrollTop = 0;
    this.revealDetailHero();
    this.revealGallery();
  }

  openPageDetail(page) {
    if (!page) return;
    const project = projects.find((item) => item.title !== "ALL PAGES" && item.pages.includes(page.number)) || projects[0];
    this.currentDetailProjectIndex = this.detailProjectSequence.indexOf(project.title);
    this.detailSuppressBottomTrigger = false;
    this.resetBottomPushIntent("detail");
    if (!this.isMobile) this.lockDetailBottomBriefly();
    this.DOM.root.classList.add("is-detail-open");
    this.DOM.detail.classList.add("is-gallery-only");
    this.DOM.detail.setAttribute("aria-hidden", "false");
    this.setDetailHero({
      title: "",
      summary: "",
      image: page.src,
      indexLabel: "",
      project,
    });
    this.setDetailGallery(project, page);
    this.DOM.detail.scrollTo({ top: 0, behavior: "instant" });
    this.lastDetailScrollTop = 0;
    this.revealDetailHero();
    this.revealGallery();
  }

  openNextDetailProject() {
    if (this.isMobile) return;
    const nextProjectTitle = this.detailProjectSequence[this.currentDetailProjectIndex + 1];
    if (!nextProjectTitle) return;

    const nextProject = projects.find((item) => item.title === nextProjectTitle);
    if (!nextProject) return;

    this.detailBottomLocked = true;
    this.resetBottomPushIntent("detail");
    GSAP.to(this.DOM.detail, {
      autoAlpha: 0.2,
      duration: 0.28,
      ease: "expo.inOut",
      onComplete: () => {
        this.openProject(nextProject);
        GSAP.fromTo(this.DOM.detail, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.5, ease: "expo.out" });
      },
    });
  }

  openPreviousDetailProject() {
    if (this.isMobile) return;
    const previousProjectTitle = this.detailProjectSequence[this.currentDetailProjectIndex - 1];
    if (!previousProjectTitle) return;

    const previousProject = projects.find((item) => item.title === previousProjectTitle);
    if (!previousProject) return;

    this.detailBottomLocked = true;
    this.resetBottomPushIntent("detail");
    GSAP.to(this.DOM.detail, {
      autoAlpha: 0.2,
      duration: 0.28,
      ease: "expo.inOut",
      onComplete: () => {
        this.openProject(previousProject);
        this.DOM.detail.scrollTo({
          top: Math.max(0, this.DOM.detail.scrollHeight - this.DOM.detail.clientHeight),
          behavior: "instant",
        });
        this.lastDetailScrollTop = this.DOM.detail.scrollTop;
        this.detailSuppressBottomTrigger = true;
        GSAP.fromTo(this.DOM.detail, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.5, ease: "expo.out" });
      },
    });
  }

  lockDetailBottomBriefly() {
    if (this.isMobile) return;
    this.detailBottomLocked = true;
    this.detailIgnoreScrollUntil = Date.now() + 1100;
    if (this.DOM.detail) this.DOM.detail.style.overflowY = "hidden";
    window.clearTimeout(this.detailBottomUnlockTimer);
    this.detailBottomUnlockTimer = window.setTimeout(() => {
      this.detailBottomLocked = false;
      if (this.DOM.detail) this.DOM.detail.style.overflowY = "";
    }, 1100);
  }

  closeDetail() {
    if (!this.DOM?.root) return;
    this.DOM.root.classList.remove("is-detail-open");
    this.DOM.detail?.classList.remove("is-gallery-only");
    this.DOM.detail?.setAttribute("aria-hidden", "true");
    this.currentDetailProjectIndex = -1;
    this.detailBottomLocked = false;
    this.detailSuppressBottomTrigger = false;
    this.detailIgnoreScrollUntil = 0;
    this.lastDetailScrollTop = 0;
    this.resetBottomPushIntent("detail");
    if (this.DOM.detail) this.DOM.detail.style.overflowY = "";
    this.cancelGalleryAppend();
    window.clearTimeout(this.detailBottomUnlockTimer);
    if (this.isMobile) {
      window.scrollTo({ top: 0, behavior: "auto" });
      this.updateScene(true);
    }
  }

  revealGallery() {
    const items = [...this.DOM.detailGallery.querySelectorAll(".GalleryItem")];
    const intro = this.DOM.detailGallery.querySelector(".GalleryIntro");
    if (this.isMobile) {
      if (intro) {
        GSAP.fromTo(intro, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power1.out" });
      }
      this.revealGalleryItems(items, 0);
      return;
    }

    if (intro) {
      GSAP.fromTo(intro, { autoAlpha: 0, y: 44 }, { autoAlpha: 1, y: 0, duration: 0.85, ease: "expo.out" });
    }
    this.revealGalleryItems(items, 0);
  }

  revealGalleryItems(items, offset = 0) {
    if (!items.length) return;
    if (this.isMobile) {
      items.forEach((item) => {
        GSAP.set(item, { "--reveal": "105%" });
        const image = item.querySelector("img");
        if (image) GSAP.set(image, { clearProps: "transform" });
      });
      GSAP.fromTo(items, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.025, ease: "power1.out" });
      return;
    }

    items.forEach((item, index) => {
      const sequenceIndex = offset + index;
      GSAP.set(item, { "--reveal": "0%" });
      GSAP.to(item, { "--reveal": "105%", duration: 1.05, delay: Math.min(sequenceIndex, 8) * 0.055 + 0.12, ease: "expo.inOut" });
      GSAP.fromTo(item.querySelector("img"), { scale: 0.94 }, { scale: 1, duration: 1, delay: Math.min(sequenceIndex, 8) * 0.04, ease: "expo.out" });
    });
  }

  revealDetailHero() {
    if (this.isMobile) {
      GSAP.killTweensOf(this.DOM.detail);
      GSAP.fromTo(this.DOM.detail, { autoAlpha: 0.68, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.34, ease: "power2.out" });
      if (this.DOM.detailNextCue) {
        GSAP.fromTo(this.DOM.detailNextCue, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.32, delay: 0.18, ease: "power2.out" });
      }
      return;
    }
    GSAP.killTweensOf([this.DOM.detailHero, this.DOM.detailPreview, this.DOM.detailTitle, this.DOM.detailSummary, this.DOM.detailIndex]);
    GSAP.set(this.DOM.detailHero, { "--detail-wipe": "0%" });
    GSAP.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(this.DOM.detailPreview, { autoAlpha: 0, y: 90, rotateZ: -10, scale: 0.72 }, { autoAlpha: 1, y: 0, rotateZ: -4, scale: 1, duration: 1.15 })
      .fromTo(this.DOM.detailTitle, { autoAlpha: 0, yPercent: 70, rotateZ: 4 }, { autoAlpha: 1, yPercent: 0, rotateZ: 0, duration: 1.05 }, "-=0.78")
      .fromTo(this.DOM.detailSummary, { autoAlpha: 0, y: 38 }, { autoAlpha: 1, y: 0, duration: 0.85 }, "-=0.62")
      .fromTo(this.DOM.detailIndex, { autoAlpha: 0, y: -22 }, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.72")
      .to(this.DOM.detailHero, { "--detail-wipe": "105%", duration: 0.9, ease: "expo.inOut" }, "-=0.74");
    if (this.DOM.detailNextCue) {
      GSAP.fromTo(this.DOM.detailNextCue, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.75, delay: 0.75, ease: "expo.out" });
    }
  }

  toggleContact() {
    const next = !this.DOM.root.classList.contains("is-contact-open");
    this.DOM.root.classList.toggle("is-contact-open", next);
    this.DOM.contactPanel.setAttribute("aria-hidden", String(!next));
    if (!next) return;
    const contactParts = [
      ".ContactRing",
      ".ContactTitle h2",
      ".ContactTitle p",
      ".ContactLinks ul",
      ".ContactFoot p",
    ];
    GSAP.killTweensOf(contactParts);
    GSAP.timeline({ defaults: { ease: "expo.out" } })
      .fromTo(".ContactRing", { autoAlpha: 0, scale: 0.82, rotate: -18 }, { autoAlpha: 0.11, scale: 1, rotate: 0, duration: 1.2 })
      .fromTo(".ContactTitle h2", { autoAlpha: 0, yPercent: 80, rotateZ: 4 }, { autoAlpha: 1, yPercent: 0, rotateZ: 0, duration: 1.05 }, "-=0.78")
      .fromTo(".ContactTitle p", { autoAlpha: 0, y: 42 }, { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.62")
      .fromTo(".ContactLinks ul", { autoAlpha: 0, y: 38 }, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.08 }, "-=0.52")
      .fromTo(".ContactFoot p", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.42");
  }

  TIME() {
    if (!this.DOM?.root) return;
    if (document.visibilityState === "hidden") return;
    if (this.isMobile) {
      this.sceneTime += 0.016;
      this.mobileFrame = (this.mobileFrame + 1) % 2;
      if (
        this.mobileFrame === 0 &&
        this.isEntered &&
        !this.DOM.root.classList.contains("is-detail-open") &&
        !this.DOM.root.classList.contains("is-contact-open")
      ) {
        this.updateScene(false);
      }
      return;
    }
    this.sceneTime += 0.016;
    if (this.isEntered && !this.DOM.root.classList.contains("is-detail-open") && !this.DOM.root.classList.contains("is-contact-open")) {
      const maxScroll = this.getMaxScroll();
      const bottomThreshold = Math.max(24, window.innerHeight * 0.015);
      if (window.scrollY < maxScroll - bottomThreshold * 2) {
        this.bottomProjectOpened = false;
        this.resetBottomPushIntent("home");
      } else if (window.scrollY >= maxScroll - bottomThreshold && !this.homeBottomReadyAt) {
        this.homeBottomReadyAt = Date.now() + 450;
      }
      this.updateScene(false);
    }
    this.cursor.x += (this.mouse.x * window.innerWidth - this.cursor.x) * 0.22;
    this.cursor.y += (this.mouse.y * window.innerHeight - this.cursor.y) * 0.22;
    this.border.x += (this.mouse.x * window.innerWidth - this.border.x) * 0.12;
    this.border.y += (this.mouse.y * window.innerHeight - this.border.y) * 0.12;
    if (this.DOM.cursor) GSAP.set(this.DOM.cursor, { x: this.cursor.x - 50, y: this.cursor.y - 50 });
    if (this.DOM.cursorBorder) GSAP.set(this.DOM.cursorBorder, { x: this.border.x - 16, y: this.border.y - 16 });
  }

  SIZES() {
    if (this.syncViewportMode()) return;
    if (this.isMobile) {
      this.updateScene(true);
      return;
    }
    this.updateScene(true);
  }
}
