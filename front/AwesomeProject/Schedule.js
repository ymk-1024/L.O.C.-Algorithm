import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');
const marginHorizontal = 16;
const gridBoxPadding = 24; // p-3 (12px左右で計24px)
const timeColWidth = 45; // 時間軸ラベルの幅
const gridWidth = width - marginHorizontal * 2 - gridBoxPadding - timeColWidth;
const colWidth = gridWidth / 7;
const cardHeight = 62;

// 時間軸ラベルの定義 (行インデックス0〜6に対応)
const TIME_LABELS = [
  '09:00',
  '11:00',
  '13:00',
  '15:00',
  '17:00',
  '19:00',
  '21:00'
];

const colors = {
  green1: { bg: '#1E3D37', text: '#FFFFFF' }, // 1時間 (深緑)
  green2: { bg: '#2D5C52', text: '#FFFFFF' }, // 2時間
  green3: { bg: '#4A7C72', text: '#FFFFFF' }, // 3時間
  green4: { bg: '#70968F', text: '#FFFFFF' }, // 4時間
  green5: { bg: '#8FAEA6', text: '#1E3D37' }, // 5時間
  gray:   { bg: '#7E8B93', text: '#FFFFFF' }, // 6時間 (グレー)
  empty:  { bg: '#F4F5F7', border: '#E5E5EA' }, // 空白
};

// スケジュールデータ（縦長バーティカル構造）
// dayIndex: 0 (月) 〜 6 (日)
// rowIndex: 0 (09:00), 1 (11:00), 2 (13:00), 3 (15:00), 4 (17:00), 5 (19:00), 6 (21:00)
// hours: 予定の長さ。rowSpan = Math.max(1, Math.round(hours / 2))
const SCHEDULE_EVENTS_EVEN = [
  // 月曜
  { dayIndex: 0, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 0, rowIndex: 2, hours: 3, time: '13:00 - 16:00', type: 'green3' },
  { dayIndex: 0, rowIndex: 5, hours: 4, time: '19:00 - 23:00', type: 'green4' },
  
  // 火曜〜土曜のデイリー予定 (元々の span: 5 予定を各曜日に縦長配置)
  { dayIndex: 1, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green5' },
  { dayIndex: 2, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green5' },
  { dayIndex: 3, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green5' },
  { dayIndex: 4, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green5' },
  { dayIndex: 5, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green5' },

  // その他予定
  { dayIndex: 1, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 1, rowIndex: 1, hours: 2, time: '11:00 - 13:00', type: 'green2' },
  { dayIndex: 1, rowIndex: 6, hours: 2, time: '21:00 - 23:00', type: 'gray' },

  { dayIndex: 2, rowIndex: 5, hours: 3, time: '19:00 - 22:00', type: 'green3' },

  { dayIndex: 3, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 3, rowIndex: 1, hours: 2, time: '11:00 - 13:00', type: 'green2' },

  { dayIndex: 4, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 4, rowIndex: 5, hours: 2, time: '19:00 - 21:00', type: 'green2' },

  { dayIndex: 5, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 5, rowIndex: 5, hours: 2, time: '19:00 - 21:00', type: 'green2' },

  { dayIndex: 6, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
];

const SCHEDULE_EVENTS_ODD = [
  // 奇数週
  { dayIndex: 0, rowIndex: 1, hours: 4, time: '11:00 - 15:00', type: 'green2' },
  { dayIndex: 0, rowIndex: 4, hours: 6, time: '17:00 - 23:00', type: 'gray' },
  
  { dayIndex: 1, rowIndex: 2, hours: 2, time: '13:00 - 15:00', type: 'green3' },
  { dayIndex: 1, rowIndex: 5, hours: 4, time: '19:00 - 23:00', type: 'green5' },

  // 水曜〜金曜にまたがっていた予定を個別に縦長配置
  { dayIndex: 2, rowIndex: 0, hours: 4, time: '09:00 - 13:00', type: 'green4' },
  { dayIndex: 3, rowIndex: 0, hours: 4, time: '09:00 - 13:00', type: 'green4' },
  { dayIndex: 4, rowIndex: 0, hours: 4, time: '09:00 - 13:00', type: 'green4' },

  { dayIndex: 2, rowIndex: 3, hours: 2, time: '15:00 - 17:00', type: 'green1' },
  { dayIndex: 4, rowIndex: 4, hours: 2, time: '17:00 - 19:00', type: 'green2' },

  { dayIndex: 5, rowIndex: 1, hours: 4, time: '11:00 - 15:00', type: 'green3' },
  { dayIndex: 5, rowIndex: 3, hours: 4, time: '15:00 - 19:00', type: 'green4' },

  { dayIndex: 6, rowIndex: 0, hours: 2, time: '09:00 - 11:00', type: 'green1' },
  { dayIndex: 6, rowIndex: 5, hours: 4, time: '19:00 - 23:00', type: 'gray' },
];

export default function Schedule({ navigation }) {
  const insets = useSafeAreaInsets();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const changeWeek = (offsetWeeks) => {
    const nextMonday = new Date(currentWeekStart);
    nextMonday.setDate(currentWeekStart.getDate() + offsetWeeks * 7);
    setCurrentWeekStart(nextMonday);
  };

  const setTodayWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getYearMonthLabel = () => {
    const year = currentWeekStart.getFullYear();
    const month = currentWeekStart.getMonth() + 1;
    return `${year}年 ${month}月`;
  };

  const getDays = () => {
    const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const isToday = date.getTime() === today.getTime();
      return {
        key: i,
        label: weekdays[i],
        date: date.getDate().toString(),
        isToday,
      };
    });
  };

  const weekTime = currentWeekStart.getTime();
  const isEvenWeek = Math.floor(weekTime / (1000 * 60 * 60 * 24 * 7)) % 2 === 0;
  const events = isEvenWeek ? SCHEDULE_EVENTS_EVEN : SCHEDULE_EVENTS_ODD;

  return (
    <View style={tw`flex-1 bg-[#F7F9FB]`}>
      <AppHeader />

      <ScrollView contentContainerStyle={tw`px-[${marginHorizontal}px] pb-6`}>
        {/* Title Banner */}
        <View style={tw`bg-[#EAF6F3] rounded-[20px] py-4 px-6 mb-4 items-center`}>
          <Text style={tw`text-[26px] font-bold text-[#1E3D37]`}>スケジュール</Text>
        </View>

        {/* Week Navigation */}
        <View style={tw`flex-row justify-between items-center mb-4 px-2`}>
          <TouchableOpacity
            onPress={() => changeWeek(-1)}
            style={tw`bg-[#1E3D37]/10 w-9 h-9 rounded-full items-center justify-center`}
          >
            <Text style={tw`text-[#1E3D37] font-bold text-[18px]`}>‹</Text>
          </TouchableOpacity>

          <View style={tw`flex-row items-center gap-3`}>
            <Text style={tw`text-[18px] font-bold text-[#1C1C1E]`}>
              {getYearMonthLabel()}
            </Text>
            <TouchableOpacity
              onPress={setTodayWeek}
              style={tw`bg-[#1E3D37] px-3 py-1 rounded-full`}
            >
              <Text style={tw`text-white text-[12px] font-bold`}>今日</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => changeWeek(1)}
            style={tw`bg-[#1E3D37]/10 w-9 h-9 rounded-full items-center justify-center`}
          >
            <Text style={tw`text-[#1E3D37] font-bold text-[18px]`}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule Grid Box */}
        <View style={tw`bg-white rounded-[24px] p-3 shadow-sm border border-[#EAEAEA]`}>
          
          {/* Days Header */}
          <View style={tw`flex-row border-b border-[#F2F2F7] pb-3 mb-2`}>
            <View style={{ width: timeColWidth }} />
            {getDays().map((day) => (
              <View key={day.key} style={{ width: colWidth, alignItems: 'center' }}>
                <Text style={tw`text-[13px] font-medium text-[#7E8B93] mb-1`}>{day.label}</Text>
                <View style={[
                  tw`w-7 h-7 rounded-full items-center justify-center`,
                  day.isToday && tw`bg-[#1E3D37]`
                ]}>
                  <Text style={[
                    tw`text-[15px] font-bold`,
                    day.isToday ? tw`text-white` : tw`text-[#1C1C1E]`
                  ]}>
                    {day.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Grid Layout Container */}
          <View style={tw`flex-row relative`}>
            
            {/* Y軸: 時間軸ラベル */}
            <View style={{ width: timeColWidth, justifyContent: 'space-between', paddingVertical: 4 }}>
              {TIME_LABELS.map((label, index) => (
                <View key={index} style={{ height: cardHeight, justifyContent: 'flex-start' }}>
                  <Text style={tw`text-[11px] font-semibold text-[#8E8E93] text-right pr-2`}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>

            {/* グリッド本体 (背景破線枠 + absoluteイベント) */}
            <View style={{ flex: 1, height: cardHeight * 7, position: 'relative' }}>
              
              {/* 背景破線グリッド */}
              <View style={tw`absolute inset-0 flex-row`}>
                {Array.from({ length: 7 }).map((_, colIndex) => (
                  <View key={colIndex} style={{ width: colWidth }}>
                    {Array.from({ length: 7 }).map((_, rowIndex) => (
                      <View
                        key={rowIndex}
                        style={[
                          tw`rounded-[8px] border border-dashed`,
                          {
                            height: cardHeight - 4,
                            margin: 2,
                            backgroundColor: colors.empty.bg,
                            borderColor: colors.empty.border,
                          }
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* スケジュールカード (Absolute レイヤー) */}
              {events.map((event, index) => {
                const colorScheme = colors[event.type] || colors.green1;
                // hours（予定の長さ）に応じて縦方向のコマ数（rowSpan）を計算
                const rowSpan = Math.max(1, Math.round(event.hours / 2));
                // 狭い列幅でも崩れないよう、ハイフン区切りを改行に置換
                const displayTime = event.time.replace(' - ', '\n');

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={[
                      tw`rounded-[8px] p-[2px] justify-center items-center absolute`,
                      {
                        left: event.dayIndex * colWidth + 2,
                        top: event.rowIndex * cardHeight + 2,
                        width: colWidth - 4, // 横は1日分に固定
                        height: rowSpan * cardHeight - 4, // 縦の時間を hours に応じて伸ばす
                        backgroundColor: colorScheme.bg,
                        zIndex: 10,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        tw`font-bold text-center leading-[11px]`,
                        {
                          fontSize: rowSpan > 1 ? 10 : 8,
                          color: colorScheme.text,
                        }
                      ]}
                    >
                      {displayTime}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            </View>
          </View>

        </View>
      </ScrollView>

      {/* Fixed bottom navigation */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation} />
    </View>
  );
}