import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { fetchPerformanceDetail } from "../api/performanceApi";

const { width, height } = Dimensions.get("window");
const POSTER_HEIGHT = height * 0.6;

// 🗺️ 영어 → 한글 지명 매핑 테이블
const LOCATION_MAP: { [key: string]: string } = {
  // 서울 구
  Seoul: "서울특별시",
  "Gangnam District": "강남구",
  "Gangdong District": "강동구",
  "Gangbuk District": "강북구",
  "Gangseo District": "강서구",
  "Gwanak District": "관악구",
  "Gwangjin District": "광진구",
  "Guro District": "구로구",
  "Geumcheon District": "금천구",
  "Nowon District": "노원구",
  "Dobong District": "도봉구",
  "Dongdaemun District": "동대문구",
  "Dongjak District": "동작구",
  "Mapo District": "마포구",
  "Seodaemun District": "서대문구",
  "Seocho District": "서초구",
  "Seongdong District": "성동구",
  "Seongbuk District": "성북구",
  "Songpa District": "송파구",
  "Yangcheon District": "양천구",
  "Yeongdeungpo District": "영등포구",
  "Yongsan District": "용산구",
  "Eunpyeong District": "은평구",
  "Jongno District": "종로구",
  "Jung District": "중구",
  "Jungnang District": "중랑구",

  // 경기도
  "Gyeonggi-do": "경기도",
  Gyeonggi: "경기도",
  Suwon: "수원시",
  Seongnam: "성남시",
  Goyang: "고양시",
  Yongin: "용인시",
  Bucheon: "부천시",
  Ansan: "안산시",
  Anyang: "안양시",
  Namyangju: "남양주시",
  Hwaseong: "화성시",
  Uijeongbu: "의정부시",
  Siheung: "시흥시",
  Gwangmyeong: "광명시",
  Pyeongtaek: "평택시",
  Gimpo: "김포시",
  Hanam: "하남시",
  Osan: "오산시",
  Icheon: "이천시",
  Anseong: "안성시",
  Paju: "파주시",
  Uiwang: "의왕시",
  Yangpyeong: "양평군",
  Yeoju: "여주시",
  Pocheon: "포천시",
  Gapyeong: "가평군",
  Yeoncheon: "연천군",

  // 인천
  Incheon: "인천광역시",

  // 부산
  Busan: "부산광역시",

  // 대구
  Daegu: "대구광역시",

  // 대전
  Daejeon: "대전광역시",

  // 광주
  Gwangju: "광주광역시",

  // 울산
  Ulsan: "울산광역시",
};

/**
 * 영어 주소에서 한글 추출 또는 변환
 */
const translateAddress = (address: string): string => {
  let result = address;

  // 매핑 테이블로 변환
  Object.entries(LOCATION_MAP).forEach(([eng, kor]) => {
    result = result.replace(new RegExp(eng, "gi"), kor);
  });

  result = result.replace(/District/gi, "구");

  // 영어/일본어/중국어 제거
  result = result.replace(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, "");
  result = result.replace(/[A-Za-z]/g, "");

  // 불필요한 공백/특수문자 정리
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/^,\s*|,\s*$/g, "");

  return result;
};

export default function DetailScreen({ route }: any) {
  const item = route?.params?.item;
  const [detail, setDetail] = useState<any>(null);
  const [coords, setCoords] = useState<any>(null);
  const [officialAddress, setOfficialAddress] =
    useState<string>("주소를 불러오는 중...");
  const [loading, setLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [reserveModalVisible, setReserveModalVisible] = useState(false);

  useEffect(() => {
    if (!item) return;

    const loadPageData = async () => {
      setLoading(true);
      try {
        const perfData = await fetchPerformanceDetail(item.mt20id);
        setDetail(perfData);

        // 📍 지오코딩: 장소명 → 좌표
        console.log(
          "🏢 KOPIS 데이터 - area:",
          item.area,
          "/ fcltynm:",
          item.fcltynm,
        );

        const geo = await Location.geocodeAsync(`${item.area} ${item.fcltynm}`);
        if (geo.length > 0) {
          const { latitude, longitude } = geo[0];
          setCoords({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });

          // 📍 역지오코딩: 좌표 → 주소
          const revGeo = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (revGeo.length > 0) {
            const g = revGeo[0];

            // ✅ Google의 완벽한 한국 주소 사용
            let finalAddress = g.formattedAddress || "";

            // "대한민국 " 접두사 제거
            if (finalAddress.startsWith("대한민국 ")) {
              finalAddress = finalAddress.replace("대한민국 ", "");
            }

            // 🔍 한국어가 아닌 문자 감지
            const hasNonKorean =
              /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]|^[A-Za-z\s]+/.test(
                finalAddress,
              );

            if (hasNonKorean || !finalAddress) {
              console.log("⚠️ 비한국어 감지, 주소 번역 시도");
              console.log("원본:", finalAddress);

              // 💡 영어 → 한글 번역 시도
              const translated = translateAddress(finalAddress);
              console.log("번역:", translated);

              if (translated && translated.length > 2) {
                // 번역 성공
                finalAddress = translated;

                // 장소명 추가
                if (item?.fcltynm) {
                  finalAddress += ` - ${item.fcltynm}`;
                }

                // 우편번호 추가
                if (g.postalCode) {
                  finalAddress += ` (우: ${g.postalCode})`;
                }
              } else {
                // 번역 실패 → 기존 로직
                console.log("⚠️ 번역 실패, KOPIS 데이터 사용");

                if (item?.area) {
                  finalAddress = item.area;
                  if (item?.fcltynm) {
                    finalAddress += ` - ${item.fcltynm}`;
                  }
                  if (g.postalCode) {
                    finalAddress += ` (우: ${g.postalCode})`;
                  }
                } else {
                  finalAddress =
                    item?.fcltynm || "상세 주소를 찾을 수 없습니다.";
                  if (g.postalCode) {
                    finalAddress += ` (우: ${g.postalCode})`;
                  }
                }
              }
            }

            setOfficialAddress(finalAddress || "상세 주소를 찾을 수 없습니다.");
            console.log("📍 최종 주소:", finalAddress);
          } else {
            // reverseGeocode 실패 시 item 정보 사용
            if (item?.area && item?.fcltynm) {
              setOfficialAddress(`${item.area} - ${item.fcltynm}`);
            } else {
              setOfficialAddress("상세 주소를 찾을 수 없습니다.");
            }
          }
        }
      } catch (e) {
        console.error("주소 조회 오류:", e);
        setOfficialAddress("주소 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [item?.mt20id]);

  if (!item)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );

  const posterTranslateY = scrollY.interpolate({
    inputRange: [0, POSTER_HEIGHT],
    outputRange: [0, -POSTER_HEIGHT / 3],
    extrapolate: "clamp",
  });

  const openReservation = (url: string) => {
    if (url) {
      Linking.openURL(url);
      setReserveModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 포스터 이미지 섹션 */}
      <Animated.Image
        source={{ uri: item.poster }}
        style={[
          styles.fixedPoster,
          { transform: [{ translateY: posterTranslateY }] },
        ]}
        resizeMode="cover"
      />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: POSTER_HEIGHT - 40 }} />
        <View style={styles.contentBox}>
          <View style={styles.handleBar} />

          <Text style={styles.title}>{item.prfnm}</Text>

          {/* 📋 공연 상세 정보 섹션 보강 */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>📍 장소: {item.fcltynm}</Text>
            <Text style={styles.infoText}>
              📅 기간: {item.prfpdfrom} ~ {item.prfpdto}
            </Text>

            {/* 💡 추가된 항목들 */}
            {item.genrenm && (
              <Text style={styles.infoText}>🎭 장르: {item.genrenm}</Text>
            )}

            {detail?.prfcast && detail.prfcast.trim() !== "" && (
              <Text style={styles.infoText}>👥 출연진: {detail.prfcast}</Text>
            )}

            {detail?.pcseguidance && (
              <Text style={styles.infoText}>
                💰 가격: {detail.pcseguidance}
              </Text>
            )}

            {detail?.dtlsvc && (
              <Text style={styles.infoText}>🕒 시간: {detail.dtlsvc}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>찾아오시는 길</Text>
          <View style={styles.mapContainer}>
            {coords && (
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={coords}
                scrollEnabled={false}
              >
                <Marker coordinate={coords} title={item.fcltynm} />
              </MapView>
            )}
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>공연장 주소</Text>
            <Text style={styles.addressText}>{officialAddress}</Text>
          </View>
          <View style={{ height: 150 }} />
        </View>
      </Animated.ScrollView>
      {!loading && detail?.relatesList?.length > 0 && (
        <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.mainReserveBtn}
            onPress={() => {
              // 예매처가 하나면 바로 이동, 여러 개면 모달 띄우기
              if (detail.relatesList.length === 1) {
                openReservation(detail.relatesList[0].relateurl);
              } else {
                setReserveModalVisible(true);
              }
            }}
          >
            <Text style={styles.reserveBtnText}>
              {detail.relatesList.length === 1
                ? "공연 예매하기"
                : "예매처 선택하기"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* 💡 다중 예매처 선택 모달 */}
      <Modal visible={reserveModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReserveModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalBar} />
            <Text style={styles.modalTitle}>예매처를 선택해주세요</Text>
            <FlatList
              data={detail?.relatesList || []}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item: rItem }) => (
                <TouchableOpacity
                  style={styles.reserveItem}
                  onPress={() => openReservation(rItem.relateurl)}
                >
                  <Text style={styles.reserveItemText}>{rItem.relatenm}</Text>
                  <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                    바로가기 ➔
                  </Text>
                </TouchableOpacity>
              )}
              style={{ width: "100%" }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  fixedPoster: {
    position: "absolute",
    width: width,
    height: POSTER_HEIGHT,
    top: 0,
  },
  contentBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#eee",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#111", marginBottom: 20 },
  infoSection: {
    backgroundColor: "#f8f9fa",
    padding: 18,
    borderRadius: 15,
    marginBottom: 25,
  },
  infoText: { fontSize: 14, color: "#444", marginBottom: 10, lineHeight: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  map: { width: "100%", height: "100%" },
  addressBox: {
    marginTop: 12,
    padding: 15,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "bold",
    marginBottom: 4,
  },
  addressText: { color: "#333", fontSize: 14, lineHeight: 20 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  mainReserveBtn: {
    backgroundColor: "#007AFF",
    margin: 15,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reserveBtnText: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
    maxHeight: height * 0.7,
  },
  modalBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  reserveItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  reserveItemText: { fontSize: 16, color: "#333" },
});
