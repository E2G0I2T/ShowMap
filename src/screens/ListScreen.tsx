import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { fetchPerformances, FetchParams } from '../api/performanceApi';

export default function ListScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [performances, setPerformances] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('GGGA'); // 기본 뮤지컬

  const loadData = async () => {
    setLoading(true);
    const params: FetchParams = {
      cpage: page,
      shcate: category,
      shnm: search,
      stdate: '20260101',
      eddate: '20261231',
    };
    const data = await fetchPerformances(params);
    setPerformances(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [page, category]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Detail', { item })}
    >
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.prfnm}</Text>
        <Text style={styles.venue}>{item.fcltynm} | {item.area}</Text>
        <Text style={styles.date}>{item.prfpdfrom} ~ {item.prfpdto}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput 
          style={styles.input} 
          placeholder="공연명을 입력하고 엔터를 누르세요" 
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => { setPage(1); loadData(); }}
        />
      </View>

      <View style={styles.filterRow}>
        {[ {label:'뮤지컬', code:'GGGA'}, {label:'연극', code:'AAAA'}, {label:'클래식', code:'CCCA'} ].map((item) => (
          <TouchableOpacity 
            key={item.code} 
            style={[styles.filterBtn, category === item.code && styles.activeFilter]}
            onPress={() => { setCategory(item.code); setPage(1); }}
          >
            <Text style={category === item.code ? {color:'#fff'} : {}}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" style={{flex:1}} /> : (
        <FlatList 
          data={performances}
          keyExtractor={(item) => item.mt20id}
          renderItem={renderItem}
          ListFooterComponent={() => (
            <View style={styles.pagination}>
              <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))}><Text>이전</Text></TouchableOpacity>
              <Text style={{marginHorizontal: 20}}>{page} 페이지</Text>
              <TouchableOpacity onPress={() => setPage(p => p + 1)}><Text>다음</Text></TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { padding: 15, backgroundColor: '#f0f0f0' },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  filterRow: { flexDirection: 'row', padding: 10 },
  filterBtn: { paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 10, borderRadius: 20 },
  activeFilter: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  card: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  poster: { width: 60, height: 80, borderRadius: 4 },
  info: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  title: { fontWeight: 'bold', fontSize: 16 },
  venue: { color: '#666', marginTop: 4 },
  date: { color: '#999', fontSize: 12, marginTop: 2 },
  pagination: { flexDirection: 'row', justifyContent: 'center', padding: 20, alignItems: 'center' }
});