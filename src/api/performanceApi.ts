import { XMLParser } from "fast-xml-parser";
import { Platform } from "react-native";

// 🔑 KOPIS API 키
const API_KEY = "a9e7ba0edc264732b4cb39b386bf2ae4";

const parser = new XMLParser();
const BASE_URL = "http://www.kopis.or.kr/openApi/restful";
const PROXY_URL = "https://cors-anywhere.herokuapp.com/";

export interface FetchParams {
  cpage: number;
  shcate: string;
  shnm: string;
  signgucode: string;
  stdate: string;
  eddate: string;
}

const getUrl = (endpoint: string) => {
  const fullUrl = `${BASE_URL}${endpoint}`;
  // 웹이고 개발 환경일 때만 프록시 적용
  return Platform.OS === 'web' ? `${PROXY_URL}${fullUrl}` : fullUrl;
};

/** 💡 1. 목록 호출 (ListScreen 대응) */
export const fetchPerformances = async (params: any) => {
  const { cpage, shcate, shnm, signgucode, stdate, eddate } = params;
  let endpoint = `/pblprfr?service=${API_KEY}&stdate=${stdate}&eddate=${eddate}&rows=100&cpage=${cpage}`;
  if (shcate) endpoint += `&shcate=${shcate}`;
  if (shnm) endpoint += `&shnm=${encodeURIComponent(shnm)}`;
  if (signgucode) endpoint += `&signgucode=${signgucode}`;

  try {
    const response = await fetch(getUrl(endpoint));
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    const db = jsonObj?.dbs?.db;
    if (!db) return [];
    return Array.isArray(db) ? db : [db];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
};

/** 💡 2. 상세 정보 호출 */
export const fetchPerformanceDetail = async (mt20id: string) => {
  const endpoint = `/pblprfr/${mt20id}?service=${API_KEY}`;
  try {
    const response = await fetch(getUrl(endpoint));
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    const db = jsonObj?.dbs?.db;
    
    if (!db) return null;

    // 💡 예매처 정보를 안전하게 배열로 변환하여 리턴 (기존 로직 유지)
    if (db.relates?.relate) {
      db.relatesList = Array.isArray(db.relates.relate)
        ? db.relates.relate
        : [db.relates.relate];
    } else {
      db.relatesList = [];
    }
    
    return db;
  } catch (error) {
    console.error("Detail Fetch Error:", error);
    return null;
  }
};

// --- 상수 정의 ---
export const REGIONS = [
  { label: "전체 지역", value: "" },
  { label: "서울", value: "11" },
  { label: "경기", value: "41" },
  { label: "인천", value: "28" },
  { label: "부산", value: "26" },
  { label: "대구", value: "27" },
  { label: "대전", value: "30" },
  { label: "광주", value: "29" },
];

export const CATEGORIES = [
  { label: "전체 장르", value: "" },
  { label: "뮤지컬", value: "GGGA" },
  { label: "연극", value: "AAAA" },
  { label: "클래식", value: "CCCA" },
  { label: "대중음악", value: "CCCD" },
];

export const SORT_OPTIONS = [
  { label: "날짜 오름차순", value: "ASC" },
  { label: "날짜 내림차순", value: "DESC" },
];
