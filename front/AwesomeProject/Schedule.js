import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');
const marginHorizontal = 16;
const gridBoxPadding = 24; // p-3 (12px左右で計24px)
const timeColWidth = 45; // 時間軸ラベルの幅
const colWidth = 75; // 1列の幅を75pxに固定し、横スクロールによるスライド対応とする
const cardHeight = 62;

// 時間軸ラベルの定義 (00:00〜22:00の12行構成)
const TIME_LABELS = [
  '00:00',
  '02:00',
  '04:00',
  '06:00',
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
  '20:00',
  '22:00'
];

const colors = {
  green1: { bg: '#E8F0EC', bar: '#3B5E4F', text: '#3B5E4F' }, // セージ
  green2: { bg: '#FDF0ED', bar: '#C86A53', text: '#C86A53' }, // テラコッタ
  green3: { bg: '#EDF3F6', bar: '#5A8296', text: '#5A8296' }, // ダスティブルー
  green4: { bg: '#FDF7EA', bar: '#C69E4B', text: '#C69E4B' }, // マスタード
  green5: { bg: '#F6EFF4', bar: '#8E6B82', text: '#8E6B82' }, // モーブ
  gray:   { bg: '#F0F2F4', bar: '#6E7A8A', text: '#6E7A8A' }, // スレートグレー
  empty:  { bg: '#F4F5F7', border: '#E5E5EA' }, // 空白
};

// スケジュールデータ（縦長バーティカル構造）
const SCHEDULE_EVENTS_EVEN = [
  // 月曜
  { dayIndex: 0, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 0, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green2' }, // 重なりテスト
  { dayIndex: 0, rowIndex: 6, hours: 3, time: '12:00 - 15:00', type: 'green3' },
  { dayIndex: 0, rowIndex: 9, hours: 4, time: '18:00 - 22:00', type: 'green4' },
  
  // 火曜〜土曜のデイリー予定 (16:00 - 20:00)
  { dayIndex: 1, rowIndex: 8, hours: 4, time: '16:00 - 20:00', type: 'green5' },
  { dayIndex: 2, rowIndex: 8, hours: 4, time: '16:00 - 20:00', type: 'green5' },
  { dayIndex: 3, rowIndex: 8, hours: 4, time: '16:00 - 20:00', type: 'green5' },
  { dayIndex: 4, rowIndex: 8, hours: 4, time: '16:00 - 20:00', type: 'green5' },
  { dayIndex: 5, rowIndex: 8, hours: 4, time: '16:00 - 20:00', type: 'green5' },

  // その他予定
  { dayIndex: 1, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 1, rowIndex: 5, hours: 2, time: '10:00 - 12:00', type: 'green2' },
  { dayIndex: 1, rowIndex: 10, hours: 2, time: '20:00 - 22:00', type: 'gray' },

  { dayIndex: 2, rowIndex: 9, hours: 3, time: '18:00 - 21:00', type: 'green3' },

  { dayIndex: 3, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 3, rowIndex: 5, hours: 2, time: '10:00 - 12:00', type: 'green2' },

  { dayIndex: 4, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 4, rowIndex: 9, hours: 2, time: '18:00 - 20:00', type: 'green2' },

  { dayIndex: 5, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 5, rowIndex: 9, hours: 2, time: '18:00 - 20:00', type: 'green2' },

  { dayIndex: 6, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
];

const SCHEDULE_EVENTS_ODD = [
  // 奇数週
  { dayIndex: 0, rowIndex: 5, hours: 4, time: '10:00 - 14:00', type: 'green2' },
  { dayIndex: 0, rowIndex: 8, hours: 6, time: '16:00 - 22:00', type: 'gray' },
  
  { dayIndex: 1, rowIndex: 6, hours: 2, time: '12:00 - 14:00', type: 'green3' },
  { dayIndex: 1, rowIndex: 9, hours: 4, time: '18:00 - 22:00', type: 'green5' },

  // 水曜〜金曜
  { dayIndex: 2, rowIndex: 4, hours: 4, time: '08:00 - 12:00', type: 'green4' },
  { dayIndex: 3, rowIndex: 4, hours: 4, time: '08:00 - 12:00', type: 'green4' },
  { dayIndex: 3, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' }, // 重なりテスト
  { dayIndex: 4, rowIndex: 4, hours: 4, time: '08:00 - 12:00', type: 'green4' },

  { dayIndex: 2, rowIndex: 7, hours: 2, time: '14:00 - 16:00', type: 'green1' },
  { dayIndex: 4, rowIndex: 8, hours: 2, time: '16:00 - 18:00', type: 'green2' },

  { dayIndex: 5, rowIndex: 5, hours: 4, time: '10:00 - 14:00', type: 'green3' },
  { dayIndex: 5, rowIndex: 7, hours: 4, time: '14:00 - 18:00', type: 'green4' },

  { dayIndex: 6, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 6, rowIndex: 9, hours: 4, time: '18:00 - 22:00', type: 'gray' },
];

export default function Schedule({ navigation }) {
  const insets = useSafeAreaInsets();
  const headerScrollRef = useRef(null);
  const gridScrollRef = useRef(null);
  const activeScrollSource = useRef(null); // 'header', 'grid', または null

  const handleGridScroll = (event) => {
    if (activeScrollSource.current === 'header') return;
    const x = event.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });
  };

  const handleHeaderScroll = (event) => {
    if (activeScrollSource.current === 'grid') return;
    const x = event.nativeEvent.contentOffset.x;
    gridScrollRef.current?.scrollTo({ x, animated: false });
  };

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
  const rawEvents = isEvenWeek ? SCHEDULE_EVENTS_EVEN : SCHEDULE_EVENTS_ODD;

  const processOverlaps = (eventsList) => {
    const daysEvents = Array.from({ length: 7 }, () => []);
    eventsList.forEach((e) => {
      const rowIndex = Number(e.rowIndex);
      const hours = Number(e.hours);
      const startMin = rowIndex * 120;
      const endMin = startMin + hours * 60;
      daysEvents[e.dayIndex].push({
        ...e,
        startMin,
        endMin,
        rowIndex,
        hours,
      });
    });

    daysEvents.forEach((dayEvents) => {
      if (dayEvents.length === 0) return;

      dayEvents.sort((a, b) => {
        if (a.startMin !== b.startMin) {
          return a.startMin - b.startMin;
        }
        return b.endMin - a.endMin;
      });

      const merged = [];
      dayEvents.forEach((event) => {
        if (merged.length === 0) {
          merged.push({ ...event });
        } else {
          const last = merged[merged.length - 1];
          if (event.startMin < last.endMin) {
            last.endMin = Math.max(last.endMin, event.endMin);
            last.hours = (last.endMin - last.startMin) / 60;
          } else {
            merged.push({ ...event });
          }
        }
      });

      dayEvents.length = 0;
      merged.forEach((event) => {
        const rowSpan = Math.max(1, Math.round(event.hours / 2));
        const startHour = Math.floor(event.startMin / 60);
        const startMinPart = event.startMin % 60;
        const endHour = Math.floor(event.endMin / 60);
        const endMinPart = event.endMin % 60;

        const pad = (num) => String(num).padStart(2, '0');
        const timeStr = `${pad(startHour)}:${pad(startMinPart)} - ${pad(endHour)}:${pad(endMinPart)}`;

        const h = Math.floor(event.hours);
        const m = Math.round((event.hours - h) * 60);
        const durationText = m > 0 ? `${h}時間${m}分` : `${h}時間`;

        dayEvents.push({
          ...event,
          rowSpan,
          rowIndex: event.startMin / 120,
          time: timeStr,
          durationText,
          overlapIndex: 0,
          overlapCount: 1,
        });
      });
    });

    return daysEvents.flat();
  };

  const events = processOverlaps(rawEvents);

  return (
    <View style={tw`flex-1 bg-[#F7F9FB]`}>
      <AppHeader />

      {/* 縦にスクロールしない上部エリア */}
      <View style={tw`px-[${marginHorizontal}px] pt-2 pb-1`}>
        {/* Week Navigation */}
        <View style={tw`flex-row justify-between items-center mb-3 px-2`}>
          <TouchableOpacity
            onPress={() => changeWeek(-1)}
            style={tw`bg-[#1E3D37]/10 w-9 h-9 rounded-full items-center justify-center`}
          >
            <Text style={tw`text-[#1E3D37] font-bold text-[18px]`}>‹</Text>
          </TouchableOpacity>

          <View style={tw`items-center`}>
            <Text style={tw`text-[10px] font-bold text-[#1E3D37]/60 tracking-wider mb-[2px]`}>SCHEDULE</Text>
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
          </View>

          <TouchableOpacity
            onPress={() => changeWeek(1)}
            style={tw`bg-[#1E3D37]/10 w-9 h-9 rounded-full items-center justify-center`}
          >
            <Text style={tw`text-[#1E3D37] font-bold text-[18px]`}>›</Text>
          </TouchableOpacity>
        </View>

        {/* カレンダーヘッダーボックス (曜日のみ、縦に固定され横スクロール可能) */}
        <View style={tw`bg-white rounded-t-[24px] pt-4 px-3 border-t border-l border-r border-[#EAEAEA] flex-row`}>
          {/* 左端の余白 (時間軸ラベル幅分) */}
          <View style={{ width: timeColWidth }} />
          
          {/* 曜日ヘッダー用の横スクロールビュー */}
          <ScrollView
            ref={headerScrollRef}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleHeaderScroll}
            onScrollBeginDrag={() => { activeScrollSource.current = 'header'; }}
            onMomentumScrollBegin={() => { activeScrollSource.current = 'header'; }}
            onScrollEndDrag={() => { activeScrollSource.current = null; }}
            onMomentumScrollEnd={() => { activeScrollSource.current = null; }}
            contentContainerStyle={{ width: colWidth * 7 }}
          >
            <View style={tw`flex-row border-b border-[#F2F2F7] pb-3 mb-1`}>
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
          </ScrollView>
        </View>
      </View>

      {/* 縦にスクロールするグリッド本体エリア */}
      <View style={tw`flex-1 px-[${marginHorizontal}px] pb-6`}>
        <View style={tw`flex-1 bg-white rounded-b-[24px] pb-3 px-3 border-b border-l border-r border-[#EAEAEA]`}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ pb: 16 }}
          >
            <View style={tw`flex-row`}>
              {/* 左端: 固定時間軸ラベル */}
              <View style={{ width: timeColWidth, paddingTop: 4 }}>
                <View style={{ justifyContent: 'space-between', height: cardHeight * TIME_LABELS.length, paddingVertical: 4 }}>
                  {TIME_LABELS.map((label, index) => (
                    <View key={index} style={{ height: cardHeight, justifyContent: 'flex-start' }}>
                      <Text style={tw`text-[11px] font-semibold text-[#8E8E93] text-right pr-2`}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 右側: 横スクロール可能なスケジュールグリッド */}
              <ScrollView
                ref={gridScrollRef}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleGridScroll}
                onScrollBeginDrag={() => { activeScrollSource.current = 'grid'; }}
                onMomentumScrollBegin={() => { activeScrollSource.current = 'grid'; }}
                onScrollEndDrag={() => { activeScrollSource.current = null; }}
                onMomentumScrollEnd={() => { activeScrollSource.current = null; }}
                contentContainerStyle={{ width: colWidth * 7 }}
              >
                {/* グリッド本体 (背景破線枠 + absoluteイベント) */}
                <View style={{ height: cardHeight * TIME_LABELS.length, position: 'relative' }}>
                  
                  {/* 背景破線グリッド */}
                  <View style={tw`absolute inset-0 flex-row`}>
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <View key={colIndex} style={{ width: colWidth }}>
                        {Array.from({ length: TIME_LABELS.length }).map((_, rowIndex) => (
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
                    const rowSpan = event.rowSpan || 1;
                    const displayTime = event.time.replace(' - ', '\n~ ');

                    const cardColWidth = (colWidth - 4) / event.overlapCount;
                    const cardLeft = event.dayIndex * colWidth + 2 + event.overlapIndex * cardColWidth;

                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        style={[
                          tw`rounded-[8px] absolute flex-row overflow-hidden border border-black/5`,
                          {
                            left: cardLeft,
                            top: event.rowIndex * cardHeight + 2,
                            width: cardColWidth - 2,
                            height: rowSpan * cardHeight - 4,
                            backgroundColor: colorScheme.bg,
                            zIndex: 10 + event.overlapIndex,
                          }
                        ]}
                      >
                        <View style={{ width: 3, height: '100%', backgroundColor: colorScheme.bar }} />
                        <View style={tw`flex-1 justify-center items-center p-[2px]`}>
                          <Text
                            style={[
                              tw`font-bold text-center mb-[2px]`,
                              {
                                fontSize: rowSpan > 1 ? 11 : 9,
                                color: colorScheme.text,
                              }
                            ]}
                          >
                            {event.durationText}
                          </Text>
                          <Text
                            style={[
                              tw`font-semibold text-center leading-[10px] opacity-75`,
                              {
                                fontSize: rowSpan > 1 ? 9 : 8,
                                color: colorScheme.text,
                              }
                            ]}
                          >
                            {displayTime}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Fixed bottom navigation */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation} />
    </View>
  );
}