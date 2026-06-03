const pageTitles = {
  "01": ["INTRO", "作品集封面", "JIN HAORAN PORTFOLIO 2026", "lab"],
  "02": ["INTRO", "个人简历", "教育背景、实习经历、自我评价与软件应用", "lab"],
  "03": ["INTRO", "目录", "商业落地、品牌设计、IP设计、其他设计", "lab"],
  "04": ["BUSINESS", "商业项目总览", "商业落地项目章节封面", "work"],
  "05": ["BUSINESS", "携程旅行视觉", "Trip.com 海外活动主视觉与延展", "work"],
  "06": ["BUSINESS", "线上营销物料", "Banner、弹窗、落地页等多端尺寸适配", "work"],
  "07": ["BUSINESS", "线下大屏投放", "机场、地铁、商场场景视觉适配", "work"],
  "08": ["BUSINESS", "VML 上海项目", "国际 4A 广告公司商业视觉输出", "work"],
  "09": ["BUSINESS", "商业物料延展", "社媒、小程序、官网与活动物料更新", "work"],
  "10": ["BRAND", "品牌设计封面", "品牌视觉设计章节", "work"],
  "11": ["BRAND", "品牌识别", "橙乐多 Logo 与品牌基础视觉", "work"],
  "12": ["BRAND", "品牌包装", "产品包装与品牌色彩系统", "work"],
  "13": ["BRAND", "包装延展", "系列化包装与视觉规范", "work"],
  "14": ["BRAND", "品牌物料", "门店、贴纸、杯身等线下应用", "work"],
  "15": ["BRAND", "品牌传播", "海报与营销场景视觉", "work"],
  "16": ["BRAND", "界面延展", "小程序与线上触点视觉", "work"],
  "17": ["BRAND", "户外应用", "广告投放与场景化展示", "work"],
  "18": ["IP DESIGN", "IP设计封面", "王小明角色设计章节", "work"],
  "19": ["IP DESIGN", "角色设定", "IP 角色形象与基础设定", "work"],
  "20": ["IP DESIGN", "角色介绍", "人物信息、性格与视觉表达", "work"],
  "21": ["IP DESIGN", "表情设计", "微信表情包与社交传播", "work"],
  "22": ["IP DESIGN", "IP海报", "角色场景化视觉", "work"],
  "23": ["IP DESIGN", "周边物料", "贴纸、卡片与实体延展", "work"],
  "24": ["IP DESIGN", "IP应用", "更多传播场景与物料适配", "work"],
  "25": ["IP DESIGN", "IP总结", "角色系统完整展示", "work"],
  "26": ["OTHER", "其他设计封面", "运营视觉与 AIGC 设计章节", "lab"],
  "27": ["OTHER", "活动专题", "运营活动页与专题视觉", "lab"],
  "28": ["OTHER", "Banner 设计", "高频运营投放素材", "lab"],
  "29": ["OTHER", "旅游视觉", "目的地与活动传播画面", "lab"],
  "30": ["OTHER", "长图设计", "内容传播与信息排版", "lab"],
  "31": ["OTHER", "落地页设计", "线上转化页面视觉", "lab"],
  "32": ["OTHER", "AIGC 实验", "AI 生成与人工精修结合", "lab"],
  "33": ["OTHER", "视觉合集", "更多运营视觉与素材输出", "lab"],
};

const asset = (path) => `/static/portfolio/${path}`;

export const portfolioPages = Object.entries(pageTitles).map(([number, data], index) => ({
  number,
  chapter: data[0],
  title: data[1],
  caption: data[2],
  type: data[3],
  index,
  src: asset(
    number === "05"
      ? "custom/tripcom-business-overview.jpg"
      : number === "06"
      ? "custom/lovart-business-overview.jpg"
      : number === "07"
      ? "custom/changi-business-overview.png"
      : number === "08"
      ? "custom/air-new-zealand-business-overview.png"
      : number === "09"
      ? "custom/valvoline-business-overview.png"
      : `pdf_render/page-${number}.pdf.png`
  ),
  thumb: asset(`thumbs/page-${number}.jpg`),
}));

export const projects = [
  {
    title: "ALL PAGES",
    titleZh: "完整作品集",
    type: "work",
    role: "33页完整浏览",
    summary: "PDF 中的全部页面完整导入，包含封面、个人简历、目录、商业落地、品牌、IP 与运营视觉。",
    image: asset("pdf_render/page-01.pdf.png"),
    pages: portfolioPages.map((page) => page.number),
  },
  {
    title: "BUSINESS",
    titleZh: "商业落地项目",
    type: "work",
    role: "创意视觉设计",
    summary: "携程旅行、Changi、Valvoline 等商业项目视觉延展，覆盖 KV、线上物料、线下大屏与多尺寸投放。",
    image: asset("pdf_render/page-04.pdf.png"),
    pages: ["04", "05", "06", "07", "08", "09"],
  },
  {
    title: "BRAND",
    titleZh: "品牌设计",
    type: "work",
    role: "品牌视觉设计",
    summary: "橙乐多品牌识别、包装、物料、UI 与线下广告延展，建立清爽鲜活的产品视觉系统。",
    image: asset("custom/brand-section-cover.png"),
    pages: ["10"],
    customImages: [
      {
        src: asset("custom/brand-section-cover.png"),
        title: "品牌设计封面",
        size: "brand-cover",
      },
      {
        src: asset("custom/brand-portfolio-layout.png"),
        title: "榴乐多品牌作品集",
        size: "brand-long",
      },
    ],
  },
  {
    title: "IP DESIGN",
    titleZh: "IP设计",
    type: "work",
    role: "角色设计 & 延展",
    summary: "围绕王小明 IP 进行角色设定、介绍页、微信表情包、海报与周边物料设计。",
    image: asset("custom/ip-section-cover.png"),
    pages: ["18"],
    customImages: [
      {
        src: asset("custom/ip-section-cover.png"),
        title: "IP设计封面",
        size: "ip-cover",
      },
      {
        src: asset("custom/ip-resource-8.png"),
        title: "资源8",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-7.png"),
        title: "资源7",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-6.png"),
        title: "资源6",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-5.png"),
        title: "资源5",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-4.png"),
        title: "资源4",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-3.png"),
        title: "资源3",
        size: "ip-pair",
      },
      {
        src: asset("custom/ip-resource-2.png"),
        title: "资源2",
        size: "ip-pair",
      },
    ],
  },
  {
    title: "AIGC VISUAL",
    titleZh: "其他设计",
    type: "lab",
    role: "运营视觉 & AIGC",
    summary: "活动专题、Banner、长图、落地页与旅游视觉物料，结合 AIGC 工具提升素材产出效率。",
    image: asset("custom/other-section-cover.png"),
    pages: ["26"],
    customImages: [
      {
        src: asset("custom/other-section-cover.png"),
        title: "其他设计封面",
        size: "other-cover",
      },
      {
        src: asset("custom/other-resource-2.png"),
        title: "其他设计 2",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-3.png"),
        title: "其他设计 3",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-4.png"),
        title: "其他设计 4",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-5.png"),
        title: "其他设计 5",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-6.png"),
        title: "其他设计 6",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-7.png"),
        title: "其他设计 7",
        size: "other-pair",
      },
      {
        src: asset("custom/other-resource-8.png"),
        title: "其他设计 8",
        size: "other-pair",
      },
    ],
  },
  {
    title: "PROFILE",
    titleZh: "个人简历",
    type: "lab",
    role: "视觉传达 / 2026届",
    summary: "靳浩然，湖北文理学院视觉传达专业，求职方向为视觉设计师、运营设计师。",
    image: asset("profile/resume.png"),
    pages: ["02"],
    extraImages: [asset("profile/resume.png")],
  },
];
