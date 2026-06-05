import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Expo環境を想定（Vanilla RNの場合は react-native-linear-gradient を使用）
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 7; // 横幅からマージンを除いて7等分

// 曜日のデータ
const DAYS = [
  { label: '月', date: '15' },
  { label: '火', date: '16' },
  { label: '水', date: '17' },
  { label: '木', date: '18' },
  { label: '金', date: '29' }, // 画像通りの表記
  { label: '金', date: '20' },
  { label: '土', date: '29' },
];

export default function ScheduleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <AppHeader />

      {/* メインカード */}
      <View style={styles.card}>
        <View style={styles.titleBadge}>
          <Text style={styles.titleBadgeText}>スケジュール</Text>
        </View>

        {/* 曜日・日付ヘッダー */}
        <View style={styles.weekHeader}>
          {DAYS.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <Text style={styles.dateLabel}>{day.date}</Text>
            </View>
          ))}
        </View>

        {/* スケジュールグリッド（スクロール可能） */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollGrid}>
          <View style={styles.gridRow}>
            {/* 1段目 */}
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}9:00~</Text></View>
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}13:00~</Text></View>
            <View style={[styles.cell, styles.bgEmpty]} />
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}19:00~</Text></View>
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}12:00~</Text></View>
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}19:30~</Text></View>
            <View style={[styles.cell, styles.bgTeal]}><Text style={styles.cellText}>1時間の{"\n"}9:00~</Text></View>
          </View>

          <View style={styles.gridRow}>
            {/* 2段目 */}
            <View style={[styles.cell, styles.bgLime]}><Text style={styles.cellText}>2時間の{"\n"}9:00~</Text></View>
            <View style={[styles.cell, styles.bgLime]}><Text style={styles.cellText}>2時間の{"\n"}19:00~</Text></View>
            <View style={[styles.cell, styles.bgEmptyLime]} />
            <View style={[styles.cell, styles.bgLime]}><Text style={styles.cellText}>2時間の{"\n"}19:00~</Text></View>
            <View style={[styles.cell, styles.bgLime]}><Text style={styles.cellText}>2時間の{"\n"}19:00~</Text></View>
            <View style={[styles.cell, styles.bgLime]}><Text style={styles.cellText}>2時間の{"\n"}19:30~</Text></View>
            <View style={[styles.cell, styles.bgEmpty]} />
          </View>

          <View style={styles.gridRow}>
            {/* 3段目 */}
            <View style={[styles.cell, styles.bgOrange]}><Text style={styles.cellText}>3時間の{"\n"}11:30</Text></View>
            <View style={[styles.cell, styles.bgOrange]}><Text style={styles.cellText}>3時間の{"\n"}11:00~</Text></View>
            <View style={[styles.cell, styles.bgEmptyLime]} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmpty]} />
          </View>

          <View style={styles.gridRow}>
            {/* 4段目 */}
            <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.cell}><Text style={styles.cellText}>4時間の{"\n"}16:00</Text></LinearGradient>
            <LinearGradient colors={['#3b82f6', '#10b981']} style={styles.cell}><Text style={styles.cellText}>4時間の{"\n"}13:00~</Text></LinearGradient>
            <LinearGradient colors={['#fef08a', '#fca5a5']} style={styles.cell} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmpty]} />
          </View>

          <View style={styles.gridRow}>
            {/* 5段目（横結合を簡易再現） */}
            <View style={[styles.cell, styles.bgPinkLight]} />
            <LinearGradient colors={['#a855f7', '#10b981']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.cell, { width: COLUMN_WIDTH * 5 - 4 }]}><Text style={styles.cellTextLeft}>4時間の 15:00~</Text></LinearGradient>
          </View>

          <View style={styles.gridRow}>
            {/* 6段目 */}
            <View style={[styles.cell, styles.bgEmpty]} />
            <View style={[styles.cell, styles.bgPinkLight]} />
            <LinearGradient colors={['#6366f1', '#10b981']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.cell}><Text style={styles.cellText}>5時間の{"\n"}18:00~</Text></LinearGradient>
            <View style={[styles.cell, styles.bgEmptyText]} />
            <View style={[styles.cell, styles.bgEmpty]} />
            <View style={[styles.cell, styles.bgEmpty]} />
            <View style={[styles.cell, styles.bgEmpty]} />
          </View>

          <View style={styles.gridRow}>
            {/* 7段目 */}
            <View style={[styles.cell, styles.bgEmpty]} />
            <LinearGradient colors={['#a855f7', '#10b981']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[styles.cell, { width: COLUMN_WIDTH * 2 - 4 }]}><Text style={styles.cellTextLeft}>6時間の 16:00~</Text></LinearGradient>
          </View>
        </ScrollView>
      </View>

      {/* フッタータブ */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe', // 背景の薄いグラデーションベース
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 24,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleBadge: {
    backgroundColor: '#e2f3f5',
    alignSelf: 'center',
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 5,
    marginBottom: 15,
  },
  titleBadgeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  dayColumn: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollGrid: {
    paddingVertical: 10,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  cell: {
    width: COLUMN_WIDTH - 4,
    height: 52,
    marginHorizontal: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  cellText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellTextLeft: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingLeft: 8,
    alignSelf: 'flex-start',
  },
  /* カラーバリエーション */
  bgTeal: { backgroundColor: '#06b6d4' },
  bgLime: { backgroundColor: '#a3e635' },
  bgOrange: { backgroundColor: '#ca8a04' },
  bgEmpty: { backgroundColor: 'transparent' },
  bgEmptyLime: { backgroundColor: '#fef08a', opacity: 0.3 },
  bgEmptyText: { backgroundColor: '#e2e8f0', opacity: 0.4 },
  bgPinkLight: { backgroundColor: '#fce7f3' },
  /* フッター */
  footer: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerIcon: {
    width: 24,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    marginBottom: 2,
  },
  footerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
});