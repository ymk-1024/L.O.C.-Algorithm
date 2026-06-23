import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import AppHeader from './AppHeader';
import BottomMenuBar from './BottomMenuBar';

const { width } = Dimensions.get('window');
const marginHorizontal = 16;
const colWidth = (width - marginHorizontal * 2) / 7;
const cardHeight = 62;

const DAYS = [
  { key: 'Mon', label: '月', date: '15' },
  { key: 'Tue', label: '火', date: '16' },
  { key: 'Wed', label: '水', date: '17' },
  { key: 'Thu', label: '木', date: '18' },
  { key: 'Fri', label: '金', date: '19' },
  { key: 'Sat', label: '土', date: '20' },
  { key: 'Sun', label: '日', date: '21' },
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

// 7行のグリッドデータ
const GRID_ROWS_COUNT = 7;

const SCHEDULE_DATA = {
  Mon: [
    { hours: 1, time: '9:00~', type: 'green1' },
    { hours: 2, time: '9:00~', type: 'green2' },
    { hours: 3, time: '11:30~', type: 'green3' },
    { hours: 4, time: '16:00~', type: 'green4' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
  ],
  Tue: [
    { hours: 1, time: '13:00~', type: 'green1' },
    { hours: 2, time: '19:00~', type: 'green2' },
    { hours: 3, time: '11:00~', type: 'green3' },
    { hours: 4, time: '13:00~', type: 'green4' },
    { hours: 4, time: '15:00~', type: 'green5', span: 5 }, // 水〜土まで跨ぐ
    { type: 'empty' },
    { hours: 6, time: '16:00~', type: 'gray' },
  ],
  Wed: [
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'underSpan' }, // 火曜のまたがるカードの下に隠れる
    { hours: 5, time: '18:00~', type: 'green5' },
    { type: 'empty' },
  ],
  Thu: [
    { hours: 1, time: '19:00~', type: 'green1' },
    { hours: 2, time: '19:00~', type: 'green2' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'underSpan' }, // 火曜のまたがるカードの下に隠れる
    { type: 'empty' },
    { type: 'empty' },
  ],
  Fri: [
    { hours: 1, time: '12:00~', type: 'green1' },
    { hours: 2, time: '19:00~', type: 'green2' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'underSpan' }, // 火曜のまたがるカードの下に隠れる
    { type: 'empty' },
    { type: 'empty' },
  ],
  Sat: [
    { hours: 1, time: '19:30~', type: 'green1' },
    { hours: 2, time: '19:30~', type: 'green2' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'underSpan' }, // 火曜のまたがるカードの下に隠れる
    { type: 'empty' },
    { type: 'empty' },
  ],
  Sun: [
    { hours: 1, time: '9:00~', type: 'green1' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
    { type: 'empty' },
  ],
};

export default function Schedule({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={tw`flex-1 bg-[#F7F9FB]`}>
      <AppHeader />

      <ScrollView contentContainerStyle={tw`px-[${marginHorizontal}px] pb-6`}>
        {/* Title Banner */}
        <View style={tw`bg-[#EAF6F3] rounded-[20px] py-4 px-6 mb-5 items-center`}>
          <Text style={tw`text-[26px] font-bold text-[#1E3D37]`}>スケジュール</Text>
        </View>

        {/* Schedule Grid Box */}
        <View style={tw`bg-white rounded-[24px] p-3 shadow-sm border border-[#EAEAEA]`}>
          
          {/* Days Header */}
          <View style={tw`flex-row border-b border-[#F2F2F7] pb-3 mb-2`}>
            {DAYS.map((day) => (
              <View key={day.key} style={{ width: colWidth - 1, alignItems: 'center' }}>
                <Text style={tw`text-[13px] font-medium text-[#7E8B93] mb-1`}>{day.label}</Text>
                <Text style={tw`text-[16px] font-bold text-[#1C1C1E]`}>{day.date}</Text>
              </View>
            ))}
          </View>

          {/* Grid Layout */}
          <View style={tw`flex-row relative`}>
            {DAYS.map((day) => {
              const dayData = SCHEDULE_DATA[day.key] || [];
              return (
                <View key={day.key} style={{ width: colWidth - 1, zIndex: 1 }}>
                  {Array.from({ length: GRID_ROWS_COUNT }).map((_, rowIndex) => {
                    const cell = dayData[rowIndex] || { type: 'empty' };

                    // スパンカードが重なる非表示セル
                    if (cell.type === 'underSpan') {
                      return (
                        <View
                          key={rowIndex}
                          style={{ height: cardHeight, margin: 2 }}
                        />
                      );
                    }

                    // 空白セル
                    if (cell.type === 'empty') {
                      return (
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
                      );
                    }

                    // 通常またはスパンの予定カード
                    const colorScheme = colors[cell.type] || colors.green1;
                    const isSpan = cell.span > 1;

                    return (
                      <View
                        key={rowIndex}
                        style={[
                          tw`rounded-[8px] p-[3px] justify-center items-center`,
                          {
                            height: cardHeight - 4,
                            margin: 2,
                            backgroundColor: colorScheme.bg,
                          },
                          isSpan && {
                            position: 'absolute',
                            width: (colWidth - 1) * cell.span - 4,
                            zIndex: 10,
                            left: 0,
                          }
                        ]}
                      >
                        <Text
                          style={[
                            tw`font-bold text-center leading-[13px]`,
                            {
                              fontSize: isSpan ? 11 : 9,
                              color: colorScheme.text,
                            }
                          ]}
                          numberOfLines={2}
                        >
                          {cell.hours}時間の
                        </Text>
                        <Text
                          style={[
                            tw`font-bold text-center mt-[1px]`,
                            {
                              fontSize: isSpan ? 11 : 9,
                              color: colorScheme.text,
                            }
                          ]}
                        >
                          {cell.time}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* Fixed bottom navigation */}
      <BottomMenuBar activeTab="Schedule" navigation={navigation} />
    </View>
  );
}