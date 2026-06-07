import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ---------- Estate selection ---------- */
export type EstateId = "all" | "tower-a" | "tower-b" | "tower-c";

export const ESTATES: { id: EstateId; label: string; labelZh: string; sub: string }[] = [
  { id: "all", label: "Hartland Estate", labelZh: "哈特兰庄园", sub: "Whole estate" },
  { id: "tower-a", label: "Tower A — Hartland", labelZh: "A 栋 — 哈特兰", sub: "Residential" },
  { id: "tower-b", label: "Tower B — Hartland", labelZh: "B 栋 — 哈特兰", sub: "Residential" },
  { id: "tower-c", label: "Tower C — Hartland", labelZh: "C 栋 — 哈特兰", sub: "Residential" },
];

/* ---------- Clusters ---------- */
export type Camera = { id: string; name: string; active: boolean };
export type Cluster = {
  id: string;
  name: string;
  nameZh: string;
  sub: string;
  scope: EstateId;
  functions: { id: string; label: string; labelZh: string; active: boolean }[];
  cameras: Camera[];
};

const initialClusters: Cluster[] = [
  {
    id: "gate",
    name: "Main Gate Cluster",
    nameZh: "正门集群",
    sub: "Main entrance • 6 cams",
    scope: "all",
    functions: [
      { id: "lp", label: "License plate check", labelZh: "车牌识别", active: true },
      { id: "tg", label: "Tailgating", labelZh: "尾随检测", active: true },
      { id: "vh", label: "Vehicle dwell", labelZh: "车辆滞留", active: false },
      { id: "vis", label: "Visitor logging", labelZh: "访客登记", active: false },
    ],
    cameras: [
      { id: "g1", name: "Gate Cam 01 — Inbound", active: true },
      { id: "g2", name: "Gate Cam 02 — Outbound", active: true },
      { id: "g3", name: "Gate Cam 03 — Pedestrian", active: true },
      { id: "g4", name: "Gate Cam 04 — Overhead", active: true },
      { id: "g5", name: "Gate Cam 05 — Booth", active: false },
      { id: "g6", name: "Gate Cam 06 — Approach", active: true },
    ],
  },
  {
    id: "perimeter",
    name: "Perimeter Cluster",
    nameZh: "周界集群",
    sub: "East boundary • 9 cams",
    scope: "all",
    functions: [
      { id: "fj", label: "Fence jump", labelZh: "翻越围栏", active: true },
      { id: "wc", label: "Wall climb", labelZh: "翻墙", active: true },
      { id: "int", label: "Intrusion detection", labelZh: "入侵检测", active: false },
    ],
    cameras: [
      { id: "p1", name: "Perimeter Cam 01 — NE", active: true },
      { id: "p2", name: "Perimeter Cam 02 — E", active: true },
      { id: "p3", name: "Perimeter Cam 03 — SE", active: true },
      { id: "p4", name: "Perimeter Cam 04 — Rear Wall", active: true },
      { id: "p5", name: "Perimeter Cam 05 — S", active: false },
    ],
  },
  {
    id: "park-common",
    name: "General Parking",
    nameZh: "公共停车场",
    sub: "Surface lot • 8 cams",
    scope: "all",
    functions: [
      { id: "lp", label: "License plate check", labelZh: "车牌识别", active: true },
      { id: "uv", label: "Unknown vehicle", labelZh: "未知车辆", active: true },
    ],
    cameras: [
      { id: "pc1", name: "Lot Cam 01 — Row A", active: true },
      { id: "pc2", name: "Lot Cam 02 — Row B", active: true },
      { id: "pc3", name: "Lot Cam 03 — Exit", active: true },
    ],
  },
  {
    id: "hall-a",
    name: "Hallway Cluster (Tower A)",
    nameZh: "走廊集群（A 栋）",
    sub: "Tower A lobby & floors • 12 cams",
    scope: "tower-a",
    functions: [
      { id: "pt", label: "Package theft", labelZh: "包裹盗窃", active: true },
      { id: "pl", label: "Parcel-left", labelZh: "包裹遗留", active: true },
    ],
    cameras: [
      { id: "ha1", name: "Lobby Cam — Tower A", active: true },
      { id: "ha2", name: "Floor 3 Hall — Tower A", active: true },
      { id: "ha3", name: "Floor 7 Hall — Tower A", active: true },
      { id: "ha4", name: "Service Corridor — Tower A", active: false },
    ],
  },
  {
    id: "park-a",
    name: "Private Parking (Tow.-A)",
    nameZh: "专属停车场（A 栋）",
    sub: "Underground B1 • 6 cams",
    scope: "tower-a",
    functions: [
      { id: "lp", label: "License plate check", labelZh: "车牌识别", active: true },
      { id: "vd", label: "Vehicle dwell", labelZh: "车辆滞留", active: true },
    ],
    cameras: [
      { id: "pa1", name: "B1 Ramp — Tower A", active: true },
      { id: "pa2", name: "B1 Aisle 1 — Tower A", active: true },
    ],
  },
  {
    id: "hall-b",
    name: "Hallway Cluster (Tower B)",
    nameZh: "走廊集群（B 栋）",
    sub: "Tower B lobby & floors • 10 cams",
    scope: "tower-b",
    functions: [
      { id: "pt", label: "Package theft", labelZh: "包裹盗窃", active: true },
      { id: "pl", label: "Parcel-left", labelZh: "包裹遗留", active: true },
    ],
    cameras: [
      { id: "hb1", name: "Lobby Cam — Tower B", active: true },
      { id: "hb2", name: "Floor 4 Hall — Tower B", active: true },
      { id: "hb3", name: "Mailroom Cam — Tower B", active: true },
    ],
  },
  {
    id: "park-b",
    name: "Private Parking (Tow.-B)",
    nameZh: "专属停车场（B 栋）",
    sub: "Underground B1 • 5 cams",
    scope: "tower-b",
    functions: [{ id: "lp", label: "License plate check", labelZh: "车牌识别", active: true }],
    cameras: [
      { id: "pb1", name: "B1 Ramp — Tower B", active: true },
      { id: "pb2", name: "B1 Aisle — Tower B", active: true },
    ],
  },
  {
    id: "hall-c",
    name: "Hallway Cluster (Tower C)",
    nameZh: "走廊集群（C 栋）",
    sub: "Tower C lobby & floors • 9 cams",
    scope: "tower-c",
    functions: [{ id: "pt", label: "Package theft", labelZh: "包裹盗窃", active: true }],
    cameras: [
      { id: "hc1", name: "Lobby Cam — Tower C", active: true },
      { id: "hc2", name: "Floor 5 Hall — Tower C", active: true },
    ],
  },
  {
    id: "park-c",
    name: "Private Parking (Tow.-C)",
    nameZh: "专属停车场（C 栋）",
    sub: "Underground B1 • 4 cams",
    scope: "tower-c",
    functions: [{ id: "lp", label: "License plate check", labelZh: "车牌识别", active: true }],
    cameras: [
      { id: "pcam1", name: "B1 Ramp — Tower C", active: true },
      { id: "pcam2", name: "B1 Aisle — Tower C", active: true },
    ],
  },
];

/* ---------- Elderly apartments ---------- */
export type ElderlyApartment = {
  id: string;
  tower: "tower-a" | "tower-b" | "tower-c";
  floor: number;
  apt: string;
  resident: string;
  residentZh: string;
  status: "ok" | "check" | "alert";
  lastMotion: string;
  lastMotionZh: string;
};

export const ELDERLY: ElderlyApartment[] = [
  { id: "e1", tower: "tower-a", floor: 3, apt: "A-302", resident: "Mr. Wong (78)", residentZh: "王先生（78）", status: "ok", lastMotion: "5m ago", lastMotionZh: "5 分钟前" },
  { id: "e2", tower: "tower-a", floor: 7, apt: "A-705", resident: "Mrs. Lim (82)", residentZh: "林女士（82）", status: "check", lastMotion: "1h 12m ago", lastMotionZh: "1 小时 12 分钟前" },
  { id: "e3", tower: "tower-a", floor: 12, apt: "A-1208", resident: "Mr. Tan (74)", residentZh: "陈先生（74）", status: "ok", lastMotion: "12m ago", lastMotionZh: "12 分钟前" },
  { id: "e4", tower: "tower-b", floor: 4, apt: "B-401", resident: "Mrs. Goh (81)", residentZh: "吴女士（81）", status: "ok", lastMotion: "3m ago", lastMotionZh: "3 分钟前" },
  { id: "e5", tower: "tower-b", floor: 9, apt: "B-902", resident: "Mr. Chen (76)", residentZh: "陈先生（76）", status: "alert", lastMotion: "3h ago — fall pattern", lastMotionZh: "3 小时前 — 疑似跌倒" },
  { id: "e6", tower: "tower-c", floor: 2, apt: "C-204", resident: "Mrs. Ho (79)", residentZh: "何女士（79）", status: "ok", lastMotion: "9m ago", lastMotionZh: "9 分钟前" },
  { id: "e7", tower: "tower-c", floor: 6, apt: "C-606", resident: "Mr. Ng (84)", residentZh: "黄先生（84）", status: "check", lastMotion: "45m ago", lastMotionZh: "45 分钟前" },
];

/* ---------- Incidents ---------- */
export type Incident = {
  id: string;
  title: string;
  titleZh: string;
  loc: string;
  time: string;
  level: "active" | "resolved";
};

export const INCIDENTS: Incident[] = [
  { id: "i1", title: "Possible perimeter breach", titleZh: "疑似周界入侵", loc: "Rear wall · P-04", time: "Just now", level: "active" },
  { id: "i2", title: "Package left in Tower B lobby", titleZh: "包裹遗留在 B 栋大堂", loc: "Tower B Lobby", time: "12m ago", level: "active" },
  { id: "i3", title: "Tailgating at Main Gate", titleZh: "正门疑似尾随", loc: "Main Gate", time: "1h ago", level: "resolved" },
  { id: "i4", title: "Unknown vehicle in B1", titleZh: "B1 出现未知车辆", loc: "Parking B1", time: "3h ago", level: "resolved" },
  { id: "i5", title: "Elderly fall pattern — B-902", titleZh: "B-902 疑似跌倒", loc: "Tower B · Floor 9", time: "3h ago", level: "active" },
];

/* ---------- Vehicle access timeline ---------- */
export type VehicleEvent = {
  id: string;
  time: string;
  direction: "in" | "out";
  plate: string;
  who: string;
  whoZh: string;
  img: string;
};

export const VEHICLES: VehicleEvent[] = [
  { id: "v1", time: "07:12", direction: "in", plate: "SJX 4421 K", who: "Resident · Tower A 1208", whoZh: "住户 · A 栋 1208", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop" },
  { id: "v2", time: "07:48", direction: "out", plate: "SLR 9087 P", who: "Resident · Tower B 401", whoZh: "住户 · B 栋 401", img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800&auto=format&fit=crop" },
  { id: "v3", time: "09:03", direction: "in", plate: "GBA 1142 X", who: "Visitor · pre-approved", whoZh: "访客 · 已预约", img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop" },
  { id: "v4", time: "10:24", direction: "in", plate: "DLV 0021 M", who: "Delivery · SF Express", whoZh: "派送 · 顺丰", img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop" },
  { id: "v5", time: "11:50", direction: "out", plate: "SJX 4421 K", who: "Resident · Tower A 1208", whoZh: "住户 · A 栋 1208", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop" },
  { id: "v6", time: "14:32", direction: "in", plate: "UNK ???? ?", who: "Unknown — needs review", whoZh: "未知 — 需审核", img: "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=800&auto=format&fit=crop" },
  { id: "v7", time: "17:15", direction: "out", plate: "GBA 1142 X", who: "Visitor depart", whoZh: "访客离开", img: "https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=800&auto=format&fit=crop" },
];

/* ---------- Perimeter feeds ---------- */
export type PerimeterFeed = {
  id: string;
  cam: string;
  zone: string;
  zoneZh: string;
  status: "ok" | "alert";
  note: string;
  noteZh: string;
  img: string;
};

export const PERIMETER_FEEDS: PerimeterFeed[] = [
  { id: "f1", cam: "P-01 NE Corner", zone: "Northeast fence", zoneZh: "东北围栏", status: "ok", note: "All clear", noteZh: "正常", img: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?q=80&w=900&auto=format&fit=crop" },
  { id: "f2", cam: "P-02 East Wall", zone: "East boundary", zoneZh: "东侧边界", status: "ok", note: "Routine motion · branches", noteZh: "正常 · 树枝晃动", img: "/east_wall.png" },
  { id: "f3", cam: "P-04 Rear Wall", zone: "South-east rear", zoneZh: "东南后墙", status: "alert", note: "Person crossing boundary", noteZh: "人员越界", img: "/jumping_wall.png" },
  { id: "f4", cam: "P-05 South Fence", zone: "South perimeter", zoneZh: "南侧周界", status: "ok", note: "All clear", noteZh: "正常", img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=900&auto=format&fit=crop" },
];

/* ---------- Translations ---------- */
type Lang = "en" | "zh";

const T: Record<string, { en: string; zh: string }> = {
  // Header
  "header.console": { en: "Security Console", zh: "安全控制台" },
  "header.onprem": { en: "Self-hosted — estate video stays on-prem", zh: "本地部署 — 视频不出园区" },
  // Nav
  "nav.overview": { en: "Overview", zh: "总览" },
  "nav.clusters": { en: "Camera Clusters", zh: "摄像头集群" },
  "nav.incidents": { en: "Active Incidents", zh: "当前事件" },
  "nav.packages": { en: "Packages & Hallways", zh: "包裹与走廊" },
  "nav.access": { en: "Access & Vehicles", zh: "通行与车辆" },
  "nav.perimeter": { en: "Perimeter", zh: "周界" },
  "nav.elderly": { en: "Elderly Safety Add-on", zh: "长者安全模块" },
  "nav.notifications": { en: "Notifications", zh: "通知" },
  "nav.views": { en: "Views", zh: "视图" },
  "nav.modules": { en: "Modules", zh: "模块" },
  // Common buttons
  "btn.edit": { en: "Edit", zh: "编辑" },
  "btn.editing": { en: "Editing…", zh: "编辑中…" },
  "btn.save": { en: "Save", zh: "保存" },
  "btn.cancel": { en: "Cancel", zh: "取消" },
  "btn.create": { en: "Create cluster", zh: "新建集群" },
  "btn.review": { en: "Review", zh: "查看" },
  "btn.dispatch": { en: "Dispatch guard", zh: "派遣保安" },
  "btn.false": { en: "Mark false alarm", zh: "标记为误报" },
  // Cluster page
  "clusters.title": { en: "Camera Clusters", zh: "摄像头集群" },
  "clusters.subtitle": { en: "Assign each camera group a security function based on its location and risk profile.", zh: "根据位置与风险，为每组摄像头分配安全功能。" },
  "clusters.active": { en: "Active", zh: "运行中" },
  "clusters.noFn": { en: "No functions assigned", zh: "未分配功能" },
  "clusters.target": { en: "Target Cluster", zh: "目标集群" },
  "clusters.fns": { en: "Active Functions", zh: "启用功能" },
  "clusters.cams": { en: "Cameras in this cluster", zh: "该集群内的摄像头" },
  "clusters.empty": { en: "No clusters for this selection yet.", zh: "当前选择下暂无集群。" },
  // Overview
  "ov.queue": { en: "Live Review Queue", zh: "实时审核队列" },
  // Access
  "access.title": { en: "Access & Vehicles", zh: "通行与车辆" },
  "access.sub": { en: "Timestamped clips of vehicles entering and leaving today.", zh: "今日车辆进出的时间戳片段。" },
  "access.in": { en: "In", zh: "入" },
  "access.out": { en: "Out", zh: "出" },
  // Perimeter
  "peri.title": { en: "Perimeter Surveillance", zh: "周界监控" },
  "peri.sub": { en: "Live feeds and alerts from the estate boundary.", zh: "园区边界的实时视频与告警。" },
  "peri.estateOnly": { en: "Perimeter coverage applies to the whole Hartland Estate. Select 'Hartland Estate' from the top to view.", zh: "周界监控只覆盖整个哈特兰庄园,请在顶部切换为「哈特兰庄园」。" },
  // Elderly
  "eld.title": { en: "Elderly Safety Add-on", zh: "长者安全模块" },
  "eld.sub": { en: "Apartments enrolled in the elderly companion app, with last-motion check-in.", zh: "已接入长者陪伴 App 的住户，含最近活动签到。" },
  "eld.empty": { en: "No enrolled apartments in this selection.", zh: "当前选择下暂无接入住户。" },
  "eld.tower": { en: "Tower", zh: "栋" },
  "eld.floor": { en: "Floor", zh: "楼层" },
  "eld.apt": { en: "Apartment", zh: "房号" },
  "eld.last": { en: "Last motion", zh: "最近活动" },
  // Notifications
  "notif.title": { en: "Notifications", zh: "通知" },
  "notif.active": { en: "Active", zh: "当前" },
  "notif.resolved": { en: "Resolved", zh: "已处理" },
};

type AppCtx = {
  estate: EstateId;
  setEstate: (e: EstateId) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  visibleClusters: Cluster[];
};

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [estate, setEstate] = useState<EstateId>("all");
  const [lang, setLang] = useState<Lang>("en");
  const [clusters, setClusters] = useState<Cluster[]>(initialClusters);

  const t = useMemo(
    () => (key: string) => {
      const entry = T[key];
      if (!entry) return key;
      return lang === "zh" ? entry.zh : entry.en;
    },
    [lang],
  );

  const visibleClusters = useMemo(
    () => clusters.filter((c) => c.scope === estate),
    [clusters, estate],
  );

  return (
    <Ctx.Provider value={{ estate, setEstate, lang, setLang, t, clusters, setClusters, visibleClusters }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

export function localizeCluster(c: Cluster, lang: Lang) {
  return lang === "zh" ? c.nameZh : c.name;
}
export function localizeFn(f: { label: string; labelZh: string }, lang: Lang) {
  return lang === "zh" ? f.labelZh : f.label;
}
