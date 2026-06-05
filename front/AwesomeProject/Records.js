import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Line, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const CHART_WIDTH = width - 40 - (CARD_PADDING * 2); // グラフの横幅
const CHART_HEIGHT = 160; // グラフの高さ

// グラフデータ（Jan〜Aug）
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const BAR_VALUES = [50, 95, 60, 85, 130, 90, 115, 95]; // 棒グラフの高さ（仮値）
const LINE_POINTS = "25,110 65,95 105,115 145,100 185,105 225,110 265,95 305,95"; // 折れ線の座標（仮値）

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <AppHeader />

      {/* メインカード */}
      <View style={styles.card}>
        <View style={styles.titleBadge}>
          <Text style={styles.titleBadgeText}>記録</Text>
        </View>

        {/* 着席時間情報 */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>着席時間</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>本日：3時間</Text>
            <Text style={styles.infoValue}>週間平均：6時間</Text>
          </View>
        </View>

        {/* グラフエリア */}
        <View style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              {/* 縦グラデーションの定義 */}
              <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#a3e635" />
                <Stop offset="50%" stopColor="#3b82f6" />
                <Stop offset="100%" stopColor="#ec4899" />
              </LinearGradient>
            </Defs>

            {/* Y軸（左の縦線） */}
            <Line x1="15" y1="10" x2="15" y2="130" stroke="#cbd5e1" strokeWidth="2" />
            {/* X軸（下の横線） */}
            <Line x1="15" y1="130" x2={CHART_WIDTH - 5} y2="130" stroke="#cbd5e1" strokeWidth="2" />

            {/* 棒グラフの描画 */}
            {BAR_VALUES.map((val, index) => {
              const barWidth = 16;
              const spacing = (CHART_WIDTH - 30) / 8;
              const x = 25 + index * spacing;
              const y = 130 - val;
              return (
                <Rect
                  key={index}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={val}
                  fill="url(#barGrad)"
                  rx="3" // 角丸
                />
              );
            })}

            {/* 折れ線グラフ */}
            <Polyline
              points={LINE_POINTS}
              fill="none"
              stroke="#f8fafc"
              strokeWidth="2"
            />
          </Svg>

          {/* X軸のラベル（月名） */}
          <View style={styles.monthsRow}>
            {MONTHS.map((month, index) => (
              <Text key={index} style={styles.monthText}>{month}</Text>
            ))}
          </View>
        </View>

        {/* 下部ステータスパネル（3列） */}
        <View style={styles.statusGrid}>
          {/* 左 */}
          <View style={styles.statusBox}>
            <Text style={styles.statusNumTop}>3</Text>
            <Text style={styles.statusNumMain}>3:30</Text>
            <Text style={styles.statusLabel}>平均連続着席時間</Text>
          </View>

          {/* 中央 */}
          <View style={styles.statusBox}>
            <Text style={styles.statusNumTop}>6</Text>
            <Text style={styles.statusNumMain}>27.50</Text>
            <Text style={styles.statusLabel}>平均連続着席時間</Text>
          </View>

          {/* 右 */}
          <View style={[styles.statusBox, styles.bgLightTeal]}>
            <Text style={[styles.statusNumMain, { marginTop: 15 }]}>100%</Text>
            <Text style={[styles.statusLabel, { marginTop: 5 }]}>100%</Text>
          </View>
        </View>
      </View>

      {/* 説明テキストエリア */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionText}>
          着席時間の着席時間は、週間平均：6時間
        </Text>
        <Text style={styles.descriptionText}>
          携方法と詳細細設定を選択してください。
        </Text>
      </View>

      {/* フッタータブ */}
      <BottomMenuBar activeTab="Records" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
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
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 24,
    padding: CARD_PADDING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  titleBadge: {
    backgroundColor: '#e2f3f5',
    alignSelf: 'flex-start',
    paddingHorizontal: 30,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  titleBadgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'between',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  infoValueContainer: {
    alignItems: 'flex-end',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  chartContainer: {
    backgroundColor: '#f0fdf4', // 薄いグリーンのグラフ背景
    borderRadius: 16,
    paddingTop: 15,
    paddingBottom: 5,
    paddingHorizontal: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  monthsRow: {
    flexDirection: 'row',
    width: CHART_WIDTH - 20,
    justifyContent: 'space-between',
    paddingLeft: 10,
    marginTop: 2,
  },
  monthText: {
    fontSize: 11,
    color: '#000',
    width: (CHART_WIDTH - 20) / 8,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBox: {
    width: (width - 70) / 3,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bgLightTeal: {
    backgroundColor: '#f0fdfa',
    borderColor: '#ccfbf1',
  },
  statusNumTop: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  statusNumMain: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statusLabel: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  descriptionContainer: {
    paddingHorizontal: 30,
    marginTop: 20,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerIconContainer: {
    marginBottom: 2,
  },
  footerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
});