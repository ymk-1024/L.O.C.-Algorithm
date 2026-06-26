import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';
import { useIsFocused } from '@react-navigation/native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');
const marginHorizontal = 16;
const CARD_PADDING = 20; // 左右パディング
const CHART_WIDTH = width - marginHorizontal * 2 - CARD_PADDING * 2; // グラフの横幅
const CHART_HEIGHT = 140; // グラフの高さ

// グラフデータ（Jan〜Aug）
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const BAR_VALUES = [50, 95, 60, 85, 100, 90, 115, 95]; // 棒グラフの高さ

export default function RecordScreen({ navigation }) {
  const isFocused = useIsFocused();

  return (
    <View style={tw`flex-1 bg-[#F7F9FB]`}>
      {/* ヘッダー */}
      <AppHeader />

      <ScrollView contentContainerStyle={tw`px-[${marginHorizontal}px] pb-6`} scrollEnabled={true}>
        {/* Title Banner */}
        <View style={tw`bg-[#EAF6F3] rounded-[20px] py-4 px-6 mb-4 items-center`}>
          <Text style={tw`text-[26px] font-bold text-[#1E3D37]`}>記録</Text>
        </View>

        {/* メインカード */}
        <View style={tw`bg-white rounded-[24px] p-5 shadow-sm border border-[#EAEAEA] mb-4`}>
          {/* 着席時間情報 */}
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={tw`text-[18px] font-bold text-[#1E3D37]`}>着席時間</Text>
            <View style={tw`items-end`}>
              <Text style={tw`text-[15px] font-semibold text-[#1C1C1E] mb-1`}>本日：3時間</Text>
              <Text style={tw`text-[13px] font-medium text-[#7E8B93]`}>週間平均：6時間</Text>
            </View>
          </View>

          {/* グラフエリア */}
          <View style={tw`bg-[#F4F6F5] rounded-[16px] pt-4 pb-2 px-1 items-center mb-5 border border-[#EAEAEA]`}>
            {isFocused && (
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                  {/* アースカラー調の縦グラデーション */}
                  <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#389f76b5" />
                    <Stop offset="100%" stopColor="#175c47b3" />
                  </LinearGradient>
                </Defs>

                {/* Y軸 */}
                <Line x1="15" y1="10" x2="15" y2="130" stroke="#777777" strokeWidth="2" />
                {/* X軸 */}
                <Line x1="15" y1="130" x2={CHART_WIDTH - 5} y2="130" stroke="#777777" strokeWidth="2" />

                {/* 棒グラフの描画 */}
                {BAR_VALUES.map((val, index) => {
                  const barWidth = 15;
                  const spacing = (CHART_WIDTH - 30) / 8;
                  const x = 19 + index * spacing + spacing / 2; // 中央揃えの補正
                  const y = 130 - val; // 130 から引くことで底辺に合わせる
                  return (
                    <Rect
                      key={index}
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={val}
                      fill="url(#barGrad)"
                      rx="4"
                    />
                  );
                })}
              </Svg>
            )}

            {/* X軸のラベル（月名） */}
            <View style={{
              flexDirection: 'row',
              width: CHART_WIDTH - 20,
              justifyContent: 'space-between',
              paddingLeft: 10,
              marginTop: 6
            }}>
              {MONTHS.map((month, index) => {
                const spacing = (CHART_WIDTH - 30) / 8;
                return (
                  <Text key={index} style={[
                    tw`text-[11px] font-semibold text-[#8E8E93] text-center`,
                    { width: spacing }
                  ]}>
                    {month}
                  </Text>
                );
              })}
            </View>
          </View>

          {/* 下部ステータスパネル（3列） */}
          <View style={tw`flex-row justify-between mb-4`}>
            {/* 左 */}
            <View style={tw`w-[31%] bg-[#F8FAF9] border border-[#EAEAEA] rounded-[16px] py-3 items-center`}>
              <Text style={tw`text-[11px] font-bold text-[#8E8E93] mb-1`}>平均</Text>
              <Text style={tw`text-[20px] font-bold text-[#3B5E4F]`}>3:30</Text>
              <Text style={tw`text-[9px] text-[#7E8B93] font-medium text-center mt-1 px-1`}>連続着席</Text>
            </View>

            {/* 中央 */}
            <View style={tw`w-[31%] bg-[#F8FAF9] border border-[#EAEAEA] rounded-[16px] py-3 items-center`}>
              <Text style={tw`text-[11px] font-bold text-[#8E8E93] mb-1`}>目標</Text>
              <Text style={tw`text-[20px] font-bold text-[#C86A53]`}>27.50</Text>
              <Text style={tw`text-[9px] text-[#7E8B93] font-medium text-center mt-1 px-1`}>達成スコア</Text>
            </View>

            {/* 右 */}
            <View style={tw`w-[31%] bg-[#EAF6F3] border border-[#CDE5E0] rounded-[16px] py-3 items-center justify-center`}>
              <Text style={tw`text-[20px] font-bold text-[#1E3D37]`}>100%</Text>
              <Text style={tw`text-[9px] text-[#1E3D37]/75 font-semibold text-center mt-1`}>目標達成率</Text>
            </View>
          </View>

          {/* 説明テキストエリア */}
          <View style={tw`bg-[#F8FAF9] rounded-[16px] p-4 border border-[#EAEAEA]`}>
            <Text style={tw`text-[13px] font-medium text-[#5C6E67] text-center leading-[20px] mb-1`}>
              本日の着席時間は3時間で、週間平均の6時間よりも短く抑えられています。
            </Text>
            <Text style={tw`text-[12px] font-medium text-[#8E8E93] text-center leading-[18px]`}>
              適度な起立を心がけ、センサーによる姿勢分析データを活用しましょう。
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* フッタータブ */}
      <BottomMenuBar activeTab="Records" navigation={navigation} />
    </View>
  );
}