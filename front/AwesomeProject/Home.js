import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';
import { getApiUrl } from './utils/api';

export default function HomeScreen({ navigation }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/auth/me`);
        if (!response.ok) {
          // 未ログインならAccountへ強制遷移
          navigation.reset({ index: 0, routes: [{ name: 'Account' }] });
        } else {
          setIsCheckingAuth(false);
        }
      } catch (e) {
        navigation.reset({ index: 0, routes: [{ name: 'Account' }] });
      }
    };
    checkAuth();
    const unsubscribe = navigation.addListener('focus', checkAuth);
    return unsubscribe;
  }, [navigation]);

  if (isCheckingAuth) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  // 画像のグラデーションカラーに近い色を割り当てた棒データ
  const barData = [
    { value: 2.2, label: '1時間', frontColor: '#A3E2C9' },
    { value: 3.5, label: '2時間', frontColor: '#A9DDA1' },
    { value: 2.5, label: '3時間', frontColor: '#B6D879' },
    { value: 5.2, label: '4時間', frontColor: '#4ECDC4' },
    { value: 5.0, label: '6時間', frontColor: '#1A939E' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

        </View>
      </ScrollView>

      {/* 最下部の共通ボトムメニューバー */}
      <BottomMenuBar activeTab="Home" navigation={navigation}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FB', // アカウント・設定画面と共通の背景色
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
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