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
  Alert, // 💡 경고창 추가
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

  const [category, setCategory] = useState(CATEGORIES[1]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS[0]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 💡 초기값도 1주일로 설정
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<
    "CATE" | "REGION" | "SORT" | "DATE" | null
  >(null);
  const [showPicker, setShowPicker] = useState<"START" | "END" | null>(null);

  const formatDateForApi = (date: Date) =>
    date.toISOString().split("T")[0].replace(/-/g, "");
  const formatDateForUI = (date: Date) =>
    `${date.getMonth() + 1}/${date.getDate()}`;

  const loadData = async (resetPage = false) => {
    const targetPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(true);

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

    try {
      const rawData = await fetchPerformances(params);

      // 1. 날짜 중첩 및 검색어 필터링
      const filtered = rawData.filter((item: any) => {
        const perfStart = safeDateToNumber(item.prfpdfrom);
        const perfEnd = safeDateToNumber(item.prfpdto);
        const isDateMatch = isDateOverlapping(
          userStartNum,
          userEndNum,
          perfStart,
          perfEnd,
        );
        const isSearchMatch =
          search.trim() === ""
            ? true
            : item.prfnm.toLowerCase().includes(search.toLowerCase());
        return isDateMatch && isSearchMatch;
      });

      // 2. 정렬 로직
      filtered.sort((a: any, b: any) => {
        const valA = safeDateToNumber(a.prfpdfrom);
        const valB = safeDateToNumber(b.prfpdfrom);
        return sortOrder.value === "ASC" ? valA - valB : valB - valA;
      });

      // 💡 3. 한 페이지 20개 제한
      setPerformances(filtered.slice(0, 20));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, category, region, startDate, endDate, sortOrder]);

  // 💡 날짜 변경 시 1주일 제한 체크 로직
  const handleDateChange = (selectedDate: Date) => {
    if (showPicker === "START") {
      setStartDate(selectedDate);
      // 시작일이 바뀌면 종료일도 자동으로 시작일+7일로 조정 (UX 편의)
      const newEnd = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      setEndDate(newEnd);
    } else {
      const diffTime = selectedDate.getTime() - startDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);

      if (diffDays < 0) {
        Alert.alert("알림", "종료일은 시작일보다 빠를 수 없습니다.");
      } else if (diffDays > 7) {
        Alert.alert("기간 제한", "최대 1주일까지만 조회가 가능합니다.");
        const limitDate = new Date(
          startDate.getTime() + 7 * 24 * 60 * 60 * 1000,
        );
        setEndDate(limitDate);
      } else {
        setEndDate(selectedDate);
      }
    }
    setShowPicker(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="공연명 검색"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => loadData(true)}
        />
      </View>

      <View style={{ height: 50 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { type: "CATE", label: category.label },
            { type: "REGION", label: region.label },
            { type: "SORT", label: sortOrder.label },
            {
              type: "DATE",
              label: `${formatDateForUI(startDate)} ~ ${formatDateForUI(endDate)} (최대 7일)`,
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

      {loading ? (
        <ActivityIndicator size="large" style={{ flex: 1 }} color="#007AFF" />
      ) : (
        <View style={{ flex: 1 }}>
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
            // 💡 리스트 하단 컴포넌트
            ListFooterComponent={() =>
              performances.length > 0 ? (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    style={styles.pageBtn}
                  >
                    <Text style={styles.pageBtnText}>이전</Text>
                  </TouchableOpacity>
                  <Text style={styles.pageText}>{page} 페이지</Text>
                  <TouchableOpacity
                    onPress={() => setPage((p) => p + 1)}
                    style={styles.pageBtn}
                  >
                    <Text style={styles.pageBtnText}>다음</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            // 💡 리스트 자체의 하단 내적 여백은 없애거나 줄여서 버튼이 더 올라오게 합니다.
            contentContainerStyle={{ paddingBottom: 0 }}
          />
        </View>
      )}

      {/* 모달 로직 */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {activeFilterType === "DATE" ? (
              <View>
                <Text style={styles.modalTitle}>공연 기간 설정 (최대 7일)</Text>
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
                  <Text style={styles.applyBtnText}>조회하기</Text>
                </TouchableOpacity>
              </View>
            ) : (
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

      {showPicker && (
        <DateTimePicker
          value={showPicker === "START" ? startDate : endDate}
          mode="date"
          onChange={(e, d) => d && handleDateChange(d)}
        />
      )}
    </SafeAreaView>
  );
}

const safeDateToNumber = (dateStr: any): number => {
  if (!dateStr) return 0;
  const cleaned = String(dateStr).replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10);
};

const isDateOverlapping = (
  uStart: number,
  uEnd: number,
  pStart: number,
  pEnd: number,
) => {
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
    alignItems: "center", 
    backgroundColor: '#fff',
    // 💡 아래 여백을 대폭 늘려 버튼을 위로 밀어 올립니다.
    paddingTop: 30,      // 버튼 위쪽 여백
    paddingBottom: 80,   // 버튼 아래쪽 여백 (이 수치를 높일수록 버튼이 위로 올라갑니다)
  },
  pageBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: "#007AFF", // 💡 포인트를 주기 위해 색상 변경 가능
    borderRadius: 10,
  },
  pageBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  pageText: { 
    marginHorizontal: 25, 
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
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
