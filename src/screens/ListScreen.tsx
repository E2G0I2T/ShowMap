import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  fetchPerformances,
  FetchParams,
  REGIONS,
  CATEGORIES,
  SORT_OPTIONS,
} from "../api/performanceApi";

export default function ListScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [performances, setPerformances] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // 필터 상태
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS[0]);

  // 날짜 상태
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 1)),
  );

  // 모달 제어
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<
    "CATE" | "REGION" | "SORT" | "DATE" | null
  >(null);
  const [showPicker, setShowPicker] = useState<"START" | "END" | null>(null);

  // 날짜 포맷팅 함수들
  const formatDateForApi = (date: Date) =>
    date.toISOString().split("T")[0].replace(/-/g, "");
  const formatDateForUI = (date: Date) =>
    `${date.getMonth() + 1}/${date.getDate()}`;
  const dateToNumber = (dateStr: string) =>
    parseInt(dateStr.replace(/\./g, ""), 10);

  const loadData = async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(true);

    // 1. 사용자 선택 날짜 숫자로 변환
    const userStartNum = safeDateToNumber(formatDateForApi(startDate));
    const userEndNum = safeDateToNumber(formatDateForApi(endDate));

    const params: FetchParams = {
      cpage: targetPage,
      shcate: category.value,
      shnm: search,
      signgucode: region.value,
      stdate: formatDateForApi(startDate),
      eddate: formatDateForApi(endDate),
    };

    const rawData = await fetchPerformances(params);

    // 2. 엄격한 필터링 실행
    const filtered = rawData.filter((item: any) => {
      const perfStart = safeDateToNumber(item.prfpdfrom);
      const perfEnd = safeDateToNumber(item.prfpdto);

      const isMatch = isDateOverlapping(
        userStartNum,
        userEndNum,
        perfStart,
        perfEnd,
      );

      // 🔍 디버깅 로그: 필터링되는 모든 과정을 터미널에 표 형태로 출력합니다.
      if (!isMatch) {
        console.log(
          `[제외됨] ${item.prfnm}: 공연(${perfStart}~${perfEnd}) vs 필터(${userStartNum}~${userEndNum})`,
        );
      }

      return isMatch;
    });

    // 3. 정렬 (날짜 기반 오름차순/내림차순)
    filtered.sort((a: any, b: any) => {
      const valA = safeDateToNumber(a.prfpdfrom);
      const valB = safeDateToNumber(b.prfpdfrom);
      return sortOrder.value === "ASC" ? valA - valB : valB - valA;
    });

    setPerformances(filtered);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, category, region, startDate, endDate, sortOrder]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="공연명 검색"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadData(true)}
        />
      </View>

      {/* 필터바 */}
      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { type: "CATE", label: category.label },
            { type: "REGION", label: region.label },
            { type: "SORT", label: sortOrder.label },
            // 💡 필터 라벨 수정: a ~ b 형태로 표시
            {
              type: "DATE",
              label: `${formatDateForUI(startDate)} ~ ${formatDateForUI(endDate)}`,
            },
          ]}
          contentContainerStyle={styles.filterBar}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => {
                setActiveFilterType(item.type as any);
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>{item.label} ▾</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 리스트 렌더링 생략 (기본 동일) */}
      {loading ? (
        <ActivityIndicator size="large" style={{ flex: 1 }} color="#007AFF" />
      ) : (
        <FlatList
          data={performances}
          keyExtractor={(item) => item.mt20id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Detail", { item })}
            >
              <Image source={{ uri: item.poster }} style={styles.poster} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.prfnm}
                </Text>
                <Text style={styles.venue}>{item.fcltynm}</Text>
                <Text style={styles.date}>
                  {item.prfpdfrom} ~ {item.prfpdto}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={() => (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={styles.pageBtn}
              >
                <Text>이전</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>{page} 페이지</Text>
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                style={styles.pageBtn}
              >
                <Text>다음</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* 통합 필터 선택 모달 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* 💡 날짜 선택 전용 UX 고도화 */}
            {activeFilterType === "DATE" ? (
              <View>
                <Text style={styles.modalTitle}>공연 기간 설정</Text>
                <View style={styles.dateSelectionRow}>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowPicker("START")}
                  >
                    <Text style={styles.datePickerLabel}>시작일</Text>
                    <Text style={styles.datePickerValue}>
                      {startDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateWave}>~</Text>
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setShowPicker("END")}
                  >
                    <Text style={styles.datePickerLabel}>종료일</Text>
                    <Text style={styles.datePickerValue}>
                      {endDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setPage(1);
                  }}
                >
                  <Text style={styles.applyBtnText}>이 기간으로 검색</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 일반 필터 (장르, 지역, 정렬) */
              <View>
                <Text style={styles.modalTitle}>항목 선택</Text>
                <FlatList
                  data={
                    activeFilterType === "CATE"
                      ? CATEGORIES
                      : activeFilterType === "REGION"
                        ? REGIONS
                        : SORT_OPTIONS
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => {
                        if (activeFilterType === "CATE") setCategory(item);
                        else if (activeFilterType === "REGION") setRegion(item);
                        else setSortOrder(item);
                        setModalVisible(false);
                        setPage(1);
                      }}
                    >
                      <Text style={styles.modalItemText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 실제 캘린더 피커 (모달 위에 뜸) */}
      {showPicker && (
        <DateTimePicker
          value={showPicker === "START" ? startDate : endDate}
          mode="date"
          onChange={(e, d) => {
            setShowPicker(null); // 피커만 닫고 모달은 유지
            if (d) {
              if (showPicker === "START") setStartDate(d);
              else setEndDate(d);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const safeDateToNumber = (dateStr: any): number => {
  if (!dateStr) return 0;
  // 숫자 이외의 모든 문자(점, 대시, 공백)를 제거
  const cleaned = String(dateStr).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10);
};

/**
 * 💡 기간 중첩 공식 (Strict Overlap)
 * 사용자가 선택한 [uStart, uEnd]와 공연 기간 [pStart, pEnd]가 
 * 하루라도 겹치는지 확인하는 수학적 공식입니다.
 */
const isDateOverlapping = (uStart: number, uEnd: number, pStart: number, pEnd: number) => {
  // 조건: (공연 시작일이 사용자 종료일보다 작거나 같음) AND (공연 종료일이 사용자 시작일보다 크거나 같음)
  return pStart <= uEnd && pEnd >= uStart;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  filterBar: { paddingHorizontal: 16, paddingBottom: 10, alignItems: "center" },
  dropdownBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  dropdownText: { fontSize: 13, color: "#333" },
  card: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
  },
  poster: { width: 70, height: 95, borderRadius: 6, backgroundColor: "#eee" },
  info: { marginLeft: 16, flex: 1, justifyContent: "center" },
  title: { fontWeight: "bold", fontSize: 16, color: "#222" },
  venue: { color: "#666", fontSize: 14, marginTop: 4 },
  date: { color: "#007AFF", fontSize: 12, marginTop: 4, fontWeight: "500" },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 25,
    alignItems: "center",
  },
  pageBtn: { padding: 10, backgroundColor: "#f2f2f2", borderRadius: 8 },
  pageText: { marginHorizontal: 20, fontWeight: "bold" },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemText: { fontSize: 16, textAlign: "center" },
  // 날짜 전용 스타일
  dateSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  datePickerBtn: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    alignItems: "center",
  },
  datePickerLabel: { fontSize: 12, color: "#888", marginBottom: 5 },
  datePickerValue: { fontSize: 16, fontWeight: "600", color: "#007AFF" },
  dateWave: { marginHorizontal: 10, fontSize: 20, color: "#ccc" },
  applyBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyBtnText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
