import { XMLParser } from "fast-xml-parser";

const API_KEY = process.env.EXPO_PUBLIC_KOPIS_API_KEY?.trim();
const parser = new XMLParser();

// 1. 공연 목록 가져오기
export const fetchPerformances = async (stdate: string, eddate: string) => {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${API_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=1&rows=10&shcate=GGGA`;
  
  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    const db = jsonObj?.dbs?.db || [];
    const list = Array.isArray(db) ? db : [db];

    return list.map((item: any) => ({
      mt20id: item.mt20id,
      prfnm: item.prfnm,
      fcltynm: item.fcltynm,
      area: item.area,
      poster: item.poster, // 포스터 이미지 URL 추가
    }));
  } catch (error) {
    return [];
  }
};

// 2. 공연 상세 정보에서 주소 추출하기
export const fetchPerformanceAddress = async (mt20id: string) => {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${mt20id}?service=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const xmlData = await response.text();
    const jsonObj = parser.parse(xmlData);
    
    // KOPIS 상세 XML의 구조: <dbs><db><adres>...</adres></db></dbs>
    const address = jsonObj?.dbs?.db?.adres;
    return address || null;
  } catch (error) {
    return null;
  }
};