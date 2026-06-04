import React from "react";
import { portfolioPages, projects } from "./Data";
import { OptimizedImage } from "./ImageUtils";

const spaceItems = Array.from({ length: 3 }).flatMap((_, layer) =>
  portfolioPages.map((page, index) => ({
    page,
    layer,
    order: layer * portfolioPages.length + index,
  }))
);

const showcaseProjects = projects
  .filter((project) => ["BUSINESS", "BRAND", "IP DESIGN", "AIGC VISUAL"].includes(project.title))
  .map((project, index) => ({
    ...project,
    showcaseIndex: index,
    leadPage: portfolioPages.find((page) => page.number === project.pages[1]) || portfolioPages.find((page) => page.number === project.pages[0]),
    showcaseImage: project.image,
  }));

const dustItems = Array.from({ length: 128 }).map((_, index) => index);
const loaderLetters = "ROCKY PORTFOLIO VISUAL DESIGN EXPERIMENTAL WEBSITE"
  .replace(/\s/g, "")
  .split("")
  .map((letter, index) => {
    const angle = index * 137.5 * (Math.PI / 180);
    const radius = 18 + ((index * 19) % 48);
    return {
      letter,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * Math.min(radius * 0.78, 42),
      rotate: ((index * 47) % 110) - 55,
      scale: 0.75 + ((index * 7) % 9) / 10,
    };
  });

const nearPassPages = ["04", "05", "10", "18", "26", "02", "29", "32"]
  .map((number) => portfolioPages.find((page) => page.number === number))
  .filter(Boolean);

const Home = () => {
  return (
    <div data-template="Home" className="GRBPortfolio">
      <svg className="SVGDefs" aria-hidden="true" focusable="false">
        <filter id="titleWarp">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.05"
            numOctaves="1"
            seed="8"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
        </filter>
      </svg>

      <div className="Noise" aria-hidden="true"></div>
      <div className="CursorLocal" aria-hidden="true">
        <div className="CursorLocal__dot"></div>
        <svg className="CursorLocal__eye" viewBox="0 0 54 28" aria-hidden="true">
          <path d="M4.23 11.14C10.17 4.99 17.69 2.03 26.34 1.79c1.59.07 3.06.1 4.53.3 8.13 1.12 14.76 4.7 19.92 10.76.24.28.38.52.42.75h2.29c-.05-.23-.15-.46-.35-.72C47.87 5.91 40.73 1.66 31.79.4 20.49-1.2 10.82 2.04 2.87 9.81c-.93.91-1.7 1.96-2.54 2.95-.25.29-.35.56-.33.85h2.15c-.05-.49.62-.97 2.07-2.47z" />
          <path d="M51.22 13.61c.07.35-.09.67-.46 1.08-6.57 7.17-14.82 10.83-24.88 10.55-8.55-.24-15.85-3.35-21.63-9.32-1.34-1.38-2.05-1.85-2.1-2.32H0c.02.22.1.44.29.69 5.3 6.69 12.24 10.88 20.94 12.42 1.85.33 3.73.43 5.62.43 10.81-.21 19.6-4.28 26.29-12.39.34-.41.44-.77.36-1.14z" />
          <circle cx="26.2" cy="13.46" r="8.98" />
        </svg>
        <svg className="CursorLocal__arrow" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M31.35 48.23H78v3.54H31.35c4.56 3.54 9.06 8.15 12.64 12.96L41.32 67C36.55 60.41 29.39 54.11 23 50c6.39-4.11 13.55-10.41 18.32-17l2.67 2.27c-3.3 4.53-8.07 9.42-12.64 12.96z" />
        </svg>
      </div>
      <div className="CursorLocal__border" aria-hidden="true"></div>

      <div className="LoaderLocal">
        <div className="LoaderLocal__letters" aria-hidden="true">
          {loaderLetters.map(({ letter, x, y, rotate, scale }, index) => (
            <span
              key={`${letter}-${index}`}
              style={{
                transform: `translate3d(calc(-50% + ${x}vw), calc(-50% + ${y}vh), 0) rotate(${rotate}deg) scale(${scale})`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
        <div className="LoaderLocal__stamp" aria-hidden="true">
          ROCKY PORTFOLIO
        </div>
        <div className="LoaderLocal__corner LoaderLocal__corner--left" aria-hidden="true">
          ROCKY
          <span>PORTFOLIO 2026</span>
        </div>
        <div className="LoaderLocal__corner LoaderLocal__corner--right" aria-hidden="true">
          VISUAL DESIGNER
          <span>OPERATION DESIGNER</span>
        </div>
        <div className="LoaderLocal__rings" aria-hidden="true">
          <svg viewBox="0 0 500 500" className="Ring Ring--one">
            <defs>
              <path id="ringPathOne" d="M250,250 m-190,0 a190,190 0 1,1 380,0 a190,190 0 1,1 -380,0" />
            </defs>
            <text>
              <textPath href="#ringPathOne">
                BELIEVE IN THINKING DIFFERENT BELIEVE IN THINKING DIFFERENT BELIEVE IN THINKING DIFFERENT BELIEVE IN THINKING DIFFERENT
              </textPath>
            </text>
          </svg>
          <svg viewBox="0 0 500 500" className="Ring Ring--two">
            <defs>
              <path id="ringPathTwo" d="M250,250 m-138,0 a138,138 0 1,1 276,0 a138,138 0 1,1 -276,0" />
            </defs>
            <text>
              <textPath href="#ringPathTwo">
                ROCKY PORTFOLIO EXPERIMENTAL VISUAL DESIGN ROCKY PORTFOLIO EXPERIMENTAL VISUAL DESIGN
              </textPath>
            </text>
          </svg>
          <svg viewBox="0 0 500 500" className="Ring Ring--three">
            <defs>
              <path id="ringPathThree" d="M250,250 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
            </defs>
            <text>
              <textPath href="#ringPathThree">AUTHORIZED CHINESE VERSION AUTHORIZED CHINESE VERSION AUTHORIZED CHINESE VERSION</textPath>
            </text>
          </svg>
        </div>
        <button className="EnterButton" type="button" data-cursor="click">
          <span className="EnterButton__copy">Enter</span>
          <span className="EnterButton__percent">100</span>
        </button>
      </div>

      <header className="HeaderLocal">
        <button className="ContactToggle" type="button" data-cursor="click">
          <span>CONTACT</span>
          <span>CLOSE</span>
        </button>
        <div className="StageMeta" aria-hidden="true">
          <span className="StageMeta__index">00</span>
          <span className="StageMeta__title">LOADING</span>
        </div>
        <div className="ActionBarLocal">
          <button type="button" className="ArrowLocal ArrowLocal--left" aria-label="Previous" data-cursor="arrow">
            <span></span>
          </button>
          <button type="button" className="FilterLocal is-active" data-filter="all" data-cursor="click">
            ALL
          </button>
          <button type="button" className="FilterLocal" data-filter="work" data-cursor="click">
            WORK
          </button>
          <button type="button" className="ArrowLocal ArrowLocal--right" aria-label="Next" data-cursor="arrow">
            <span></span>
          </button>
          <button type="button" className="FilterLocal" data-filter="lab" data-cursor="click">
            LAB
          </button>
        </div>
      </header>

      <section className="SpaceStage" aria-label="Portfolio space">
        <div className="SpaceCamera">
          <div className="SpaceDust" aria-hidden="true">
            {dustItems.map((item) => (
              <span className="SpaceDust__dot" key={`dust-${item}`}></span>
            ))}
          </div>
          <div className="Space">
            {spaceItems.map(({ page, layer, order }) => {
              const feature = order % 29 === 0 || (["01", "02", "03"].includes(page.number) && layer === 0);
              return (
                <button
                  className={`SpaceCard${feature ? " SpaceCard--feature" : ""}${
                    order % 23 === 0 ? " SpaceCard--portrait" : ""
                  }`}
                  key={`${page.number}-${layer}`}
                  type="button"
                  data-page={page.number}
                  data-order={order}
                  data-layer={layer}
                  data-type={page.type}
                  data-cursor="eye"
                >
                  <img
                    src={page.thumb}
                    alt={page.title}
                    loading="lazy"
                    decoding="async"
                    width="480"
                    height="270"
                    draggable="false"
                  />
                  <span className="SpaceCard__label" aria-hidden="true">
                    <span>{page.type}</span>
                    <strong>{page.title}</strong>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="NearPass" aria-label="近景穿越作品">
            {nearPassPages.map((page, index) => (
              <button
                className={`NearPanel${index % 3 === 0 ? " NearPanel--wide" : ""}${index % 5 === 0 ? " NearPanel--tall" : ""}`}
                type="button"
                key={`near-${page.number}`}
                data-page={page.number}
                data-near-index={index}
                data-type={page.type}
                data-cursor="eye"
              >
                <span className="NearPanel__screen">
                  <img src={page.thumb} alt={page.title} loading="lazy" decoding="async" width="480" height="270" draggable="false" />
                </span>
                <span className="NearPanel__caption" aria-hidden="true">{page.title}</span>
              </button>
            ))}
          </div>
          <div className="ShowcaseRail" aria-label="精选作品">
            {showcaseProjects.map((project) => (
              <button
                className={`FeaturePanel FeaturePanel--${project.showcaseIndex + 1}`}
                type="button"
                key={project.title}
                data-project={project.title}
                data-index={project.showcaseIndex}
                data-cursor="eye"
              >
                <span className="FeaturePanel__meta">
                  <span>{String(project.showcaseIndex + 1).padStart(2, "0")}</span>
                  <strong>{project.title}</strong>
                </span>
                <OptimizedImage
                  src={project.showcaseImage}
                  alt={project.titleZh}
                  loading="lazy"
                  sizes="(max-width: 768px) 82vw, 46vw"
                  maxWidth={1920}
                  useStageFallback
                />
                <span className="FeaturePanel__caption">
                  <strong>{project.titleZh}</strong>
                  <span>{project.role}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="CenterTitle" aria-hidden="true">
          <h1>ROCKY</h1>
          <p>VISUAL DESIGNER & OPERATION DESIGNER</p>
          <button type="button" className="OpenAll" data-cursor="eye">
            查看完整作品集
          </button>
        </div>
        <div className="ScrollHint" aria-hidden="true">
          <span>SCROLL TO EXPLORE</span>
          <i></i>
        </div>
        <article className="Sheet Sheet--about">
          <div className="Sheet__label" aria-hidden="true">
            <strong>About</strong>
            <span>01</span>
          </div>
          <OptimizedImage
            src="/static/portfolio/profile/resume.png"
            alt="靳浩然个人简历"
            loading="lazy"
            sizes="(max-width: 768px) 82vw, 58vw"
            maxWidth={1920}
            useStageFallback
          />
        </article>
      </section>

      <section className="ProjectDetail" aria-hidden="true">
        <button className="DetailClose" type="button" data-cursor="click">
          CLOSE
        </button>
        <div className="DetailTopline" aria-hidden="true">
          <span className="DetailTopline__current">01</span>
          <span>SCROLL GALLERY / PUSH BOTTOM FOR NEXT PROJECT</span>
        </div>
        <div className="DetailHero">
          <div className="DetailPreview" aria-hidden="true">
            <OptimizedImage
              className="DetailPreview__image"
              src="/static/portfolio/pdf_render/page-01.pdf.png"
              alt=""
              loading="lazy"
              sizes="(max-width: 768px) 88vw, 58vw"
              maxWidth={1920}
              useStageFallback
            />
          </div>
          <div className="DetailTitle">
            <span className="DetailIndex">NO 00</span>
            <h2>PROJECT</h2>
            <p>PROJECT SUMMARY</p>
          </div>
        </div>
        <div className="DetailGallery"></div>
      </section>

      <footer className="ContactPanel" aria-hidden="true">
        <div className="ContactRing" aria-hidden="true">
          <svg viewBox="0 0 500 500">
            <defs>
              <path id="contactPath" d="M250,250 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" />
            </defs>
            <text>
              <textPath href="#contactPath">DROP ME A LINE DROP ME A LINE DROP ME A LINE DROP ME A LINE</textPath>
            </text>
          </svg>
        </div>
        <div className="ContactWrapper">
          <section className="ContactTitle">
            <h2>DROP ME A LINE</h2>
            <p>应聘视觉设计师 / 运营设计师。期待加入能高质量产出、重视创意执行和增长效果的团队。</p>
          </section>
          <section className="ContactLinks">
            <ul>
              <li className="label">CONTACT</li>
              <li>
                <a href="mailto:1572925945@qq.com" data-cursor="click">
                  1572925945@qq.com
                </a>
              </li>
              <li>
                <a href="tel:17756850680" data-cursor="click">
                  17756850680
                </a>
              </li>
              <li>WECHAT: NINEEEONE-R</li>
            </ul>
            <ul>
              <li className="label">INFO</li>
              <li>HUBEI UNIVERSITY</li>
              <li>VISUAL COMMUNICATION</li>
              <li>2026 GRADUATE</li>
            </ul>
          </section>
          <div className="ContactFoot">
            <p>
              <span>ALL RIGHT RESERVED</span>
              <span>ROCKY 2026</span>
            </p>
            <p>
              <span>DESIGN REFERENCE AUTHORIZED</span>
              <span>CHINESE PORTFOLIO VERSION</span>
            </p>
          </div>
        </div>
      </footer>
      <div className="ScrollProgress" aria-hidden="true">
        <span></span>
      </div>
      <div className="ScrollDepth" aria-hidden="true"></div>
    </div>
  );
};

export default Home;
