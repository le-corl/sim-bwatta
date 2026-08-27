export type Mission = {
  id: string;
  title: string;
  detail: string;
};

export const MISSIONS: readonly Mission[] = [
  { id: 'stretch', title: '기지개 한 번 길게', detail: '양팔을 위로 뻗고 천천히 숨을 세 번 쉬어요.' },
  { id: 'trash', title: '쓰레기 하나만 버리기', detail: '시야에 보이는 것 중 딱 하나만 골라 정리해요.' },
  { id: 'water', title: '물 세 모금 마시기', detail: '급하게 말고, 한 모금씩 나눠 마셔요.' },
  { id: 'shoulders', title: '어깨 열 번 돌리기', detail: '앞으로 다섯 번, 뒤로 다섯 번 천천히 돌려요.' },
  { id: 'desk-item', title: '물건 하나 제자리로', detail: '책상 위에서 가장 눈에 띄는 것 하나만 돌려놔요.' },
  { id: 'empty-cup', title: '빈 컵 하나 치우기', detail: '컵이나 그릇 하나를 싱크대나 제자리로 옮겨요.' },
  { id: 'close-tab', title: '안 쓰는 창 하나 닫기', detail: '브라우저 탭이나 프로그램 창 하나만 정리해요.' },
  { id: 'distant-gaze', title: '먼 곳 20초 보기', detail: '화면에서 눈을 떼고 가장 먼 곳을 편하게 바라봐요.' },
  { id: 'wrists', title: '손목 천천히 돌리기', detail: '양쪽 손목을 바깥쪽과 안쪽으로 다섯 번씩 돌려요.' },
  { id: 'one-note', title: '할 일 하나만 적기', detail: '오늘 꼭 기억할 일 하나를 메모장에 짧게 적어요.' },
  { id: 'floor-item', title: '바닥 물건 하나 줍기', detail: '발 주변에 놓인 물건 하나만 주워 제자리에 둬요.' },
  { id: 'wipe-spot', title: '손바닥만큼 닦기', detail: '책상이나 선반 한 곳을 손바닥 크기만큼 닦아요.' },
  { id: 'shoes', title: '신발 한 켤레 맞추기', detail: '흩어진 신발이나 슬리퍼 한 켤레만 가지런히 둬요.' },
  { id: 'posture', title: '자세 한 번 다시 잡기', detail: '엉덩이를 의자 안쪽에 두고 어깨 힘을 천천히 빼요.' },
  { id: 'five-breaths', title: '숨 다섯 번 세기', detail: '편한 자세로 천천히 숨 쉬며 다섯 번까지만 세어요.' },
] as const;
