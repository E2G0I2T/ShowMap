const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const NAVER_ID = "6hzwun3c0q";
const NAVER_SECRET = "EEOI32awXdOwmBNTrklubj2nkbfLFMP3kJCjc17M";

app.get('/api/reverse-geocode', async (req, res) => {
  const { lng, lat } = req.query;
  
  console.log(`📥 요청 받음: lng=${lng}, lat=${lat}`);
  
  if (!lng || !lat) {
    console.log('❌ 파라미터 없음');
    return res.status(400).json({ error: 'lng와 lat 필요' });
  }

  const coords = `${lng},${lat}`;
  const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${coords}&output=json&orders=roadaddr,addr`;

  try {
    console.log('🌐 NCP API 호출 중...');
    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_ID,
        'X-NCP-APIGW-API-KEY': NAVER_SECRET,
      },
    });

    const data = await response.json();
    console.log('✅ NCP 응답:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('❌ NCP 오류:', error);
    res.status(500).json({ error: '서버 오류' });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 프록시 서버 실행: http://localhost:${PORT}`);
  console.log(`📱 네트워크 주소로도 접근 가능`);
});