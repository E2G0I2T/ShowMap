import { XMLParser } from "fast-xml-parser";

const API_KEY = process.env.EXPO_PUBLIC_KOPIS_API_KEY?.trim();
const parser = new XMLParser();

export interface FetchParams {
  cpage: number;
  shcate?: string;
  shnm?: string;
  signgucode?: string;
  stdate: string;
  eddate: string;
}

// 1. 공연 목록 가져오기 (필터/검색 대응)
export const fetchPerformances = async (params: FetchParams) => {
  const { cpage, shcate = '', shnm = '', signgucode = '', stdate, eddate } = params;
  let url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${API_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=${cpage}&rows=10`;
  
  if (shcate) url += `&shcate=${shcate}`;
  if (shnm) url += `&shnm=${encodeURIComponent(shnm)}`;
  if (signgucode) url += `&signgucode=${signgucode}`;

  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    const db = jsonObj?.dbs?.db || [];
    return Array.isArray(db) ? db : [db];
  } catch (error) {
    return [];
  }
};

// 2. [문제의 함수] 공연 상세 정보에서 주소 추출하기 (DetailScreen용)
export const fetchPerformanceAddress = async (mt20id: string) => {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${mt20id}?service=${API_KEY}`;
  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    return jsonObj?.dbs?.db?.adres || null;
  } catch (error) {
    return null;
  }
};