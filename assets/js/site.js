(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIntersectionObserver = "IntersectionObserver" in window;
  var assetsBase = document.currentScript ? new URL("../", document.currentScript.src).href : "assets/";
  var smoothScrollInstance = null;

  function deferWork(callback) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 700 });
      return;
    }

    window.setTimeout(callback, 120);
  }

  function loadVendorScript(filename, callback) {
    var src = assetsBase + "vendor/" + filename;
    var existing = document.querySelector("script[src='" + src + "']");

    if (existing) {
      existing.addEventListener("load", callback, { once: true });
      return;
    }

    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = callback;
    document.head.appendChild(script);
  }

  function setupSmoothScroll() {
    if (reduceMotion || !("requestAnimationFrame" in window) || smoothScrollInstance) {
      return;
    }

    function initSmoothScroll() {
      if (!window.Lenis || smoothScrollInstance) {
        return;
      }

      smoothScrollInstance = new window.Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.86,
        touchMultiplier: 1,
        smoothWheel: true,
        syncTouch: false,
        anchors: false,
        prevent: function (node) {
          return Boolean(node.closest(".mobile-nav-drawer, [data-lenis-prevent]"));
        }
      });

      window.__yzcLenis = smoothScrollInstance;

      if (document.body.classList.contains("nav-drawer-open")) {
        smoothScrollInstance.stop();
      }

      function raf(time) {
        smoothScrollInstance.raf(time);
        window.requestAnimationFrame(raf);
      }

      window.requestAnimationFrame(raf);
    }

    if (window.Lenis) {
      initSmoothScroll();
      return;
    }

    loadVendorScript("lenis.min.js", initSmoothScroll);
  }

  function setupNavigation() {
    var header = document.querySelector(".site-header");
    var nav = header ? header.querySelector(".nav") : null;
    var navLinks = nav ? nav.querySelector(".nav-links") : null;

    if (!header || !nav || !navLinks) {
      return;
    }

    function normalizePath(pathname) {
      return pathname.replace(/\/index\.html$/, "/");
    }

    var currentPath = normalizePath(window.location.pathname);
    var isProjectPage = currentPath.indexOf("/projects/") !== -1;
    var isResumePage = /\/resume\.html$/.test(window.location.pathname);

    navLinks.querySelectorAll("a").forEach(function (link) {
      var hrefPath = normalizePath(new URL(link.getAttribute("href"), window.location.href).pathname);
      var isActive = (isProjectPage && hrefPath.indexOf("/projects/") !== -1) ||
        (isResumePage && /\/resume\.html$/.test(hrefPath));

      link.classList.toggle("active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    var menuButton = document.createElement("button");
    menuButton.className = "nav-menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "打开菜单");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "mobile-nav-drawer");
    menuButton.innerHTML = "<span aria-hidden=\"true\"></span>";
    nav.appendChild(menuButton);

    var backdrop = document.createElement("div");
    backdrop.className = "mobile-nav-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    var drawer = document.createElement("aside");
    drawer.className = "mobile-nav-drawer";
    drawer.id = "mobile-nav-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = "<div class=\"mobile-nav-drawer-head\"><p class=\"mobile-nav-title\">YZC's UI Design Project</p><button class=\"nav-drawer-close\" type=\"button\" aria-label=\"关闭菜单\"><span aria-hidden=\"true\"></span></button></div><div class=\"mobile-nav-links\"></div>";

    var drawerLinks = drawer.querySelector(".mobile-nav-links");
    navLinks.querySelectorAll("a").forEach(function (link) {
      drawerLinks.appendChild(link.cloneNode(true));
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    var closeButton = drawer.querySelector(".nav-drawer-close");
    var smallScreen = window.matchMedia("(max-width: 560px)");

    function setDrawer(open) {
      document.body.classList.toggle("nav-drawer-open", open);
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");

      if (window.__yzcLenis) {
        if (open) {
          window.__yzcLenis.stop();
        } else {
          window.__yzcLenis.start();
        }
      }

      if (open) {
        window.setTimeout(function () {
          closeButton.focus();
        }, 120);
      } else {
        menuButton.focus({ preventScroll: true });
      }
    }

    menuButton.addEventListener("click", function () {
      setDrawer(true);
    });

    closeButton.addEventListener("click", function () {
      setDrawer(false);
    });

    backdrop.addEventListener("click", function () {
      setDrawer(false);
    });

    drawerLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setDrawer(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("nav-drawer-open")) {
        setDrawer(false);
      }
    });

    smallScreen.addEventListener("change", function (event) {
      if (!event.matches && document.body.classList.contains("nav-drawer-open")) {
        setDrawer(false);
      }
    });
  }

  function setupRevealHeader() {
    var header = document.querySelector(".site-header");

    if (!header) {
      return;
    }

    var spacer = document.createElement("div");
    spacer.className = "site-header-spacer";
    spacer.setAttribute("aria-hidden", "true");
    header.insertAdjacentElement("afterend", spacer);

    var lastScrollY = window.scrollY;
    var threshold = header.offsetHeight + 8;
    var ticking = false;

    function headerHeight() {
      return header.offsetHeight;
    }

    function setFloating(isFloating) {
      spacer.style.height = isFloating ? headerHeight() + "px" : "0px";
      header.classList.toggle("is-floating", isFloating);

      if (!isFloating) {
        header.classList.remove("is-visible");
      }
    }

    function updateHeader() {
      var currentScrollY = window.scrollY;
      var delta = currentScrollY - lastScrollY;

      if (currentScrollY <= 2) {
        setFloating(false);
      } else if (currentScrollY > threshold) {
        setFloating(true);

        if (delta < -4) {
          header.classList.add("is-visible");
        } else if (delta > 4) {
          header.classList.remove("is-visible");
        }
      }

      lastScrollY = Math.max(currentScrollY, 0);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", function () {
      threshold = headerHeight() + 8;

      if (header.classList.contains("is-floating")) {
        spacer.style.height = headerHeight() + "px";
      }
    });

    updateHeader();
  }

  setupNavigation();
  setupRevealHeader();
  setupSmoothScroll();

  function setupFallbackCarousel(carousel) {
    var track = carousel.querySelector(".hero-carousel-track");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dotsWrap = carousel.querySelector(".hero-dots");
    var activeIndex = 0;
    var timer = null;
    var isPaused = false;
    var interval = 4000;

    if (!track || !slides.length) {
      return;
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach(function (slide, index) {
        var dot = document.createElement("button");
        dot.className = "hero-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", slide.getAttribute("aria-label") || "显示第 " + (index + 1) + " 张轮播图");
        dotsWrap.appendChild(dot);
      });
    }

    var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.querySelectorAll(".hero-dot")) : [];

    function setSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      track.style.transform = "translate3d(" + (activeIndex * -100) + "%, 0, 0)";

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === activeIndex;
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        slide.tabIndex = isActive ? 0 : -1;
      });

      dots.forEach(function (dot, dotIndex) {
        var isActive = dotIndex === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || isPaused || slides.length < 2 || timer || document.hidden) {
        return;
      }

      timer = window.setInterval(function () {
        setSlide(activeIndex + 1);
      }, interval);
    }

    function pause() {
      isPaused = true;
      stop();
    }

    function resume() {
      isPaused = false;
      start();
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        setSlide(dotIndex);
        stop();
        start();
      });
    });

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("focusin", pause);
    carousel.addEventListener("focusout", function () {
      window.setTimeout(function () {
        if (!carousel.contains(document.activeElement)) {
          resume();
        }
      }, 0);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    setSlide(0);
    start();
  }

  function setupHeroCarousels() {
    document.querySelectorAll("[data-hero-swiper]").forEach(function (carousel) {
      var slides = carousel.querySelectorAll(".hero-slide");
      var pagination = carousel.querySelector(".hero-dots");

      if (!slides.length) {
        return;
      }

      if (window.Swiper) {
        new window.Swiper(carousel, {
          loop: slides.length > 1,
          speed: reduceMotion ? 0 : 720,
          effect: "fade",
          fadeEffect: {
            crossFade: true
          },
          slidesPerView: 1,
          spaceBetween: 0,
          grabCursor: slides.length > 1,
          watchOverflow: true,
          keyboard: {
            enabled: true
          },
          autoplay: reduceMotion || slides.length < 2 ? false : {
            delay: 4300,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          },
          pagination: pagination ? {
            el: pagination,
            clickable: true,
            renderBullet: function (index, className) {
              return "<button class=\"" + className + " hero-dot\" type=\"button\" aria-label=\"显示第 " + (index + 1) + " 张轮播图\"></button>";
            }
          } : false,
          breakpoints: {
            0: {
              speed: reduceMotion ? 0 : 520,
              touchRatio: 1.15
            },
            760: {
              speed: reduceMotion ? 0 : 680,
              touchRatio: 1
            }
          }
        });
        return;
      }

      setupFallbackCarousel(carousel);
    });
  }

  setupHeroCarousels();

  function setupLazyImages() {
    var lazyItems = document.querySelectorAll(".lazy-reveal, img[loading='lazy']");

    if (!lazyItems.length) {
      return;
    }

    if (!supportsIntersectionObserver || reduceMotion) {
      lazyItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          lazyObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px 12% 0px", threshold: 0.08 });

    lazyItems.forEach(function (item) {
      item.classList.add("lazy-reveal");
      lazyObserver.observe(item);
    });
  }

  function activateProjectPanel(target) {
    var tabButton = document.querySelector("[data-project-tab='" + target + "']");
    var panels = document.querySelectorAll("[data-project-panel]");

    if (!tabButton || !panels.length) {
      return;
    }

    document.querySelectorAll("[data-project-tab]").forEach(function (button) {
      var isActive = button === tabButton;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    panels.forEach(function (panel) {
      var isActive = panel.getAttribute("data-project-panel") === target;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);

      if (isActive) {
        panel.style.animation = "none";
        void panel.offsetHeight;
        panel.style.animation = "";
      }
    });
  }

  document.querySelectorAll("[data-project-tab]").forEach(function (tabButton) {
    tabButton.addEventListener("click", function () {
      activateProjectPanel(tabButton.getAttribute("data-project-tab"));
    });
  });

  function activateProjectPanelFromHash() {
    if (window.location.hash === "#web" || window.location.hash === "#app") {
      activateProjectPanel(window.location.hash.slice(1));
    }
  }

  window.setTimeout(activateProjectPanelFromHash, 0);
  window.addEventListener("hashchange", activateProjectPanelFromHash);

  function setupRevealEffects() {
    var revealItems = document.querySelectorAll(".reveal");

    if (!revealItems.length) {
      return;
    }

    if (!supportsIntersectionObserver || reduceMotion) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  function setupParallax() {
    var parallaxItems = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var ticking = false;

    if (!parallaxItems.length || reduceMotion) {
      return;
    }

    function update() {
      var viewportHeight = window.innerHeight || 1;

      parallaxItems.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var progress = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
        var y = Math.max(-18, Math.min(18, progress * -22));
        el.style.transform = "translate3d(0, " + y.toFixed(2) + "px, 0)";
      });

      ticking = false;
    }

    function requestUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  }

  setupRevealEffects();

  deferWork(function () {
    setupLazyImages();
    setupParallax();
  });
})();
