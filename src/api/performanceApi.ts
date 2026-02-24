import { XMLParser } from 'fast-xml-parser';

// Expo 환경 변수 가져오기
const API_KEY = process.env.EXPO_PUBLIC_KOPIS_API_KEY;
const BASE_URL = 'http://www.kopis.or.kr/openApi/restful/pblprfr';

export const fetchPerformances = async (stdate: string, eddate: string) => {
  if (!API_KEY) {
    console.error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
    return [];
  }

  try {
    const url = `${BASE_URL}?service=${API_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=1&rows=20&shcate=GGGA`;
    const response = await fetch(url);
    const xmlData = await response.text();

    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);
    
    // 데이터가 없을 경우 빈 배열 반환
    if (!jsonObj.dbs || !jsonObj.dbs.db) return [];
    
    const rawList = Array.isArray(jsonObj.dbs.db) ? jsonObj.dbs.db : [jsonObj.dbs.db];

    return rawList.map((item: any) => ({
      id: item.mt20id,
      title: item.prfnm,
      startDate: item.prfpdfrom,
      endDate: item.prfpdto,
      venue: item.fcltynm,
      poster: item.poster,
      genre: item.genrenm,
      status: item.prfstate,
    }));
  } catch (error) {
    console.error('KOPIS API Fetch 에러:', error);
    return [];
  }
};