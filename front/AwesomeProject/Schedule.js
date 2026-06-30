import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
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

  { dayIndex: 3, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },
  { dayIndex: 3, rowIndex: 5, hours: 2, time: '10:00 - 12:00', type: 'green2' },

  { dayIndex: 4, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },

  { dayIndex: 5, rowIndex: 4, hours: 2, time: '08:00 - 10:00', type: 'green1' },

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

  // 奇数週・偶数週のスケジュール状態
  const [eventsEven, setEventsEven] = useState([]);
  const [eventsOdd, setEventsOdd] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 登録モーダル用の状態
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]); // 複数曜日選択可
  const [startHour, setStartHour] = useState('08');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMin, setEndMin] = useState('00');
  const [selectedType, setSelectedType] = useState('green1');
  const [applyToBothWeeks, setApplyToBothWeeks] = useState(true);

  // 時・分の選択肢モーダル用
  const [pickerType, setPickerType] = useState(null); // 'startHour', 'startMin', 'endHour', 'endMin', または null

  // APIデータ取得（プレースホルダー）
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      console.log('[API Schedule] Mock: Fetching schedules from backend API...');
      
      // 1秒の擬似ディレイ
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 初期データをマップしてID付きで設定
      const initialEven = SCHEDULE_EVENTS_EVEN.map((e, index) => ({ ...e, id: `even-${index}` }));
      const initialOdd = SCHEDULE_EVENTS_ODD.map((e, index) => ({ ...e, id: `odd-${index}` }));

      setEventsEven(initialEven);
      setEventsOdd(initialOdd);
      console.log('[API Schedule] Mock: Schedules fetched successfully.');
    } catch (error) {
      console.error('[API Schedule] Error fetching schedules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // APIデータ保存（プレースホルダー）
  const saveSchedules = async (updatedEven, updatedOdd) => {
    try {
      console.log('[API Schedule] Mock: Saving updated schedules to backend API...');
      console.log('[API Schedule] Payload (Even):', JSON.stringify(updatedEven));
      console.log('[API Schedule] Payload (Odd):', JSON.stringify(updatedOdd));

      // 実際にはここで fetch(API_URL, { method: 'PUT', ... }) を行う
      // 例: await fetch(`${getApiUrl()}/schedules`, { method: 'PUT', body: ... })
      
      console.log('[API Schedule] Mock: Schedules saved successfully.');
    } catch (error) {
      console.error('[API Schedule] Error saving schedules:', error);
    }
  };

  // 初期ロード
  useEffect(() => {
    fetchSchedules();
  }, []);

  const openPicker = (type) => {
    setPickerType(type);
  };

  const handleSelectValue = (val) => {
    if (pickerType === 'startHour') setStartHour(val);
    if (pickerType === 'startMin') setStartMin(val);
    if (pickerType === 'endHour') setEndHour(val);
    if (pickerType === 'endMin') setEndMin(val);
    setPickerType(null);
  };

  // スケジュール登録
  const handleRegister = () => {
    if (selectedDays.length === 0) {
      Alert.alert('エラー', '曜日を選択してください。');
      return;
    }

    const startTotalMin = Number(startHour) * 60 + Number(startMin);
    const endTotalMin = Number(endHour) * 60 + Number(endMin);

    if (startTotalMin >= endTotalMin) {
      Alert.alert('エラー', '終了時刻は開始時刻より後に設定してください。');
      return;
    }

    const hours = (endTotalMin - startTotalMin) / 60;
    const rowIndex = startTotalMin / 120;

    // 選択された各曜日に対してイベントオブジェクトを作成
    const newEvents = selectedDays.map((dayIdx) => ({
      id: `custom-${Date.now()}-${dayIdx}-${Math.random()}`,
      dayIndex: dayIdx,
      rowIndex,
      hours,
      type: selectedType,
    }));

    let nextEven = [...eventsEven];
    let nextOdd = [...eventsOdd];

    if (applyToBothWeeks) {
      nextEven = [...nextEven, ...newEvents];
      nextOdd = [...nextOdd, ...newEvents];
    } else {
      if (isEvenWeek) {
        nextEven = [...nextEven, ...newEvents];
      } else {
        nextOdd = [...nextOdd, ...newEvents];
      }
    }

    setEventsEven(nextEven);
    setEventsOdd(nextOdd);
    saveSchedules(nextEven, nextOdd);

    // モーダルを閉じ、状態をリセット
    setModalVisible(false);
    setSelectedDays([]);
    setStartHour('08');
    setStartMin('00');
    setEndHour('10');
    setEndMin('00');
    setSelectedType('green1');
  };

  // スケジュール削除確認
  const handleCardPress = (event) => {
    Alert.alert(
      'スケジュールの削除',
      `${event.time} のスケジュールを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteEvent(event),
        },
      ]
    );
  };

  // スケジュール削除処理
  const deleteEvent = (eventToDelete) => {
    let nextEven = [...eventsEven];
    let nextOdd = [...eventsOdd];

    if (isEvenWeek) {
      nextEven = nextEven.filter((e) => e.id !== eventToDelete.id);
    } else {
      nextOdd = nextOdd.filter((e) => e.id !== eventToDelete.id);
    }

    setEventsEven(nextEven);
    setEventsOdd(nextOdd);
    saveSchedules(nextEven, nextOdd);
  };

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

  // 横スクロールScrollViewを操作するためのRef
  const horizontalScrollViewRef = useRef(null);

  // 選択中の日付を管理するState（初期値：今日）
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // 選択された日付の変更を検知して、該当する曜日の列位置まで自動スクロール
  useEffect(() => {
    const diffTime = selectedDate.getTime() - currentWeekStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 現在表示している週の範囲内（0〜6）であればスクロール実行
    if (diffDays >= 0 && diffDays < 7) {
      horizontalScrollViewRef.current?.scrollTo({
        x: diffDays * colWidth,
        animated: true,
      });
    }
  }, [selectedDate, currentWeekStart]);

  const changeWeek = (offsetWeeks) => {
    const nextMonday = new Date(currentWeekStart);
    nextMonday.setDate(currentWeekStart.getDate() + offsetWeeks * 7);
    setCurrentWeekStart(nextMonday);

    // 週を切り替えた際、選択中の日付も1週間ずらすことで選択状態を維持
    const nextSelected = new Date(selectedDate);
    nextSelected.setDate(selectedDate.getDate() + offsetWeeks * 7);
    setSelectedDate(nextSelected);
  };

  const setTodayWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);

    // 修正箇所: currentWeekStartを一度「現在の週の月曜日」のタイムスタンプに戻してから更新する
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date().setDate(diff)); // 完全に新しく作り直して参照の狂いを防ぐ
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getYearMonthLabel = () => {
    const year = currentWeekStart.getFullYear();
    const month = currentWeekStart.getMonth() + 1;
    return `${year}年 ${month}月`;
  };

  // タップ時に選択中の日付を更新する関数
  const handleDayPress = (day) => {
    setSelectedDate(day.fullDate);
  };

  const getDays = () => {
    const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const isToday = date.getTime() === today.getTime();
      const isSelected = date.getTime() === selectedDate.getTime();
      return {
        key: i,
        label: weekdays[i],
        date: date.getDate().toString(),
        fullDate: date,
        isToday,
        isSelected,
      };
    });
  };

  const weekTime = currentWeekStart.getTime();
  const isEvenWeek = Math.floor(weekTime / (1000 * 60 * 60 * 24 * 7)) % 2 === 0;
  const rawEvents = isEvenWeek ? eventsEven : eventsOdd;

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
                <TouchableOpacity
                  key={day.key}
                  style={{ width: colWidth, alignItems: 'center' }}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <Text style={tw`text-[13px] font-medium text-[#7E8B93] mb-1`}>{day.label}</Text>
                  <View style={[
                    tw`w-7 h-7 rounded-full items-center justify-center`,
                    day.isSelected ? tw`bg-[#1E3D37]` : (day.isToday ? tw`bg-[#1E3D37]/10` : null)
                  ]}>
                    <Text style={[
                      tw`text-[15px] font-bold`,
                      day.isSelected ? tw`text-white` : (day.isToday ? tw`text-[#1E3D37]` : tw`text-[#1C1C1E]`)
                    ]}>
                      {day.date}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                        onPress={() => handleCardPress(event)}
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

      {/* フローティング登録ボタン */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[
          tw`absolute w-14 h-14 bg-[#1E3D37] rounded-full items-center justify-center shadow-lg`,
          {
            right: 24,
            bottom: Math.max(insets.bottom, 16) + 68,
            zIndex: 99,
          }
        ]}
      >
        <Text style={tw`text-white text-[30px] font-semibold leading-[34px] text-center`}>+</Text>
      </TouchableOpacity>

      {/* スケジュール登録モーダル */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-row flex-1 bg-black/50 justify-end items-end`}>
          <View style={tw`bg-white rounded-t-[32px] p-6 pb-8 w-full`}>
            <Text style={tw`text-[20px] font-bold text-[#1E3D37] text-center mb-6`}>
              スケジュールを登録
            </Text>

            {/* 曜日選択 */}
            <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-2`}>曜日 (複数選択可)</Text>
            <View style={tw`flex-row justify-between mb-5`}>
              {['月', '火', '水', '木', '金', '土', '日'].map((dayLabel, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setSelectedDays((prev) =>
                        prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                      );
                    }}
                    style={[
                      tw`w-10 h-10 rounded-full justify-center items-center border`,
                      isSelected
                        ? tw`bg-[#1E3D37] border-[#1E3D37]`
                        : tw`bg-white border-gray-200`,
                    ]}
                  >
                    <Text
                      style={[
                        tw`text-[14px] font-bold`,
                        isSelected ? tw`text-white` : tw`text-[#1C1C1E]`,
                      ]}
                    >
                      {dayLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 時間設定 */}
            <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-2`}>時間帯</Text>
            <View style={tw`flex-row items-center justify-between mb-5 bg-[#F4F6F5] p-3 rounded-[16px]`}>
              {/* 開始時刻 */}
              <View style={tw`flex-row items-center gap-1`}>
                <TouchableOpacity
                  onPress={() => openPicker('startHour')}
                  style={tw`bg-white px-3 py-2 rounded-[8px] border border-gray-200`}
                >
                  <Text style={tw`text-[16px] font-bold text-black`}>{startHour}</Text>
                </TouchableOpacity>
                <Text style={tw`text-black font-semibold`}>:</Text>
                <TouchableOpacity
                  onPress={() => openPicker('startMin')}
                  style={tw`bg-white px-3 py-2 rounded-[8px] border border-gray-200`}
                >
                  <Text style={tw`text-[16px] font-bold text-black`}>{startMin}</Text>
                </TouchableOpacity>
              </View>

              <Text style={tw`text-gray-400 font-bold mx-2`}>〜</Text>

              {/* 終了時刻 */}
              <View style={tw`flex-row items-center gap-1`}>
                <TouchableOpacity
                  onPress={() => openPicker('endHour')}
                  style={tw`bg-white px-3 py-2 rounded-[8px] border border-gray-200`}
                >
                  <Text style={tw`text-[16px] font-bold text-black`}>{endHour}</Text>
                </TouchableOpacity>
                <Text style={tw`text-black font-semibold`}>:</Text>
                <TouchableOpacity
                  onPress={() => openPicker('endMin')}
                  style={tw`bg-white px-3 py-2 rounded-[8px] border border-gray-200`}
                >
                  <Text style={tw`text-[16px] font-bold text-black`}>{endMin}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* カラーグループ選択 */}
            <Text style={tw`text-[14px] font-bold text-[#7E8B93] mb-2`}>カラー</Text>
            <View style={tw`flex-row gap-3 mb-5`}>
              {['green1', 'green2', 'green3', 'green4', 'green5', 'gray'].map((type) => {
                const colorScheme = colors[type];
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={[
                      tw`w-8 h-8 rounded-full border-2 justify-center items-center`,
                      { backgroundColor: colorScheme.bg },
                      isSelected ? { borderColor: colorScheme.bar } : { borderColor: 'transparent' },
                    ]}
                  >
                    {isSelected && (
                      <View style={[tw`w-3 h-3 rounded-full`, { backgroundColor: colorScheme.bar }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 毎週適用トグル */}
            <View style={tw`flex-row justify-between items-center mb-6`}>
              <Text style={tw`text-[14px] font-bold text-[#1C1C1E]`}>毎週（奇数週・偶数週の両方）適用する</Text>
              <TouchableOpacity
                onPress={() => setApplyToBothWeeks(!applyToBothWeeks)}
                style={[
                  tw`w-12 h-6 rounded-full p-1 justify-center`,
                  applyToBothWeeks ? tw`bg-[#1E3D37] items-end` : tw`bg-gray-300 items-start`,
                ]}
              >
                <View style={tw`w-4 h-4 rounded-full bg-white`} />
              </TouchableOpacity>
            </View>

            {/* ボタン類 */}
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={tw`flex-1 py-3 bg-gray-100 rounded-full justify-center items-center`}
              >
                <Text style={tw`text-[#7E8B93] font-bold`}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRegister}
                style={tw`flex-1 py-3 bg-[#1E3D37] rounded-full justify-center items-center`}
              >
                <Text style={tw`text-white font-bold`}>登録する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 簡易選択ピッカーモーダル */}
      <Modal
        visible={pickerType !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={tw`flex-1 bg-black/40 justify-center items-center`}
          onPress={() => setPickerType(null)}
        >
          <View style={tw`bg-white rounded-[20px] w-64 max-h-80 p-4 shadow-xl`}>
            <Text style={tw`text-[16px] font-bold text-center text-[#1E3D37] mb-3`}>
              {pickerType?.includes('Hour') ? '時間を選択' : '分を選択'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(pickerType?.includes('Hour')
                ? Array.from({ length: 24 }).map((_, i) => String(i).padStart(2, '0'))
                : Array.from({ length: 12 }).map((_, i) => String(i * 5).padStart(2, '0'))
              ).map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => handleSelectValue(val)}
                  style={tw`py-3 border-b border-gray-100 items-center`}
                >
                  <Text style={tw`text-[18px] font-semibold text-[#1C1C1E]`}>{val}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fixed bottom navigation */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation} />
    </View>
  );
}