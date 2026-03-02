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
  Alert,
  Dimensions,
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
  const [hasNextPage, setHasNextPage] = useState(true);
  const [search, setSearch] = useState("");
  const Container = Platform.OS === "web" ? View : SafeAreaView;

  const [category, setCategory] = useState(CATEGORIES[1]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [sortOrder, setSortOrder] = useState(SORT_OPTIONS[0]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<
    "CATE" | "REGION" | "SORT" | "DATE" | null
  >(null);
  const [showPicker, setShowPicker] = useState<"START" | "END" | null>(null);

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );
  const numColumns = screenWidth > 768 ? 2 : 1;

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

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

    filtered.sort((a: any, b: any) => {
      const valA = safeDateToNumber(a.prfpdfrom);
      const valB = safeDateToNumber(b.prfpdfrom);
      return sortOrder.value === "ASC" ? valA - valB : valB - valA;
    });

    // 🔥 21개를 가져와서 다음 페이지 존재 여부 확인
    const displayData = filtered.slice(0, 21);
    
    // 21개가 있으면 다음 페이지 존재
    const hasMore = displayData.length > 20;
    setHasNextPage(hasMore);
    
    // 실제로는 20개만 표시
    setPerformances(displayData.slice(0, 20));
    
  } catch (error) {
    console.error(error);
    setHasNextPage(false);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, [page, category, region, startDate, endDate, sortOrder]);

  const handleDateChange = (selectedDate: Date) => {
    if (showPicker === "START") {
      setStartDate(selectedDate);
      const newEnd = new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      setEndDate(newEnd);
    } else {
      const diffDays =
        (selectedDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays < 0) {
        Platform.OS === "web"
          ? alert("종료일은 시작일보다 빠를 수 없습니다.")
          : Alert.alert("알림", "종료일은 시작일보다 빠를 수 없습니다.");
      } else if (diffDays > 7) {
        Platform.OS === "web"
          ? alert("최대 1주일까지만 조회가 가능합니다.")
          : Alert.alert("기간 제한", "최대 1주일까지만 조회가 가능합니다.");
        setEndDate(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000));
      } else {
        setEndDate(selectedDate);
      }
    }
    setShowPicker(null);
  };

  const webContainerStyle =
    Platform.OS === "web"
      ? {
          position: "absolute" as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "auto" as any,
        }
      : {};

  return (
    <Container style={[styles.container, webContainerStyle]}>
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
      ) : Platform.OS === "web" ? (
        <View style={{ flex: 1, width: "100%" }}>
          <View
            style={{
              flexDirection: numColumns > 1 ? "row" : "column",
              flexWrap: numColumns > 1 ? "wrap" : "nowrap",
            }}
          >
            {performances.map((item) => (
              <TouchableOpacity
                key={item.mt20id}
                style={[
                  styles.card,
                  numColumns > 1 && {
                    width: screenWidth / 2 - 24,
                    marginHorizontal: 8,
                    borderBottomWidth: 1,
                  },
                ]}
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
            ))}
          </View>

          {performances.length > 0 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                style={[
                  styles.pageBtn,
                  page === 1 && styles.pageBtnDisabled, // 비활성 스타일
                ]}
                disabled={page === 1} // 첫 페이지에서 이전 버튼 비활성
              >
                <Text style={[
                  styles.pageBtnText,
                  page === 1 && styles.pageBtnTextDisabled
                ]}>
                  이전
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.pageText}>{page} 페이지</Text>
              
              <TouchableOpacity
                onPress={() => setPage((p) => p + 1)}
                style={[
                  styles.pageBtn,
                  !hasNextPage && styles.pageBtnDisabled, // 🔥 비활성 스타일
                ]}
                disabled={!hasNextPage} // 🔥 다음 페이지 없으면 비활성
              >
                <Text style={[
                  styles.pageBtnText,
                  !hasNextPage && styles.pageBtnTextDisabled
                ]}>
                  다음
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={performances}
          keyExtractor={(item) => item.mt20id}
          numColumns={numColumns}
          key={`list-${numColumns}`}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                numColumns > 1 && {
                  width: screenWidth / 2 - 24,
                  marginHorizontal: 8,
                  borderBottomWidth: 1,
                },
              ]}
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
          ListFooterComponent={() =>
            performances.length > 0 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  style={[
                    styles.pageBtn,
                    page === 1 && styles.pageBtnDisabled,
                  ]}
                  disabled={page === 1}
                >
                  <Text style={[
                    styles.pageBtnText,
                    page === 1 && styles.pageBtnTextDisabled
                  ]}>
                    이전
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.pageText}>{page} 페이지</Text>
                
                <TouchableOpacity
                  onPress={() => setPage((p) => p + 1)}
                  style={[
                    styles.pageBtn,
                    !hasNextPage && styles.pageBtnDisabled,
                  ]}
                  disabled={!hasNextPage}
                >
                  <Text style={[
                    styles.pageBtnText,
                    !hasNextPage && styles.pageBtnTextDisabled
                  ]}>
                    다음
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

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
    </Container>
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
) => pStart <= uEnd && pEnd >= uStart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
    backgroundColor: "#fff",
    paddingTop: 30,
    paddingBottom: 40,
  },
  pageBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  pageBtnDisabled: {
    backgroundColor: "#ccc", // 비활성 배경색
    opacity: 0.5,
  },
  pageBtnText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  pageBtnTextDisabled: {
    color: "#999", // 비활성 텍스트 색상
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
