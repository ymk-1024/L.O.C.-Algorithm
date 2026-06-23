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

  // 同時間帯の予定重なり（衝突）を判定し、横並びにするレイアウト計算
  // 同時間帯の予定重なり（衝突）を判定し、横並びにするレイアウト計算
  const processOverlaps = (eventsList) => {
    const daysEvents = Array.from({ length: 7 }, () => []);
    eventsList.forEach((e) => {
      const startRow = Number(e.rowIndex);
      const hours = Number(e.hours);
      const rowSpan = Math.max(1, Math.round(hours / 2));
      daysEvents[e.dayIndex].push({
        ...e,
        rowSpan,
        startRow,
        endRow: startRow + rowSpan,
        overlapIndex: 0,
        overlapCount: 1,
      });
    });

    daysEvents.forEach((dayEvents) => {
      if (dayEvents.length === 0) return;

      // 1. 開始時間が早い順、次に期間が長い（終了時間が遅い）順にソート
      dayEvents.sort((a, b) => {
        if (a.startRow !== b.startRow) {
          return a.startRow - b.startRow;
        }
        return b.rowSpan - a.rowSpan;
      });

      // 2. 衝突するイベントをグループ（接続成分）に分ける
      const groups = [];
      dayEvents.forEach((event) => {
        let placed = false;
        for (let g of groups) {
          const overlapsAny = g.some((ge) => {
            return event.startRow < ge.endRow && ge.startRow < event.endRow;
          });
          if (overlapsAny) {
            g.push(event);
            placed = true;
            break;
          }
        }
        if (!placed) {
          groups.push([event]);
        }
      });

      // 3. 各グループ内で、イベントをサブカラム（トラック）に割り当てる
      groups.forEach((group) => {
        const columns = []; // 各要素はイベントの配列（その列に配置されたもの）

        group.forEach((event) => {
          let colIndex = -1;
          for (let i = 0; i < columns.length; i++) {
            const lastEventInCol = columns[i][columns[i].length - 1];
            if (lastEventInCol.endRow <= event.startRow) {
              colIndex = i;
              break;
            }
          }

          if (colIndex !== -1) {
            columns[colIndex].push(event);
          } else {
            columns.push([event]);
            colIndex = columns.length - 1;
          }

          event.overlapIndex = colIndex;
        });

        const maxCols = columns.length;
        group.forEach((event) => {
          event.overlapCount = maxCols;
        });
      });
    });

    return daysEvents.flat();
  };

  const events = processOverlaps(rawEvents);

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
          
          <View style={tw`flex-row`}>
            {/* 左端: 固定時間軸ラベル */}
            <View style={{ width: timeColWidth, paddingTop: 46 }}>
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
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ width: colWidth * 7 }}
            >
              <View style={{ flex: 1 }}>
                
                {/* 曜日ヘッダー */}
                <View style={tw`flex-row border-b border-[#F2F2F7] pb-3 mb-2`}>
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
                    // 幅が広くなったので ' - ' を ' ~ ' に置き換えて見やすく折り返し
                    const displayTime = event.time.replace(' - ', '\n~ ');

                    // 重なり（衝突）数に応じて横幅を等分割する
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
                            width: cardColWidth - 2, // 等分された幅に設定
                            height: rowSpan * cardHeight - 4,
                            backgroundColor: colorScheme.bg,
                            zIndex: 10 + event.overlapIndex,
                          }
                        ]}
                      >
                        {/* 左端のカラーバー */}
                        <View style={{ width: 3, height: '100%', backgroundColor: colorScheme.bar }} />
                        
                        {/* 時刻表示 */}
                        <View style={tw`flex-1 justify-center items-center p-[2px]`}>
                          {rowSpan > 1 && (
                            <Text
                              style={[
                                tw`font-bold text-center mb-[2px] opacity-80`,
                                {
                                  fontSize: 9,
                                  color: colorScheme.text,
                                }
                              ]}
                            >
                              {event.hours}時間
                            </Text>
                          )}
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
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                </View>
              </View>
            </ScrollView>
          </View>

        </View>
      </ScrollView>

      {/* Fixed bottom navigation */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation} />
    </View>
  );
}