import React from "react";
import ReactDOM from "react-dom";
import Home from "./index.js";
import Manager from "./Manager";

const Route = "/";

const Init = async () => {
  const Data = {
    name: "靳浩然",
    role: "视觉设计师 / 运营设计师",
  };

  const Metadata = {
    title: "靳浩然作品集 | 视觉设计师",
    icon: "Meta/favicon.ico",
    keyword: "靳浩然, 作品集, 视觉设计师, 运营设计师, AIGC",
    author: "靳浩然",
    description: "靳浩然视觉设计师作品集，包含商业落地、品牌设计、IP设计、运营视觉和AIGC设计项目。",
    preview: "portfolio/pdf_render/page-01.pdf.png",
    url: "/",
  };

  const SSRSEO = () => {
    return (
      <div id="SSRSEO">
        <h1>靳浩然作品集</h1>
        <p>视觉设计师 / 运营设计师 / AIGC WORKFLOW</p>
      </div>
    );
  };

  return {
    Data,
    Metadata,
    SSRSEO,
  };
};

const Render = () => {
  if (!document.querySelector(`[data-key='${Route}']`)) {
    const root = document.createElement("section");
    root.dataset.key = Route;
    document.getElementById("root").appendChild(root);
  }

  ReactDOM.render(<Home props={window.__INITIAL__DATA__}></Home>, document.querySelector(`[data-key='${Route}']`));
};

export { Route, Init, Render, Manager };
