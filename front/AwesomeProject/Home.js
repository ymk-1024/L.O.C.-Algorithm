import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons'; 
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  // 画像のグラデーションカラーに近い色を割り当てた棒データ
  const barData = [
    { value: 2.2, label: '1時間', frontColor: '#A3E2C9' },
    { value: 3.5, label: '2時間', frontColor: '#A9DDA1' },
    { value: 2.5, label: '3時間', frontColor: '#B6D879' },
    { value: 5.2, label: '4時間', frontColor: '#4ECDC4' },
    { value: 5.0, label: '6時間', frontColor: '#1A939E' },
  ];

  return (
    <View style={styles.screenContainer}>
      {/* <AppHeader /> */}

      {/* メインのコンテナカード */}
      <View style={styles.card}>
        
        {/* 有効化切り替え */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>有効化</Text>
          <View style={[styles.switchWrapper, isEnabled && styles.switchWrapperActive]}>
            <Switch
              trackColor={{ false: 'transparent', true: 'transparent' }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="transparent"
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
        </View>

        {/* 着席時間情報 */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>着席時間</Text>
          <View style={styles.infoRight}>
            <Text style={styles.infoValue}>本日：3時間</Text>
            <Text style={styles.infoValueSub}>週間平均：6時間</Text>
          </View>
        </View>

        {/* グラフエリア */}
        <View style={styles.chartContainer}>
          <BarChart
            data={barData}
            barWidth={24}
            spacing={20}
            roundedTop
            radius={6}
            hideRules
            xAxisThickness={1}
            xAxisColor="#E2E8F0"
            yAxisThickness={0}
            hideYAxisText
            maxValue={7}
            height={150}
            initialSpacing={15}
            noOfSections={3}
            labelTextStyle={styles.chartLabel}
          />
        </View>

        {/* 下部アクションエリア */}
        <BottomMenuBar activeTab="Home" navigation={navigation}/>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#EBF4F6', // 画像の背景グラデーションに近い淡いベースカラー
    alignItems: 'center',
    paddingTop: 60,
  },
  header: {
    width: width * 0.9,
    marginBottom: 20,
    alignItems: 'flex-start',
    paddingHorizontal: 5,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldLogo: {
    width: 38,
    height: 42,
    backgroundColor: '#607D8B',
    borderRadius: 6,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#CFD8DC',
  },
  shieldText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: 0.5,
  },
  card: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rowLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
  },
  switchWrapper: {
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 2,
    justifyContent: 'center',
    height: 32,
    width: 52,
  },
  switchWrapperActive: {
    backgroundColor: '#A3E2C9', // 画像のトグル背景色（ミントグリーン）
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 2,
  },
  infoRight: {
    alignItems: 'flex-end',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  infoValueSub: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingLeft: 10,
  },
  chartLabel: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
  },
  settingsButton: {
    padding: 4,
  },
  detailLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    textDecorationLine: 'underline',
  },
});